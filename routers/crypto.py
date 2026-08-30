import os
import datetime
import hashlib
import hmac
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from core.state import rsa_key_pairs, pki_ca_store

router = APIRouter(tags=["Cryptography, PKI & MAC"])

# PKI Simulation internal storage helpers
pki_aa_store: Dict[str, Any] = {}
pki_issued_certs: Dict[int, Dict[str, Any]] = {}
pki_ac_store: Dict[int, Dict[str, Any]] = {}


def ensure_pki_setup():
    if "private_key" in pki_ca_store and pki_ca_store["private_key"] is not None:
        return
    # Generate CA Key
    ca_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    ca_subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "JP"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Security Lab CA"),
        x509.NameAttribute(NameOID.COMMON_NAME, "Root CA"),
    ])
    # Self-signed Root CA Cert
    now = datetime.datetime.now(datetime.timezone.utc)
    ca_cert = x509.CertificateBuilder().subject_name(
        ca_subject
    ).issuer_name(
        ca_subject
    ).public_key(
        ca_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        now
    ).not_valid_after(
        now + datetime.timedelta(days=3650)
    ).add_extension(
        x509.BasicConstraints(ca=True, path_length=None), critical=True
    ).sign(ca_key, hashes.SHA256())
    
    pki_ca_store["private_key"] = ca_key
    pki_ca_store["cert"] = ca_cert
    pki_ca_store["cert_pem"] = ca_cert.public_bytes(serialization.Encoding.PEM).decode()
    pki_ca_store["subject"] = "C=JP, O=Security Lab CA, CN=Root CA"

    # Generate AA Key
    aa_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pki_aa_store["private_key"] = aa_key
    pki_aa_store["public_key_pem"] = aa_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()


# ==============================================================================
# LAB 5: Cryptography API (Key generation, Encryption, Decryption, Signatures)
# ==============================================================================
@router.post("/api/crypto/generate-keys")
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


@router.post("/api/crypto/symmetric/encrypt")
def symmetric_encrypt(req: SymmetricRequest):
    try:
        if req.key_hex:
            key = bytes.fromhex(req.key_hex)
        else:
            key = AESGCM.generate_key(bit_length=256)
            
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        full_ciphertext = aesgcm.encrypt(nonce, req.plaintext.encode(), None)
        
        # AES-GCMの暗号文末尾16バイトは認証タグ(Tag)
        actual_ciphertext = full_ciphertext[:-16]
        tag = full_ciphertext[-16:]
        
        return {
            "ciphertext_hex": actual_ciphertext.hex(),
            "tag_hex": tag.hex(),
            "nonce_hex": nonce.hex(),
            "key_hex": key.hex()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"暗号化失敗: {str(e)}")


class SymmetricDecryptRequest(BaseModel):
    ciphertext_hex: str
    nonce_hex: str
    tag_hex: str
    key_hex: str


@router.post("/api/crypto/symmetric/decrypt")
def symmetric_decrypt(req: SymmetricDecryptRequest):
    try:
        key = bytes.fromhex(req.key_hex)
        nonce = bytes.fromhex(req.nonce_hex)
        ciphertext = bytes.fromhex(req.ciphertext_hex)
        tag = bytes.fromhex(req.tag_hex)
        
        # 復号のために暗号文とタグを結合
        full_ciphertext = ciphertext + tag
        
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, full_ciphertext, None)
        return {"plaintext": plaintext.decode()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"復号失敗 (改ざんまたはキー間違い): {str(e)}")


class AsymmetricRequest(BaseModel):
    session_id: str
    plaintext: str


@router.post("/api/crypto/asymmetric/encrypt")
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


@router.post("/api/crypto/asymmetric/decrypt")
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


@router.post("/api/crypto/signature/sign")
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


@router.post("/api/crypto/signature/verify")
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


# ==============================================================================
# LAB 15: Public Key Infrastructure & Certificate Authority API
# ==============================================================================
class PKISetupResponse(BaseModel):
    ca_subject: str
    ca_cert_pem: str
    aa_public_key_pem: str


@router.post("/api/pki/setup", response_model=PKISetupResponse)
def pki_setup():
    ensure_pki_setup()
    return {
        "ca_subject": pki_ca_store["subject"],
        "ca_cert_pem": pki_ca_store["cert_pem"],
        "aa_public_key_pem": pki_aa_store["public_key_pem"]
    }


class CSRRequest(BaseModel):
    common_name: str
    organization: str
    country: str


