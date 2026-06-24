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
