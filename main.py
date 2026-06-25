import time
import base64
import io
import os
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Library imports for labs
import bcrypt
import jwt
import pyotp
import qrcode
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

app = FastAPI(title="Security & Auth Lab (セキスペ対策)")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared memory stores (simulated database)
mfa_secrets: Dict[str, str] = {}
rsa_key_pairs: Dict[str, Dict[str, Any]] = {}
jwt_secrets: Dict[str, str] = {"default": "super-secret-key-12345"}

# List of modules for dynamic frontend registration
MODULES = [
    {
        "id": "hashing",
        "title": "パスワードハッシュ化＆ソルト",
        "description": "SHA-256 vs bcrypt の比較、辞書攻撃シミュレーションを通じて、ソルトとストレッチングの重要性を学びます。",
        "jsFile": "lab_hashing.js"
    },
    {
        "id": "jwt",
        "title": "JWTセキュリティ",
        "description": "JWTの構造、改ざん検知、および「alg: none」の脆弱性を体験的に学びます。",
        "jsFile": "lab_jwt.js"
    },
    {
        "id": "mfa",
        "title": "多要素認証 (MFA) & TOTP",
        "description": "TOTPの仕組み、共有鍵、30秒有効期間の計算、QRコード連携を学びます。",
        "jsFile": "lab_mfa.js"
    },
    {
        "id": "oauth",
        "title": "OAuth 2.0 / OIDC フロー",
        "description": "認可コードフローや state パラメータによるCSRF対策をインタラクティブに学びます。",
        "jsFile": "lab_oauth.js"
    },
    {
        "id": "crypto",
        "title": "暗号化＆デジタル署名",
        "description": "AES（共通鍵）とRSA（公開鍵）の使い分け、デジタル署名による改ざん検知を学びます。",
        "jsFile": "lab_crypto.js"
    },
    {
        "id": "network",
        "title": "FW / IDS・IPS / WAF 使い分け",
        "description": "ファイアウォール、IDS/IPS、WAFのそれぞれの処理レイヤーや防御対象の違いを体系的に学びます。",
        "jsFile": "lab_network.js"
    },
    {
        "id": "vuln",
        "title": "Web脆弱性攻撃と防衛 (SQLi / XSS)",
        "description": "SQLインジェクションやクロスサイトスクリプティング（XSS）の脆弱性と、セキュアコーディングでの防御を体験します。",
        "jsFile": "lab_vuln.js"
    },
    {
        "id": "kerberos",
        "title": "認証プロトコル・ログ解析 (Kerberos)",
        "description": "Kerberos認証チケットの発行プロセスと、チケットをデコードした認証ログの解析を学びます。",
        "jsFile": "lab_kerberos.js"
    },
    {
        "id": "ipsec",
        "title": "IPsec構造・IKE交換",
        "description": "IPsecカプセル化（Tunnel/Transport、AH/ESP）パケットと、IKE Phase 1・Phase 2の通信シーケンスを学びます。",
        "jsFile": "lab_ipsec.js"
    }
]

# API: Get registered modules
@app.get("/api/modules")
def get_modules():
    return MODULES

# --- LAB 1: Hashing API ---
class HashRequest(BaseModel):
    password: str
    rounds: int = 12  # bcrypt work factor

@app.post("/api/hashing/hash")
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

@app.post("/api/hashing/attack")
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


# --- LAB 2: JWT API ---
class JWTGenerateRequest(BaseModel):
    user_id: str
    username: str
    role: str
    secret: str

@app.post("/api/jwt/generate")
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

@app.post("/api/jwt/verify")
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


# --- LAB 3: MFA / TOTP API ---
@app.get("/api/mfa/setup")
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

@app.post("/api/mfa/verify")
def verify_mfa(req: MFAVerifyRequest):
    secret = mfa_secrets.get(req.user)
    if not secret:
        raise HTTPException(status_code=400, detail="MFAがセットアップされていません。")
        
    totp = pyotp.TOTP(secret)
    # verify returns boolean
    is_valid = totp.verify(req.token)
    
    # Detail calculations for learning
    current_time = int(time.time())
    time_step = current_time // 30
    
    return {
        "valid": is_valid,
        "server_info": {
            "current_unix_time": current_time,
            "time_step_counter": time_step,
            "calculated_otp": totp.now()
        }
    }