@router.post("/api/pki/csr")
def pki_generate_csr(req: CSRRequest):
    # Generate User Key Pair
    user_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    
    # CSR Builder
    csr = x509.CertificateSigningRequestBuilder().subject_name(x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, req.country),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, req.organization),
        x509.NameAttribute(NameOID.COMMON_NAME, req.common_name),
    ])).sign(user_key, hashes.SHA256())
    
    csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode()
    private_key_pem = user_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode()
    public_key_pem = user_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()
    
    return {
        "csr_pem": csr_pem,
        "private_key_pem": private_key_pem,
        "public_key_pem": public_key_pem
    }


class IssueCertRequest(BaseModel):
    csr_pem: str
    valid_days: int = 365


@router.post("/api/pki/issue")
def pki_issue_cert(req: IssueCertRequest):
    ensure_pki_setup()
    try:
        csr = x509.load_pem_x509_csr(req.csr_pem.encode())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSRのパースに失敗しました: {str(e)}")
        
    ca_key = pki_ca_store["private_key"]
    ca_cert = pki_ca_store["cert"]
    
    serial = x509.random_serial_number()
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Issue Cert
    cert = x509.CertificateBuilder().subject_name(
        csr.subject
    ).issuer_name(
        ca_cert.subject
    ).public_key(
        csr.public_key()
    ).serial_number(
        serial
    ).not_valid_before(
        now
    ).not_valid_after(
        now + datetime.timedelta(days=req.valid_days)
    ).sign(ca_key, hashes.SHA256())
    
    cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode()
    
    subject_str = ", ".join([f"{attr.oid._name}={attr.value}" for attr in cert.subject])
    
    # Save to db
    pki_issued_certs[serial] = {
        "subject": subject_str,
        "pem": cert_pem,
        "status": "Good",
        "revoked_at": None
    }
    
    return {
        "serial_number": str(serial),
        "cert_pem": cert_pem,
        "subject": subject_str,
        "not_valid_before": cert.not_valid_before_utc.isoformat(),
        "not_valid_after": cert.not_valid_after_utc.isoformat()
    }


class RevokeCertRequest(BaseModel):
    serial_number: str


@router.post("/api/pki/revoke")
def pki_revoke_cert(req: RevokeCertRequest):
    ensure_pki_setup()
    try:
        serial = int(req.serial_number)
    except ValueError:
        raise HTTPException(status_code=400, detail="無効なシリアル番号形式です。")
        
    if serial not in pki_issued_certs:
        raise HTTPException(status_code=404, detail="指定されたシリアル番号の証明書が見つかりません。")
        
    pki_issued_certs[serial]["status"] = "Revoked"
    pki_issued_certs[serial]["revoked_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    return {
        "serial_number": str(serial),
        "status": "Revoked",
        "revoked_at": pki_issued_certs[serial]["revoked_at"]
    }


class OCSPRequest(BaseModel):
    serial_number: str


