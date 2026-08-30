import time
import base64
import io
import struct
import hmac
import hashlib
import uuid
import zlib
import urllib.parse
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import bcrypt
import jwt
import pyotp
import qrcode
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding

from core.state import mfa_secrets, jwt_secrets

router = APIRouter(tags=["Authentication & Identity"])


# --- SAML IdP Simulated RSA Keypair ---
saml_idp_private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)
saml_idp_public_key = saml_idp_private_key.public_key()
saml_idp_public_pem = saml_idp_public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')


# ==============================================================================
# LAB 1: Password Hashing API
# ==============================================================================
class HashRequest(BaseModel):
    password: str
    rounds: int = 12  # bcrypt work factor


@router.post("/api/hashing/hash")
def generate_hashes(req: HashRequest):
    try:
        # Measure SHA-256 time (usually instant)
        t0 = time.perf_counter()
        sha256_hash = hashes.Hash(hashes.SHA256())
        sha256_hash.update(req.password.encode())
        sha256_val = sha256_hash.finalize().hex()
        t_sha = time.perf_counter() - t0

        # Measure bcrypt time
        t0 = time.perf_counter()
        salt = bcrypt.gensalt(rounds=req.rounds)
        bcrypt_val = bcrypt.hashpw(req.password.encode(), salt).decode()
        t_bcrypt = time.perf_counter() - t0

        return {
            "password": req.password,
            "sha256": {
                "hash": sha256_val,
                "time_sec": t_sha
            },
            "bcrypt": {
                "hash": bcrypt_val,
                "rounds": req.rounds,
                "time_sec": t_bcrypt
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DictionaryAttackRequest(BaseModel):
    target_hash: str
    is_bcrypt: bool
    dictionary: List[str]


@router.post("/api/hashing/attack")
def dictionary_attack(req: DictionaryAttackRequest):
    attempts = 0
    t0 = time.perf_counter()
    
    for candidate in req.dictionary:
        attempts += 1
        if req.is_bcrypt:
            try:
                # Bcrypt comparison (slow)
                if bcrypt.checkpw(candidate.encode(), req.target_hash.encode()):
                    return {
                        "success": True,
                        "found_password": candidate,
                        "attempts": attempts,
                        "elapsed_time_sec": time.perf_counter() - t0
                    }
            except Exception:
                # Invalid bcrypt hash format
                pass
        else:
            # SHA-256 comparison (fast)
            sha256_hash = hashes.Hash(hashes.SHA256())
            sha256_hash.update(candidate.encode())
            candidate_hash = sha256_hash.finalize().hex()
            if candidate_hash == req.target_hash:
                return {
                    "success": True,
                    "found_password": candidate,
                    "attempts": attempts,
                    "elapsed_time_sec": time.perf_counter() - t0
                }
                
    return {
        "success": False,
        "attempts": attempts,
        "elapsed_time_sec": time.perf_counter() - t0
    }


# ==============================================================================
# LAB 2: JWT API
# ==============================================================================
class JWTGenerateRequest(BaseModel):
    user_id: str
    username: str
    role: str
    secret: str


@router.post("/api/jwt/generate")
def generate_jwt(req: JWTGenerateRequest):
    payload = {
        "sub": req.user_id,
        "username": req.username,
        "role": req.role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600
    }
    # Store custom secret to simulate server key
    jwt_secrets["current"] = req.secret
    token = jwt.encode(payload, req.secret, algorithm="HS256")
    return {"token": token, "payload": payload}


class JWTVerifyRequest(BaseModel):
    token: str
    expected_secret: str
    allow_none_alg: bool = False


@router.post("/api/jwt/verify")
def verify_jwt(req: JWTVerifyRequest):
    try:
        # Manual check for none algorithm vulnerability demo
        header = jwt.get_unverified_header(req.token)
        alg = header.get("alg", "").upper()
        
        if alg == "NONE":
            if req.allow_none_alg:
                # Vulnerability simulation: decode without verification
                payload = jwt.decode(req.token, options={"verify_signature": False})
                return {
                    "valid": True,
                    "message": "⚠️ 警告: alg: none 脆弱性により署名なしトークンが受け入れられました！",
                    "payload": payload,
                    "header": header
                }
            else:
                raise jwt.InvalidSignatureError("alg: none トークンは拒否されました（安全な設定）")

        # Standard HS256 verification
        payload = jwt.decode(req.token, req.expected_secret, algorithms=["HS256"])
        return {
            "valid": True,
            "message": "署名は正常に検証されました。",
            "payload": payload,
            "header": header
        }
    except jwt.ExpiredSignatureError:
        return {"valid": False, "message": "トークンの有効期限が切れています。"}
    except jwt.InvalidSignatureError:
        return {"valid": False, "message": "デジタル署名が無効です（改ざん検知または秘密鍵の不一致）。"}
    except Exception as e:
        return {"valid": False, "message": f"エラー: {str(e)}"}


# ==============================================================================
# LAB 3: MFA / TOTP API
# ==============================================================================
@router.get("/api/mfa/setup")
def setup_mfa(user: str = "user@example.com"):
    # Generate random secret key
    secret = pyotp.random_base32()
    mfa_secrets[user] = secret
    
    # Generate provisioning URI
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user, issuer_name="SecurityAuthLab")
    
    # Generate QR Code image
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to base64
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode()
    
    return {
        "user": user,
        "secret": secret,
        "qr_code_base64": f"data:image/png;base64,{qr_base64}",
        "provisioning_uri": provisioning_uri
    }


class MFAVerifyRequest(BaseModel):
    user: str
    token: str


@router.post("/api/mfa/verify")
def verify_mfa(req: MFAVerifyRequest):
    secret = mfa_secrets.get(req.user)
    if not secret:
        raise HTTPException(status_code=400, detail="MFAがセットアップされていません。")
        
    totp = pyotp.TOTP(secret)
    is_valid = totp.verify(req.token)
    
    current_time = int(time.time())
    current_step = current_time // 30
    
    logs = []
    
    try:
        b32_padding = len(secret) % 8
        padded_secret = secret
        if b32_padding != 0:
            padded_secret += "=" * (8 - b32_padding)
        secret_bytes = base64.b32decode(padded_secret.encode('ascii'), casefold=True)
        logs.append(f"1. Base32シークレットをデコードしました: {secret} -> {secret_bytes.hex()}")
    except Exception as e:
        secret_bytes = b""
        logs.append(f"1. シークレットのデコードに失敗しました: {str(e)}")

    step_range = [current_step - 1, current_step, current_step + 1]
    
    logs.append(f"2. サーバーの現在時刻: {current_time} (Unix Epoch)")
    logs.append(f"3. 現在のタイムステップ番号 (t = epoch // 30): {current_step}")
    logs.append("4. 時刻のズレを考慮し、前後1ステップ（t-1, t, t+1）のOTPを算出・検証します:")
    
    for step in step_range:
        counter_bytes = struct.pack(">Q", step)
        if secret_bytes:
            hasher = hmac.new(secret_bytes, counter_bytes, hashlib.sha1)
            hmac_hash = hasher.digest()
            offset = hmac_hash[-1] & 0x0f
            truncated = struct.unpack(">I", hmac_hash[offset:offset+4])[0] & 0x7fffffff
            otp = truncated % 1000000
            otp_str = f"{otp:06d}"
        else:
            hmac_hash = b""
            truncated = 0
            offset = 0
            otp_str = "000000"
            
        step_time_str = datetime.fromtimestamp(step * 30, tz=timezone.utc).strftime('%H:%M:%S')
        is_match = (otp_str == req.token)
        match_marker = " [★一致]" if is_match else ""
        logs.append(f"   - タイムステップ {step} (基準時間 {step_time_str} UTC):")
        logs.append(f"     * カウンタ (HEX): {counter_bytes.hex()}")
        if hmac_hash:
            logs.append(f"     * HMAC-SHA1: {hmac_hash.hex()}")
            logs.append(f"     * 抽出値 (オフセット {offset}): {truncated} (HEX: {truncated:08x})")
        logs.append(f"     * 生成OTP: {otp_str}{match_marker}")
        
    if is_valid:
        logs.append(f"5. 判定結果: 入力されたコード '{req.token}' は、サーバーが計算したOTPと一致しました。認証成功。")
    else:
        logs.append(f"5. 判定結果: 入力されたコード '{req.token}' は、検証対象のどのタイムステップのOTPとも一致しませんでした。認証失敗。")

    return {
        "valid": is_valid,
        "server_info": {
            "current_unix_time": current_time,
            "time_step_counter": current_step,
            "calculated_otp": totp.now(),
            "verification_logs": logs
        }
    }


# ==============================================================================
# LAB 8: Kerberos Protocol Simulation API
# ==============================================================================
class KerberosRequest(BaseModel):
    step: str
    username: str = "user"
    service_name: str = "CIFS/file_server"


@router.post("/api/auth/kerberos")
def simulate_kerberos(req: KerberosRequest):
    session_key_client_tgs = "K_c_tgs_session_key_abc123"
    session_key_client_server = "K_c_s_session_key_xyz987"
    timestamp = int(time.time())
    
    if req.step == "AS-REQ":
        tgt = {
            "cname": req.username,
            "sname": "krbtgt/realm",
            "authtime": timestamp,
            "endtime": timestamp + 36000,
            "key": session_key_client_tgs
        }
        encrypted_tgt = "TGT_Encrypted(With_K_tgs)_" + base64.b64encode(f"TGT:{tgt}".encode()).decode()[:40] + "..."
        encrypted_session_key = "SessionKey_Encrypted(With_K_user)_" + base64.b64encode(session_key_client_tgs.encode()).decode()[:20] + "..."
        
        return {
            "step": "AS-REP (認証サービス応答)",
            "sent_request": f"AS-REQ: [cname={req.username}, sname=krbtgt/realm]",
            "response": {
                "tgt_hex": encrypted_tgt,
                "session_key_enc": encrypted_session_key,
                "raw_tgt_content_visible": tgt,
                "session_key": session_key_client_tgs
            },
            "explanation": "【解説】ユーザーはIDをASに送信（パスワードは送信しない）。ASはユーザーのパスワードから導出した鍵(K_user)でセッション鍵を暗号化し、かつTGSの鍵(K_tgs)で暗号化した「TGT (チケット送信チケット)」を返します。これによりパスワードの通信経路上への漏洩を防ぎます。"
        }
        
    elif req.step == "TGS-REQ":
        service_ticket = {
            "cname": req.username,
            "sname": req.service_name,
            "authtime": timestamp,
            "endtime": timestamp + 36000,
            "key": session_key_client_server
        }
        encrypted_st = "ST_Encrypted(With_K_server)_" + base64.b64encode(f"ST:{service_ticket}".encode()).decode()[:40] + "..."
        encrypted_session_key = "SessionKey_Encrypted(With_K_c_tgs)_" + base64.b64encode(session_key_client_server.encode()).decode()[:20] + "..."
        
        return {
            "step": "TGS-REP (チケット交付応答)",
            "sent_request": f"TGS-REQ: [TGT, Authenticator(タイムスタンプ暗号化), 申請サービス={req.service_name}]",
            "response": {
                "st_hex": encrypted_st,
                "session_key_enc": encrypted_session_key,
                "raw_st_content_visible": service_ticket,
                "session_key": session_key_client_server
            },
            "explanation": "【解説】TGSはTGTを復号してセッション鍵(K_c_tgs)を取り出し、Authenticatorのタイムスタンプを検証してリプレイ攻撃を検知します。問題なければ、目的のサービスサーバーの鍵(K_server)で暗号化した「サービスチケット(ST)」を発行します。"
        }
        
    elif req.step == "AP-REQ":
        return {
            "step": "AP-REP (アプリケーション認証完了・相互認証)",
            "sent_request": f"AP-REQ: [サービスチケット(ST), Authenticator]",
            "response": {
                "mutual_auth_success": True,
                "authenticated_user": req.username,
                "target_service": req.service_name,
                "access_granted": True
            },
            "explanation": "【解説】APサーバーは自身の秘密鍵でサービスチケットを復号し、中に入っているセッション鍵でAuthenticatorを検証。正規のユーザーであることを確認し、ファイルやDBへのアクセスを許可します。"
        }
    else:
        raise HTTPException(status_code=400, detail="不正なステップです。")


# ==============================================================================
# LAB 14: SAML 2.0 / GakuNin SSO API
# ==============================================================================
class SAMLAuthenticateRequest(BaseModel):
    username: str
    authn_request_id: str


class SAMLVerifyRequest(BaseModel):
    saml_response_xml: str
    expected_in_response_to: str
    time_offset_seconds: int = 0


@router.post("/api/saml/initiate")
def saml_initiate():
    request_id = "_" + str(uuid.uuid4())
    issue_instant = datetime.now(timezone.utc).isoformat()
    
    entity_id = "https://sp.sciencesearch.jp/saml2"
    acs_url = "https://sp.sciencesearch.jp/saml2/acs"
    destination = "https://idp.university.ac.jp/idp/profile/SAML2/Redirect/SSO"
    
    authn_request_xml = (
        f'<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" '
        f'xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" '
        f'ID="{request_id}" Version="2.0" IssueInstant="{issue_instant}" '
        f'Destination="{destination}" AssertionConsumerServiceURL="{acs_url}" '
        f'ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">\n'
        f'  <saml:Issuer>{entity_id}</saml:Issuer>\n'
        f'  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified" AllowCreate="true"/>\n'
        f'</samlp:AuthnRequest>'
    )
    
    # Raw DEFLATE compression without zlib headers
    compressor = zlib.compressobj(zlib.Z_DEFAULT_COMPRESSION, zlib.DEFLATED, -zlib.MAX_WBITS)
    compressed = compressor.compress(authn_request_xml.encode('utf-8')) + compressor.flush()
    saml_request_b64 = base64.b64encode(compressed).decode('utf-8')
    redirect_url = f"{destination}?SAMLRequest={urllib.parse.quote(saml_request_b64)}"
    
    return {
        "request_id": request_id,
        "entity_id": entity_id,
        "acs_url": acs_url,
        "destination": destination,
        "xml": authn_request_xml,
        "saml_request_b64": saml_request_b64,
        "redirect_url": redirect_url
    }


@router.post("/api/saml/authenticate")
def saml_authenticate(req: SAMLAuthenticateRequest):
    response_id = "_" + str(uuid.uuid4())
    assertion_id = "_" + str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    issue_instant = now.isoformat()
    
    not_before = (now - timedelta(minutes=2)).isoformat()
    not_on_or_after = (now + timedelta(minutes=5)).isoformat()
    
    sp_entity_id = "https://sp.sciencesearch.jp/saml2"
    idp_entity_id = "https://idp.university.ac.jp/idp/shibboleth"
    recipient_acs = "https://sp.sciencesearch.jp/saml2/acs"
    
    role = "faculty" if "sensei" in req.username.lower() or "prof" in req.username.lower() else "student"
    email = f"{req.username}@university.ac.jp"
    
    assertion_xml_template = (
        f'<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" '
        f'ID="{assertion_id}" IssueInstant="{issue_instant}" Version="2.0">\n'
        f'  <saml:Issuer>{idp_entity_id}</saml:Issuer>\n'
        f'  <saml:Subject>\n'
        f'    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">{req.username}</saml:NameID>\n'
        f'    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">\n'
        f'      <saml:SubjectConfirmationData InResponseTo="{req.authn_request_id}" '
        f'NotOnOrAfter="{not_on_or_after}" Recipient="{recipient_acs}"/>\n'
        f'    </saml:SubjectConfirmation>\n'
        f'  </saml:Subject>\n'
        f'  <saml:Conditions NotBefore="{not_before}" NotOnOrAfter="{not_on_or_after}">\n'
        f'    <saml:AudienceRestriction>\n'
        f'      <saml:Audience>{sp_entity_id}</saml:Audience>\n'
        f'    </saml:AudienceRestriction>\n'
        f'  </saml:Conditions>\n'
        f'  <saml:AuthnStatement AuthnInstant="{issue_instant}">\n'
        f'    <saml:AuthnContext>\n'
        f'      <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>\n'
        f'    </saml:AuthnContext>\n'
        f'  </saml:AuthnStatement>\n'
        f'  <saml:AttributeStatement>\n'
        f'    <saml:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="mail">\n'
        f'      <saml:AttributeValue>{email}</saml:AttributeValue>\n'
        f'    </saml:Attribute>\n'
        f'    <saml:Attribute Name="urn:oid:1.3.6.1.4.1.5923.1.1.1.1" FriendlyName="eduPersonAffiliation">\n'
        f'      <saml:AttributeValue>{role}</saml:AttributeValue>\n'
        f'      <saml:AttributeValue>member</saml:AttributeValue>\n'
        f'    </saml:Attribute>\n'
        f'  </saml:AttributeStatement>\n'
        f'</saml:Assertion>'
    )
    
    assertion_bytes = assertion_xml_template.encode('utf-8')
    signature = saml_idp_private_key.sign(
        assertion_bytes,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    signature_b64 = base64.b64encode(signature).decode('utf-8')
    
    saml_response_xml = (
        f'<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" '
        f'xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" '
        f'ID="{response_id}" Version="2.0" IssueInstant="{issue_instant}" '
        f'Destination="{recipient_acs}" InResponseTo="{req.authn_request_id}">\n'
        f'  <saml:Issuer>{idp_entity_id}</saml:Issuer>\n'
        f'  <samlp:Status>\n'
        f'    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>\n'
        f'  </samlp:Status>\n'
        f'  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">\n'
        f'    <ds:SignedInfo>\n'
        f'      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>\n'
        f'      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>\n'
        f'      <ds:Reference>\n'
        f'        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>\n'
        f'      </ds:Reference>\n'
        f'    </ds:SignedInfo>\n'
        f'    <ds:SignatureValue>{signature_b64}</ds:SignatureValue>\n'
        f'  </ds:Signature>\n'
        f'{assertion_xml_template}\n'
        f'</samlp:Response>'
    )
    
    saml_response_b64 = base64.b64encode(saml_response_xml.encode('utf-8')).decode('utf-8')
    
    return {
        "response_id": response_id,
        "assertion_id": assertion_id,
        "username": req.username,
        "role": role,
        "email": email,
        "xml": saml_response_xml,
        "assertion_xml": assertion_xml_template,
        "saml_response_b64": saml_response_b64,
        "public_key_pem": saml_idp_public_pem
    }


@router.post("/api/saml/verify")
def saml_verify(req: SAMLVerifyRequest):
    xml = req.saml_response_xml
    
    try:
        root = ET.fromstring(xml)
    except Exception as e:
        return {
            "success": False,
            "overall_status": "XML_PARSE_ERROR",
            "error_message": f"XMLの解析に失敗しました。構文が正しいか確認してください。(Error: {str(e)})",
            "checks": {
                "signature": {"status": "FAILED", "msg": "XML解析エラーのため検証不可"},
                "conditions": {"status": "FAILED", "msg": "XML解析エラーのため検証不可"},
                "audience": {"status": "FAILED", "msg": "XML解析エラーのため検証不可"},
                "in_response_to": {"status": "FAILED", "msg": "XML解析エラーのため検証不可"},
                "recipient": {"status": "FAILED", "msg": "XML解析エラーのため検証不可"}
            }
        }

    ns = {
        'saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        'samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
        'ds': 'http://www.w3.org/2000/09/xmldsig#'
    }

    def find_element(path, root_el):
        el = root_el.find(path, ns)
        if el is not None:
            return el
        tag_name = path.split('/')[-1].split(':')[-1]
        for elem in root_el.iter():
            if elem.tag.endswith(tag_name):
                return elem
        return None

    sig_val_el = find_element('.//ds:SignatureValue', root)
    assertion_el = find_element('.//saml:Assertion', root)
    
    assertion_match = re.search(r'(<saml:Assertion.*?</saml:Assertion>)', xml, re.DOTALL)
    if not assertion_match:
        assertion_match = re.search(r'(<Assertion.*?</Assertion>)', xml, re.DOTALL)

    # 1. Signature Check
    sig_verified = False
    sig_error = ""
    if sig_val_el is None or not sig_val_el.text:
        sig_error = "ds:SignatureValue 要素が存在しません。"
    elif not assertion_match:
        sig_error = "SAMLアサーション要素が見つかりません。"
    else:
        try:
            sig_bytes = base64.b64decode(sig_val_el.text.strip())
            assertion_content = assertion_match.group(1).encode('utf-8')
            saml_idp_public_key.verify(
                sig_bytes,
                assertion_content,
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            sig_verified = True
        except Exception as e:
            sig_error = str(e)

    # 2. Extract elements for Conditions, Audience, InResponseTo, Recipient
    cond_el = find_element('.//saml:Conditions', root)
    not_before_str = cond_el.attrib.get('NotBefore') if cond_el is not None else None
    not_on_or_after_str = cond_el.attrib.get('NotOnOrAfter') if cond_el is not None else None

    aud_el = find_element('.//saml:Audience', root)
    audience_val = aud_el.text.strip() if aud_el is not None and aud_el.text else None

    in_response_to_val = root.attrib.get('InResponseTo')
    sub_conf_data_el = find_element('.//saml:SubjectConfirmationData', root)
    if not in_response_to_val and sub_conf_data_el is not None:
        in_response_to_val = sub_conf_data_el.attrib.get('InResponseTo')

    recipient_val = sub_conf_data_el.attrib.get('Recipient') if sub_conf_data_el is not None else None

    checks = {}

    if sig_verified:
        checks["signature"] = {
            "status": "SUCCESS",
            "msg": "デジタル署名は有効です。アサーションは信頼されたIdPの秘密鍵で署名されており、改ざんされていません。"
        }
    else:
        checks["signature"] = {
            "status": "FAILED",
            "msg": f"デジタル署名の検証に失敗しました。アサーションの内容（ユーザー情報や有効期限など）が改ざんされているか、署名が正しくありません。(エラー: {sig_error})"
        }

    simulated_now = datetime.now(timezone.utc) + timedelta(seconds=req.time_offset_seconds)
    
    cond_ok = False
    cond_msg = ""
    if not_before_str and not_on_or_after_str:
        try:
            nb_dt = datetime.fromisoformat(not_before_str.replace('Z', '+00:00'))
            noa_dt = datetime.fromisoformat(not_on_or_after_str.replace('Z', '+00:00'))
            
            if nb_dt <= simulated_now <= noa_dt:
                cond_ok = True
                cond_msg = f"有効期間内です。(有効期間: {not_before_str} 〜 {not_on_or_after_str}, 検証基準時刻: {simulated_now.isoformat()})"
            elif simulated_now < nb_dt:
                cond_msg = f"有効期間前です。まだ有効になっていません。(有効開始予定: {not_before_str}, 検証基準時刻: {simulated_now.isoformat()})"
            else:
                cond_msg = f"有効期限切れです。(有効期限: {not_on_or_after_str}, 検証基準時刻: {simulated_now.isoformat()})"
        except Exception as e:
            cond_msg = f"有効期限のパースに失敗しました: {str(e)}"
    else:
        cond_msg = "有効期限情報 (NotBefore / NotOnOrAfter) が存在しません。"

    checks["conditions"] = {
        "status": "SUCCESS" if cond_ok else "FAILED",
        "msg": cond_msg
    }

    sp_entity_id = "https://sp.sciencesearch.jp/saml2"
    aud_ok = (audience_val == sp_entity_id)
    checks["audience"] = {
        "status": "SUCCESS" if aud_ok else "FAILED",
        "msg": f"期待値: {sp_entity_id}, 受信値: {audience_val or '[未設定]'}. " + (
            "一致しました。自サービス宛てのアサーションです。" if aud_ok else "不一致です！このアサーションは別のサービスプロバイダ(SP)宛てに発行されたものです。"
        )
    }

    in_resp_ok = (in_response_to_val == req.expected_in_response_to)
    checks["in_response_to"] = {
        "status": "SUCCESS" if in_resp_ok else "FAILED",
        "msg": f"期待されるID: {req.expected_in_response_to}, 受信値: {in_response_to_val or '[未設定]'}. " + (
            "一致しました。SPが要求したリクエストに対する正しい応答です。" if in_resp_ok else "不一致です！セッションハイジャックやリプレイ攻撃の可能性があります。"
        )
    }

    recipient_acs = "https://sp.sciencesearch.jp/saml2/acs"
    recipient_ok = (recipient_val == recipient_acs)
    checks["recipient"] = {
        "status": "SUCCESS" if recipient_ok else "FAILED",
        "msg": f"期待値: {recipient_acs}, 受信値: {recipient_val or '[未設定]'}. " + (
            "一致しました。正しい受信エンドポイント(ACS)に送信されています。" if recipient_ok else "不一致です！SAMLResponseの送信先ACSエンドポイントが不正です。"
        )
    }

    username_val = "unknown"
    role_val = "unknown"
    email_val = "unknown"
    
    nameid_el = find_element('.//saml:NameID', root)
    if nameid_el is not None and nameid_el.text:
        username_val = nameid_el.text.strip()
    
    attr_els = root.findall('.//saml:Attribute', ns)
    if not attr_els:
        for elem in root.iter():
            if elem.tag.endswith('Attribute'):
                attr_els.append(elem)

    for attr in attr_els:
        name = attr.attrib.get('Name') or ""
        friendly_name = attr.attrib.get('FriendlyName') or ""
        val_el = find_element('saml:AttributeValue', attr)
        if val_el is not None and val_el.text:
            val_text = val_el.text.strip()
            if 'eduPersonAffiliation' in name or 'affiliation' in name or 'eduPersonAffiliation' in friendly_name or 'affiliation' in friendly_name:
                role_val = val_text
            elif 'mail' in name or 'mail' in friendly_name:
                email_val = val_text

    overall_success = all(c["status"] == "SUCCESS" for c in checks.values())

    return {
        "success": overall_success,
        "overall_status": "AUTHENTICATED" if overall_success else "VERIFICATION_FAILED",
        "checks": checks,
        "user_info": {
            "username": username_val,
            "role": role_val,
            "email": email_val
        }
    }


# ==============================================================================
# LAB 16: IEEE 802.1X / EAP Authentication API
# ==============================================================================
class EapVerifyRequest(BaseModel):
    method: str
    username: str
    client_cert_present: bool = False
    pac_present: bool = False
    response_hash: str = ""


@router.post("/api/eap/verify")
def verify_eap(req: EapVerifyRequest):
    method = req.method.upper()
    logs = []
    valid = False
    message = ""
    
    logs.append(f"[RADIUS Info] RADIUS Access-Request received from Authenticator (NAS-IP-Address: 192.168.1.1)")
    logs.append(f"[RADIUS Info] User Identity parsed: '{req.username}'")
    logs.append(f"[RADIUS Info] EAP authentication method selected: EAP-{method}")
    
    if method == "MD5":
        logs.append(f"[EAP-MD5] EAP-Request/MD5-Challenge sent to Supplicant.")
        logs.append(f"[EAP-MD5] Received Supplicant MD5-Response: '{req.response_hash}'")
        if req.response_hash and req.response_hash != "invalid":
            logs.append(f"[EAP-MD5] Success: Calculated MD5 hash match for user '{req.username}'")
            valid = True
            message = "EAP-MD5認証成功: ハッシュ値が一致しました（盗聴によるオフライン辞書攻撃のリスクに注意してください）。"
        else:
            logs.append(f"[EAP-MD5] Error: MD5 hash challenge mismatch.")
            message = "EAP-MD5認証失敗: ハッシュ値が一致しません。"
            
    elif method == "LEAP":
        logs.append(f"[LEAP] Initiating Cisco proprietary LEAP MS-CHAP v1 challenge.")
        logs.append(f"[LEAP] Received Peer response hash: '{req.response_hash}'")
        if req.response_hash and req.response_hash != "invalid":
            logs.append(f"[LEAP] Success: MS-CHAP challenge match.")
            logs.append(f"[LEAP] Warning: LEAP is vulnerable to offline dictionary attack tool ASLEAP.")
            valid = True
            message = "LEAP認証成功: チャレンジ応答が一致しました。"
        else:
            logs.append(f"[LEAP] Error: Challenge mismatch.")
            message = "LEAP認証失敗: チャレンジ応答が不一致。"
            
    elif method == "EAP-FAST":
        logs.append(f"[EAP-FAST] Establishing TLS tunnel using PAC (Protected Access Credential)...")
        if req.pac_present:
            logs.append(f"[EAP-FAST] Valid PAC credential presented by Supplicant. Decrypted PAC-Key successfully.")
            logs.append(f"[EAP-FAST] Established outer TLS tunnel using PAC-Key. Bypassed server certificate requirement.")
            logs.append(f"[EAP-FAST] Inner Authentication (MS-CHAPv2) completed inside TLS tunnel.")
            valid = True
            message = "EAP-FAST認証成功: クライアント証明書不要で、PACキーを使用してTLSトンネルが確立され、内部認証が完了しました。"
        else:
            logs.append(f"[EAP-FAST] Error: PAC credential missing or expired.")
            message = "EAP-FAST認証失敗: 有効なPAC情報が提示されていません。"
            
    elif method == "TLS":
        logs.append(f"[EAP-TLS] Initiating standard TLS Handshake (Mutual Authentication)...")
        logs.append(f"[EAP-TLS] Sending RADIUS Server Certificate for verification...")
        logs.append(f"[EAP-TLS] Requesting Client Certificate from Supplicant (Mutual Auth)...")
        if req.client_cert_present:
            logs.append(f"[EAP-TLS] Client Certificate received: CN={req.username}, Issuer=SecurityLabCA")
            logs.append(f"[EAP-TLS] Verifying signature against CA root... Valid!")
            logs.append(f"[EAP-TLS] TLS key exchange completed. Established TLS secure session.")
            valid = True
            message = "EAP-TLS認証成功: クライアントとサーバーの双方でデジタル証明書を検証し、相互認証（Mutual Authentication）が成功しました。"
        else:
            logs.append(f"[EAP-TLS] Error: Client certificate was requested but not presented.")
            message = "EAP-TLS認証失敗: クライアント証明書が提示されていません（EAP-TLSでは双方向の証明書検証が必須です）。"
            
    elif method == "TTLS":
        logs.append(f"[EAP-TTLS] Initiating TLS Handshake (Server-only Authentication)...")
        logs.append(f"[EAP-TTLS] Sending RADIUS Server Certificate to Supplicant...")
        logs.append(f"[EAP-TTLS] established secure TLS tunnel. Client certificate check skipped (Optional).")
        logs.append(f"[EAP-TTLS] Performing inner authentication (MS-CHAPv2) inside the TLS tunnel...")
        if req.response_hash and req.response_hash != "invalid":
            logs.append(f"[EAP-TTLS] Inner MS-CHAPv2 verification succeeded inside TLS tunnel.")
            valid = True
            message = "EAP-TTLS認証成功: サーバー側証明書でTLSトンネルを確立し、トンネル内で安全に送信されたユーザーID/パスワードによる認証に成功しました。"
        else:
            logs.append(f"[EAP-TTLS] Error: Inner credentials validation failed.")
            message = "EAP-TTLS認証失敗: トンネル内でのユーザー認証に失敗しました。"
            
    elif method == "PEAP":
        logs.append(f"[PEAP] Initiating PEAP TLS Handshake (Server-only Authentication)...")
        logs.append(f"[PEAP] Sending RADIUS Server Certificate to Supplicant...")
        logs.append(f"[PEAP] established outer secure TLS tunnel.")
        logs.append(f"[PEAP] Executing inner EAP authentication method (typically EAP-MSCHAPv2) inside TLS tunnel...")
        if req.response_hash and req.response_hash != "invalid":
            logs.append(f"[PEAP] Inner MS-CHAPv2 authentication successful.")
            valid = True
            message = "PEAP認証成功: サーバー証明書によるTLSトンネル内で、EAP-MSCHAPv2を用いた安全なユーザー認証に成功しました。"
        else:
            logs.append(f"[PEAP] Error: Inner MS-CHAPv2 authentication failed.")
            message = "PEAP認証失敗: PEAPトンネル内でのMS-CHAPv2認証に失敗しました。"
            
    if valid:
        logs.append(f"[RADIUS Info] RADIUS Access-Accept sent to Authenticator")
    else:
        logs.append(f"[RADIUS Info] RADIUS Access-Reject sent to Authenticator")
        
    return {
        "valid": valid,
        "message": message,
        "verification_logs": logs
    }