# --- LAB 5: Cryptography API (Key generation, Encryption, Decryption, Signatures) ---
@app.post("/api/crypto/generate-keys")
def generate_rsa_keys(session_id: str):
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    public_key = private_key.public_key()
    
    # Serialize to PEM
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode()
    
    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()
    
    rsa_key_pairs[session_id] = {
        "private": private_key,
        "public": public_key
    }
    
    return {
        "private_key_pem": pem_private,
        "public_key_pem": pem_public
    }

class SymmetricRequest(BaseModel):
    plaintext: str
    key_hex: str = ""

@app.post("/api/crypto/symmetric/encrypt")
def symmetric_encrypt(req: SymmetricRequest):
    try:
        if req.key_hex:
            key = bytes.fromhex(req.key_hex)
        else:
            key = AESGCM.generate_key(bit_length=256)
            
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, req.plaintext.encode(), None)
        
        return {
            "ciphertext_hex": ciphertext.hex(),
            "nonce_hex": nonce.hex(),
            "key_hex": key.hex()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"暗号化失敗: {str(e)}")

class SymmetricDecryptRequest(BaseModel):
    ciphertext_hex: str
    nonce_hex: str
    key_hex: str

@app.post("/api/crypto/symmetric/decrypt")
def symmetric_decrypt(req: SymmetricDecryptRequest):
    try:
        key = bytes.fromhex(req.key_hex)
        nonce = bytes.fromhex(req.nonce_hex)
        ciphertext = bytes.fromhex(req.ciphertext_hex)
        
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return {"plaintext": plaintext.decode()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"復号失敗 (改ざんまたはキー間違い): {str(e)}")

class AsymmetricRequest(BaseModel):
    session_id: str
    plaintext: str