@router.post("/api/pki/ocsp")
def pki_check_ocsp(req: OCSPRequest):
    ensure_pki_setup()
    try:
        serial = int(req.serial_number)
    except ValueError:
        return {
            "status": "Unknown",
            "message": "シリアル番号の形式が無効です。",
            "signature_verified": False
        }
        
    cert_info = pki_issued_certs.get(serial)
    if not cert_info:
        return {
            "status": "Unknown",
            "message": "該当する証明書がCAデータベースに存在しません。",
            "signature_verified": False
        }
        
    # Generate a simulated signed OCSP Response
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    next_update_str = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat()
    
    response_data = {
        "serial_number": str(serial),
        "cert_status": cert_info["status"],
        "this_update": now_str,
        "next_update": next_update_str,
        "revoked_at": cert_info["revoked_at"]
    }
    
    # Sign response
    ca_key = pki_ca_store["private_key"]
    response_bytes = str(response_data).encode()
    signature = ca_key.sign(
        response_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    return {
        "status": cert_info["status"],
        "response_data": response_data,
        "signature_hex": signature.hex(),
        "signature_verified": True,
        "message": f"OCSP検証成功。証明書ステータス: {cert_info['status']}"
    }


@router.get("/api/pki/crl")
def pki_download_crl():
    ensure_pki_setup()
    
    revoked_list = []
    now = datetime.datetime.now(datetime.timezone.utc)
    
    for serial, info in pki_issued_certs.items():
        if info["status"] == "Revoked":
            revoked_list.append({
                "serial_number": str(serial),
                "revocation_date": info["revoked_at"]
            })
            
    crl_data = {
        "issuer": pki_ca_store["subject"],
        "this_update": now.isoformat(),
        "next_update": (now + datetime.timedelta(days=7)).isoformat(),
        "revoked_certificates": revoked_list
    }
    
    # Sign CRL
    ca_key = pki_ca_store["private_key"]
    crl_bytes = str(crl_data).encode()
    signature = ca_key.sign(
        crl_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    # Format to look like a CRL text structure
    crl_text = (
        f"-----BEGIN CERTIFICATE REVOCATION LIST-----\n"
        f"Issuer: {crl_data['issuer']}\n"
        f"This Update: {crl_data['this_update']}\n"
        f"Next Update: {crl_data['next_update']}\n"
        f"Revoked List Count: {len(revoked_list)}\n"
    )
    for rc in revoked_list:
        crl_text += f"  Serial: {rc['serial_number']} (Date: {rc['revocation_date']})\n"
    crl_text += f"Signature (SHA256withRSA): {signature.hex()[:64]}...\n"
    crl_text += f"-----END CERTIFICATE REVOCATION LIST-----"
    
    return {
        "crl_text": crl_text,
        "raw_data": crl_data,
        "signature_hex": signature.hex()
    }


class ACRequest(BaseModel):
    holder_serial: str
    username: str
    role: str
    valid_days: int = 30


@router.post("/api/pki/issue-ac")
def pki_issue_ac(req: ACRequest):
    ensure_pki_setup()
    
    aa_key = pki_aa_store["private_key"]
    serial = x509.random_serial_number()
    now = datetime.datetime.now(datetime.timezone.utc)
    not_valid_before = now.isoformat()
    not_valid_after = (now + datetime.timedelta(days=req.valid_days)).isoformat()
    
    ac_content = {
        "ac_serial_number": str(serial),
        "holder_pkc_serial": req.holder_serial,
        "holder_name": req.username,
        "issuer_aa": "C=JP, O=Security Lab AA, CN=Attribute Authority",
        "attributes": {
            "role": req.role,
            "privileges": ["read", "write", "admin"] if req.role.lower() == "admin" else ["read"]
        },
        "not_valid_before": not_valid_before,
        "not_valid_after": not_valid_after
    }
    
    # Sign AC content with AA's private key
    ac_bytes = str(ac_content).encode()
    signature = aa_key.sign(
        ac_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    pki_ac_store[serial] = {
        "content": ac_content,
        "signature_hex": signature.hex()
    }
    
    return {
        "ac_serial_number": str(serial),
        "holder_name": req.username,
        "role": req.role,
        "attributes": ac_content["attributes"],
        "not_valid_before": not_valid_before,
        "not_valid_after": not_valid_after,
        "signature_hex": signature.hex()
    }


# ==============================================================================
# Message Authentication Code (MAC) Simulation Route
# ==============================================================================
class MacVerifyRequest(BaseModel):
    message: str
    key: str = "SharedKey123"
    tampered_message: str = ""
    auth_type: str = "mac"


@router.post("/api/mac/verify")
def verify_mac(req: MacVerifyRequest):
    secret_key_bytes = req.key.encode('utf-8')
    orig_msg_bytes = req.message.encode('utf-8')
    computed_mac = hmac.new(secret_key_bytes, orig_msg_bytes, hashlib.sha256).hexdigest()
    
    received_message = req.tampered_message if req.tampered_message else req.message
    is_tampered = (received_message != req.message)
    
    rx_msg_bytes = received_message.encode('utf-8')
    bob_computed_mac = hmac.new(secret_key_bytes, rx_msg_bytes, hashlib.sha256).hexdigest()
    
    mac_valid = (bob_computed_mac == computed_mac)
    
    return {
        "original_message": req.message,
        "received_message": received_message,
        "is_tampered": is_tampered,
        "sender_mac": computed_mac,
        "receiver_recalculated_mac": bob_computed_mac,
        "integrity_verified": mac_valid,
        "authenticity_verified": mac_valid,
        "third_party_verifiable": False,
        "message": "✅ メッセージ完全性 ＆ 送信元認証 成功 (改ざん・捏造なし)" if mac_valid else "🚨 MAC不一致：メッセージ改ざん検知 (または不正な送信元)！"
    }


# ==============================================================================
# Block Cipher Modes (CTR, CBC, ECB) Simulation Route
# ==============================================================================
class BlockCipherSimulationRequest(BaseModel):
    mode: str = "CTR"
    plaintext: str = "PASS_ALL_EXAMS_2026"
    key: str = "SecretKey128Bit!"
    bit_error: bool = False


@router.post("/api/block-cipher/simulate")
def simulate_block_cipher(req: BlockCipherSimulationRequest):
    blocks = [req.plaintext[i:i+8] for i in range(0, len(req.plaintext), 8)]
    simulation_steps = []
    
    if req.mode == "CTR":
        for idx, block in enumerate(blocks):
            nonce_counter = f"NONCE_001_CTR_{idx:04d}"
            keystream = hashlib.sha256(f"{req.key}:{nonce_counter}".encode()).hexdigest()[:len(block)*2]
            
            block_hex = block.encode().hex()
            cipher_hex = hex(int(block_hex, 16) ^ int(keystream, 16))[2:].zfill(len(block_hex))
            
            simulation_steps.append({
                "block_index": idx + 1,
                "input_plain": block,
                "counter_val": nonce_counter,
                "keystream": keystream,
                "xor_operation": f"{block_hex} ⊕ {keystream} = {cipher_hex}",
                "output_cipher": cipher_hex
            })
            
        return {
            "mode": "CTR (Counter)",
            "output_formula": "入力ブロック ⊕ 鍵ストリーム (Key Stream)",
            "padding_required": False,
            "padding_note": "ストリーム暗号として機能するため、ブロック長の倍数でなくてもパディングは不要",
            "parallel_encryption": True,
            "parallel_decryption": True,
            "error_propagation": "暗号文の1ビット誤りは復号後も同じ1ビットの誤りのみ（影響が他ブロックに及ばない）",
            "steps": simulation_steps,
            "message": "⚡ CTRモード: 独立したカウンタ値から鍵ストリームを生成しXORするため、暗号化・復号の完全並列実行が可能でありパディングも不要です。"
        }
    
    elif req.mode == "CBC":
        prev_cipher = "IV_INITIAL_VECTOR"
        for idx, block in enumerate(blocks):
            padded_block = block.ljust(8, ' ')
            block_hex = padded_block.encode().hex()
            prev_hex = hashlib.md5(prev_cipher.encode()).hexdigest()[:len(block_hex)]
            
            xored_hex = hex(int(block_hex, 16) ^ int(prev_hex, 16))[2:].zfill(len(block_hex))
            cipher_hex = hashlib.sha256(f"{req.key}:{xored_hex}".encode()).hexdigest()[:len(block_hex)]
            prev_cipher = cipher_hex
            
            simulation_steps.append({
                "block_index": idx + 1,
                "input_plain": padded_block,
                "prev_chain": prev_hex,
                "output_cipher": cipher_hex
            })
            
        return {
            "mode": "CBC (Cipher Block Chaining)",
            "output_formula": "AES_Encrypt(Key, 平文 ⊕ 前暗号文)",
            "padding_required": True,
            "padding_note": "ブロック長の倍数に切りそろえるためのパディングが必須",
            "parallel_encryption": False,
            "parallel_decryption": True,
            "error_propagation": "暗号文の1ビット誤りを復号すると【該当ブロック全体】＋【次ブロックの対応1ビット】がビット誤りになる",
            "steps": simulation_steps,
            "message": "🛡️ CBCモード: チェーニング構造により暗号化の並列処理は不可能ですが、復号処理は並列実行が可能です。"
        }
    
    else:  # ECB
        for idx, block in enumerate(blocks):
            padded_block = block.ljust(8, ' ')
            cipher_hex = hashlib.sha256(f"{req.key}:{padded_block}".encode()).hexdigest()[:16]
            simulation_steps.append({
                "block_index": idx + 1,
                "input_plain": padded_block,
                "output_cipher": cipher_hex
            })
            
        return {
            "mode": "ECB (Electronic Codebook)",
            "output_formula": "AES_Encrypt(Key, 平文)",
            "padding_required": True,
            "padding_note": "パディング必須",
            "parallel_encryption": True,
            "parallel_decryption": True,
            "error_propagation": "該当ブロックのみ影響",
            "steps": simulation_steps,
            "message": "⚠️ ECBモード: 単純なブロックごとの暗号化のため、同じ平文は常に同じ暗号文になりパターンが漏洩するため通常使用は推奨されません。"
        }