@app.post("/api/crypto/asymmetric/encrypt")
def asymmetric_encrypt(req: AsymmetricRequest):
    keys = rsa_key_pairs.get(req.session_id)
    if not keys:
        raise HTTPException(status_code=400, detail="RSA鍵ペアが生成されていません。")
        
    public_key = keys["public"]
    ciphertext = public_key.encrypt(
        req.plaintext.encode(),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return {"ciphertext_hex": ciphertext.hex()}

class AsymmetricDecryptRequest(BaseModel):
    session_id: str
    ciphertext_hex: str

@app.post("/api/crypto/asymmetric/decrypt")
def asymmetric_decrypt(req: AsymmetricDecryptRequest):
    keys = rsa_key_pairs.get(req.session_id)
    if not keys:
        raise HTTPException(status_code=400, detail="RSA鍵ペアが生成されていません。")
        
    private_key = keys["private"]
    try:
        ciphertext = bytes.fromhex(req.ciphertext_hex)
        plaintext = private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return {"plaintext": plaintext.decode()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"復号失敗: {str(e)}")

class SignatureRequest(BaseModel):
    session_id: str
    message: str

@app.post("/api/crypto/signature/sign")
def create_signature(req: SignatureRequest):
    keys = rsa_key_pairs.get(req.session_id)
    if not keys:
        raise HTTPException(status_code=400, detail="RSA鍵ペアが生成されていません。")
        
    private_key = keys["private"]
    signature = private_key.sign(
        req.message.encode(),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return {"signature_hex": signature.hex()}

class SignatureVerifyRequest(BaseModel):
    session_id: str
    message: str
    signature_hex: str

@app.post("/api/crypto/signature/verify")
def verify_signature(req: SignatureVerifyRequest):
    keys = rsa_key_pairs.get(req.session_id)
    if not keys:
        raise HTTPException(status_code=400, detail="RSA鍵ペアが生成されていません。")
        
    public_key = keys["public"]
    try:
        signature = bytes.fromhex(req.signature_hex)
        public_key.verify(
            signature,
            req.message.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return {"valid": True, "message": "デジタル署名は有効です。メッセージの完全性が確認されました。"}
    except Exception:
        return {"valid": False, "message": "デジタル署名が無効です。メッセージが改ざんされたか、異なる鍵が使われました。"}


    except Exception:
        return {"valid": False, "message": "デジタル署名が無効です。メッセージが改ざんされたか、異なる鍵が使われました。"}


# --- LAB 6: Network Boundary Defense API ---
class NetworkPacketRequest(BaseModel):
    src_ip: str = "192.168.1.50"
    dest_port: int = 80
    headers: Dict[str, str] = {}
    payload: str = ""

@app.post("/api/network/simulate")
def simulate_network(req: NetworkPacketRequest):
    payload_lower = req.payload.lower()
    
    # 1. Firewall (L3/L4 check)
    if req.dest_port in [22, 23, 3389, 445]:
        return {
            "blocked": True,
            "device": "Firewall (ファイアウォール)",
            "layer": "L4 (トランスポート層)",
            "reason": f"ポート {req.dest_port} への接続要求はセキュリティポリシーにより遮断されました（ポート拒否設定）。",
            "action": "DROP / REJECT"
        }
    
    if "portscan" in payload_lower:
        return {
            "blocked": True,
            "device": "Firewall (ファイアウォール)",
            "layer": "L4 (トランスポート層)",
            "reason": "短時間での多数のポートスキャンを検知したため、送信元IPからのパケットを遮断しました。",
            "action": "DROP"
        }

    # 2. IDS/IPS (L4-L7 signature check)
    ids_signatures = ["/bin/sh", "nc -e", "ping -c", "cmd.exe", "powershell", "rm -rf /", "wget http", "curl http"]
    matched_ids = [sig for sig in ids_signatures if sig in payload_lower]
    if matched_ids:
        return {
            "blocked": True,
            "device": "IDS/IPS (侵入検知/防止システム)",
            "layer": "L7 (アプリケーション層) シグネチャ一致",
            "reason": f"OSコマンドインジェクション / 不正コマンド実行シグネチャ '{matched_ids[0]}' を検知しました。",
            "action": "BLOCK / IPS Triggered"
        }

    # 3. WAF (L7 HTTP context check)
    waf_sqli_signatures = ["union select", "select * from", "insert into", "or 1=1", "' or '1'='1", "drop table"]
    waf_xss_signatures = ["<script>", "javascript:", "onerror=", "onload=", "alert("]
    waf_traversal_signatures = ["../", "..\\", "/etc/passwd"]
    
    matched_sqli = [sig for sig in waf_sqli_signatures if sig in payload_lower]
    matched_xss = [sig for sig in waf_xss_signatures if sig in payload_lower]
    matched_traversal = [sig for sig in waf_traversal_signatures if sig in payload_lower]
    
    user_agent = req.headers.get("User-Agent", "").lower()
    if "sqlmap" in user_agent or "nikto" in user_agent:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) HTTPコンテキスト",
            "reason": f"脆弱性スキャンツールと思われるUser-Agent '{user_agent}' からのアクセスを拒否しました。",
            "action": "BLOCK (403 Forbidden)"
        }
        
    if matched_sqli:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) HTTPリクエストボディ",
            "reason": f"SQLインジェクション攻撃パターン '{matched_sqli[0]}' を検知しました。",
            "action": "BLOCK (403 Forbidden)"
        }
    if matched_xss:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) HTTPリクエストボディ",
            "reason": f"クロスサイトスクリプティング (XSS) パターン '{matched_xss[0]}' を検知しました。",
            "action": "BLOCK (403 Forbidden)"
        }
    if matched_traversal:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) URLパス・クエリ",
            "reason": f"ディレクトリトラバーサル攻撃パターン '{matched_traversal[0]}' を検知しました。",
            "action": "BLOCK (403 Forbidden)"
        }

    # 4. Success (Reached Web Server)
    return {
        "blocked": False,
        "device": "Web Server (ウェブサーバー)",
        "layer": "L7 (アプリケーション層)",
        "reason": "すべてのセキュリティフィルターを通過し、Webサーバーに到達しました。正常応答を返却します。",
        "action": "ALLOW (200 OK)"
    }


# --- LAB 7: SQLi & XSS Vulnerability API ---
class SQLiRequest(BaseModel):
    input_text: str
    secure_mode: bool = False

@app.post("/api/vuln/sqli")
def simulate_sqli(req: SQLiRequest):
    users = [
        {"id": 1, "username": "admin", "role": "Administrator", "email": "admin@securitylab.local"},
        {"id": 2, "username": "user", "role": "Specialist", "email": "user@example.com"},
        {"id": 3, "username": "guest", "role": "Guest User", "email": "guest@example.com"}
    ]
    
    query = ""
    result = []
    success = False
    error = ""
    
    if req.secure_mode:
        query = f"SELECT * FROM users WHERE username = ?;  [Bound Parameter: '{req.input_text}']"
        matched = [u for u in users if u["username"] == req.input_text]
        if matched:
            result = matched
            success = True
    else:
        query = f"SELECT * FROM users WHERE username = '{req.input_text}';"
        normalized = req.input_text.replace(" ", "").lower()
        if "'or'1'='1" in normalized or "'or1=1" in normalized or "'or''='" in normalized:
            result = users
            success = True
        elif "'unionselect" in normalized:
            result = users + [{"id": 99, "username": "attacker", "role": "Hacker", "email": "leak@hack.net"}]
            success = True
        else:
            matched = [u for u in users if u["username"] == req.input_text]
            if matched:
                result = matched
                success = True
            else:
                error = "ユーザーが見つかりません。"
                
    return {
        "sql_query": query,
        "results": result,
        "success": success,
        "error": error
    }

class XSSRequest(BaseModel):
    input_text: str
    secure_mode: bool = False

@app.post("/api/vuln/xss")
def simulate_xss(req: XSSRequest):
    raw_input = req.input_text
    
    if req.secure_mode:
        escaped = (raw_input.replace("&", "&amp;")
                            .replace("<", "&lt;")
                            .replace(">", "&gt;")
                            .replace('"', "&quot;")
                            .replace("'", "&#x27;"))
        return {
            "output_html": escaped,
            "escaped": True,
            "message": "HTMLエスケープが適用され、安全なプレーンテキストとして出力されます。"
        }
    else:
        return {
            "output_html": raw_input,
            "escaped": False,
            "message": "⚠️ 警告: エスケープが施されていません！ブラウザに直接出力されたスクリプトが即座に実行される危険があります。"
        }


# --- LAB 8: Kerberos Protocol Simulation API ---
class KerberosRequest(BaseModel):
    step: str
    username: str = "user"
    service_name: str = "CIFS/file_server"

@app.post("/api/auth/kerberos")
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
            "endtime": timestamp + 18000,
            "key": session_key_client_server
        }
        encrypted_service_ticket = "ServiceTicket_Encrypted(With_K_service)_" + base64.b64encode(f"Ticket:{service_ticket}".encode()).decode()[:40] + "..."
        encrypted_client_server_key = "ClientServerKey_Encrypted(With_K_c_tgs)_" + base64.b64encode(session_key_client_server.encode()).decode()[:20] + "..."
        
        return {
            "step": "TGS-REP (チケット交付サービス応答)",
            "sent_request": f"TGS-REQ: [Presenting TGT + Authenticator for {req.service_name}]",
            "response": {
                "service_ticket_hex": encrypted_service_ticket,
                "session_key_enc": encrypted_client_server_key,
                "raw_ticket_content_visible": service_ticket,
                "session_key": session_key_client_server
            },
            "explanation": "【解説】クライアントはTGSに対し、「暗号化されたTGT」と「セッション鍵で暗号化した認証子」を送り、対象サービスの利用許可を求めます。TGSはTGTを復号してセッション鍵を入手し、認証子を検証。問題なければ、目的のサービスサーバーの鍵(K_service)で暗号化した「サービス利用チケット」を返します。"
        }
        
    elif req.step == "AP-REQ":
        return {
            "step": "AP-REP (アプリケーションサーバー応答)",
            "sent_request": f"AP-REQ: [Presenting Service Ticket + Authenticator]",
            "response": {
                "access_granted": True,
                "message": "🟢 認証成功: サービスサーバーへのログインが承認されました！",
                "explanation_ap": "APサーバーは、自身が保持する秘密鍵(K_service)で「サービス利用チケット」を復号し、クライアントと自身の間で共有される新しいセッション鍵を入手。これで認証子が正しく暗号化されているか検証し、一致すればアクセスを許可します。ユーザーのパスワードはAPサーバーに一切伝わりません。"
            },
            "explanation": "【解説】クライアントは、サービスを提供するAPサーバーへ「サービス利用チケット」と「認証子」を送信します。サーバーは自身の秘密鍵でチケットを復号して認証子を検証し、一致すればセッションを確立してログインを許可します（SSOの実現）。"
        }
    else:
        raise HTTPException(status_code=400, detail="無効なステップ名です。")


# --- LAB 9: IPsec Packet Structure API ---
class IPsecPacketRequest(BaseModel):
    mode: str = "tunnel"
    protocol: str = "esp"
    payload: str = "GET /secret_data HTTP/1.1"

@app.post("/api/ipsec/build")
def build_ipsec_packet(req: IPsecPacketRequest):
    original_ip_header = "Original IP Header (Src: 192.168.1.50, Dst: 10.0.0.100)"
    new_ip_header = "New IP Header (Src: 192.168.1.1 [GW1], Dst: 10.0.0.1 [GW2])"
    payload_data = f"Payload Data: [{req.payload}]"
    packet_layout = []
    
    if req.mode == "transport":
        if req.protocol == "esp":
            packet_layout = [
                {"name": "Original IP Header", "size": "20 bytes", "state": "Cleartext (明文)", "desc": "元のIPアドレス(192.168.1.50 -> 10.0.0.100)を含むIPヘッダー。暗号化されません。"},
                {"name": "ESP Header", "size": "8 bytes", "state": "Cleartext (明文)", "desc": "SPIやシーケンス番号を含み、パケットの識別やリプレイ攻撃対策に使用されます。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 ENCRYPTED (暗号化)", "desc": f"暗号化された実際のペイロードデータ: '{req.payload}'"},
                {"name": "ESP Trailer", "size": "2-26 bytes", "state": "🔒 ENCRYPTED (暗号化)", "desc": "パディングサイズや次ヘッダー（プロトコル番号）を含みます。暗号化されます。"},
                {"name": "ESP Auth (ICV)", "size": "12 bytes", "state": "MAC (完全性保証)", "desc": "パケットが改ざんされていないか検証するためのMAC（メッセージ認証コード）データです。"}
            ]
        else:
            packet_layout = [
                {"name": "Original IP Header", "size": "20 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "元のIPヘッダー。暗号化されませんが、AHによって改ざん検知の対象になります。"},
                {"name": "AH Header", "size": "24 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "SPI、シーケンス番号、ICV（改ざん検知用ハッシュ）を含みます。自身も認証対象になります。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "暗号化されず平文のままですが、完全性チェック（改ざん検知）で保護されます。"}
            ]
    else:
        if req.protocol == "esp":
            packet_layout = [
                {"name": "New IP Header", "size": "20 bytes", "state": "Cleartext (明文)", "desc": "VPNゲートウェイ間の新しいIPヘッダー(GW1 -> GW2)。ルーティングに使用されます。"},
                {"name": "ESP Header", "size": "8 bytes", "state": "Cleartext (明文)", "desc": "暗号化セキュリティアソシエーションを識別する情報。"},
                {"name": "Original IP Header", "size": "20 bytes", "state": "🔒 ENCRYPTED (暗号化)", "desc": "元の端末間のIPヘッダー(192.168.1.50 -> 10.0.0.100)。カプセル化（暗号化）されて隠蔽されます。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 ENCRYPTED (暗号化)", "desc": f"暗号化されたデータ本体: '{req.payload}'"},
                {"name": "ESP Trailer", "size": "2-26 bytes", "state": "🔒 ENCRYPTED (暗号化)", "desc": "暗号化ブロックサイズ調整用のパディング等。"},
                {"name": "ESP Auth (ICV)", "size": "12 bytes", "state": "MAC (完全性保証)", "desc": "改ざん検知用の認証値。"}
            ]
        else:
            packet_layout = [
                {"name": "New IP Header", "size": "20 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "新しいゲートウェイ間のIPヘッダー。改ざん検知で保護されます。"},
                {"name": "AH Header", "size": "24 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "改ざん検知情報。"},
                {"name": "Original IP Header", "size": "20 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "元のIPヘッダー。暗号化されませんが、改ざん検知で保護されます。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "平文データ。改ざん検知で保護されます。"}
            ]
            
    return {
        "mode": req.mode,
        "protocol": req.protocol,
        "original_packet": {
            "ip_header": original_ip_header,
            "payload": payload_data
        },
        "new_packet": {
            "ip_header": new_ip_header if req.mode == "tunnel" else original_ip_header,
            "layout": packet_layout
        }
    }


# --- Server Route: Serve index.html or fallback ---
@app.get("/")
def get_index():
    index_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Security & Auth Lab Backend is Running!</h1><p>Please place index.html in the static directory.</p>")

# Mount static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    # Use user-specified port (10000+)
    uvicorn.run("main:app", host="127.0.0.1", port=18000, reload=True)
