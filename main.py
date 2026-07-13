import time
import base64
import io
import os
import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Library imports for labs
import bcrypt
import jwt
import pyotp
import qrcode
from cryptography import x509
from cryptography.x509.oid import NameOID
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
        "jsFile": "lab_hashing.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "パスワードを安全に保存するためのハッシュ化アルゴリズム（SHA-256、bcrypt）の違いや、レインボーテーブル・辞書攻撃を防ぐ「ソルト（Salt）」および「ストレッチング」の重要性を学びます。",
        "keywords": ["ハッシュ関数", "SHA-256", "bcrypt", "ソルト (Salt)", "ストレッチング", "辞書攻撃", "ストレージコスト"]
    },
    {
        "id": "jwt",
        "title": "JWTセキュリティ",
        "description": "JWTの構造、改ざん検知、および「alg: none」の脆弱性を体験的に学びます。",
        "jsFile": "lab_jwt.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Web API等で広く使われるJWT (JSON Web Token) のデータ構造を学びます。トークン改ざん検知の仕組みや、署名アルゴリズムを `none` に書き換える脆弱性（alg: none 脆弱性）を実際に再現し、正しい署名検証による防御方法を学習します。",
        "keywords": ["JWT (JSON Web Token)", "署名 (Signature)", "改ざん検知", "alg: none 脆弱性", "Base64url"]
    },
    {
        "id": "mfa",
        "title": "多要素認証 (MFA) & TOTP",
        "description": "TOTPの仕組み、共有鍵、30秒有効期間の計算、QRコード連携を学びます。",
        "jsFile": "lab_mfa.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "ワンタイムパスワード（OTP）を用いた多要素認証について学びます。認証アプリで使われる時間ベースのワンタイムパスワード（TOTP）の生成ロジック（共有鍵と時間から算出する仕組み）を可視化し、実際の Authenticator アプリとの同期を検証します。",
        "keywords": ["MFA (多要素認証)", "TOTP", "HOTP", "共有鍵 (Base32)", "Unix Time (30秒制限)"]
    },
    {
        "id": "oauth",
        "title": "OAuth 2.0 / OIDC フロー",
        "description": "認可コードフローや state パラメータによるCSRF対策をインタラクティブに学びます。",
        "jsFile": "lab_oauth.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "外部サービス間で権限を安全に委譲する OAuth 2.0 / OpenID Connect (OIDC) の動作フローを学びます。代表的な『認可コードフロー』を順を追って実行し、セキュリティ対策パラメータ `state`（CSRF対策）や `nonce`（リプレイ攻撃対策）の重要性を学習します。",
        "keywords": ["OAuth 2.0", "OIDC (OpenID Connect)", "認可コードフロー", "state パラメータ (CSRF対策)", "nonce パラメータ"]
    },
    {
        "id": "crypto",
        "title": "暗号化＆デジタル署名",
        "description": "AES（共通鍵）とRSA（公開鍵）の使い分け、デジタル署名による改ざん検知を学びます。",
        "jsFile": "lab_crypto.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "現代のセキュリティの基盤となる暗号技術を学びます。共通鍵暗号（AES-GCM）での暗号化・復号、公開鍵暗号（RSA）を用いた鍵ペア生成と暗号化、さらに送信元の証明と改ざん防止を行う『デジタル署名』の仕組みを検証します。",
        "keywords": ["共通鍵暗号 (AES)", "公開鍵暗号 (RSA)", "ハイブリッド暗号", "デジタル署名", "改ざん検知"]
    },
    {
        "id": "network",
        "title": "FW / IDS・IPS / WAF 使い分け",
        "description": "ファイアウォール、IDS/IPS、WAFのそれぞれの処理レイヤーや防御対象の違いを体系的に学びます。",
        "jsFile": "lab_network.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "ネットワークやアプリケーションを防御するための3つの主要防御機器（ファイアウォール、IDS/IPS、WAF）の動作レイヤーと防衛対象の違いを学びます。境界防衛シミュレータを使用し、パケットの種類に応じてどの機器がどのように機能するかを可視化します。",
        "keywords": ["ファイアウォール (L4)", "IDS/IPS (L7 シグネチャ)", "WAF (L7 HTTP)", "ポートスキャン", "SQLi/XSS"]
    },
    {
        "id": "vuln",
        "title": "Web脆弱性攻撃と防衛 (SQLi / XSS)",
        "description": "SQLインジェクションやクロスサイトスクリプティング（XSS）の脆弱性と、セキュアコーディングでの防御を体験します。",
        "jsFile": "lab_vuln.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Webアプリケーションに潜む代表的な脆弱性である SQL インジェクション (SQLi) とクロスサイトスクリプティング (XSS) の動作原理と、その防衛方法を学びます。攻撃リクエストを体験し、ソースコードレベルでのバインド変数使用やサニタイズ（エスケープ）の効果を確認します。",
        "keywords": ["SQLインジェクション (SQLi)", "プレースホルダ (バインド変数)", "クロスサイトスクリプティング (XSS)", "サニタイズ (エスケープ)", "セキュアプログラミング"]
    },
    {
        "id": "email_security",
        "title": "メールセキュリティ・ドメイン認証",
        "description": "SMTP/POP3/IMAPの送受信フロー、メールヘッダの構造、およびSPF・DKIM・DMARCドメイン認証の検証プロセスを詳細に学習します。",
        "jsFile": "lab_email_security.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "メールの送受信で使用される各種プロトコルの違いや、メールヘッダの構造（Envelope-FromとHeader Fromの違い）を学びます。さらなりすましメール対策として必須の送信元ドメイン認証技術である『SPF』『DKIM』『DMARC』の仕組みと検証フロー、アライメントチェックの動作をビジュアルシミュレーターで体験します。",
        "keywords": ["SMTP / POP3 / IMAP", "Envelope-From / Header From", "Receivedヘッダ", "SPF (送信IP制限)", "DKIM (電子署名)", "DMARC (アライメントとポリシー)", "SPF/DKIMアライメント"]
    },
    {
        "id": "cookie_security",
        "title": "CookieとWebセキュリティ",
        "description": "Cookieの送受信フロー、主要属性（Secure、HttpOnly、SameSite）の挙動、およびXSSやCSRFなどの攻撃に対する具体的な防御策を詳細に学習します。",
        "jsFile": "lab_cookie_security.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Webアプリケーションでセッション管理等に使われるCookieについて、HTTPリクエスト・レスポンスにおける送受信プロセスをシミュレートします。XSS脆弱性からセッションIDを守る「HttpOnly属性」，盗聴を防ぐ「Secure属性」，別ドメイン発のリクエストによるCSRF攻撃を防ぐ「SameSite属性（Strict/Lax/None）」の違いをビジュアルで学習します。",
        "keywords": ["Cookie", "Set-Cookieヘッダ", "HttpOnly属性 (XSS対策)", "Secure属性", "SameSite属性 (CSRF対策)", "Domain/Path/Max-Age", "セッションハイジャック"]
    },
    {
        "id": "kerberos",
        "title": "認証プロトコル・ログ解析 (Kerberos)",
        "description": "Kerberos認証チケットの発行プロセスと、チケットをデコードした認証ログの解析を学びます。",
        "jsFile": "lab_kerberos.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Kerberos（ケルベロス）認証の3つのチケット発行フェーズ（AS、TGS、AP）のステップ実行。暗号化された TGT（チケット交付チケット） やサービスチケットの内容、および リプレイ攻撃対策としてのタイムスタンプ を含む生ログのデコード解析。",
        "keywords": ["Kerberos (ケルベロス)", "TGT (チケット交付チケット)", "Authenticator (認証子)", "チケット転送", "リプレイ攻撃対策 (タイムスタンプ)"]
    },
    {
        "id": "ipsec",
        "title": "IPsec構造・IKE交換",
        "description": "IPsecカプセル化（Tunnel/Transport、AH/ESP）パケットと、IKE Phase 1・Phase 2の通信シーケンスを学びます。",
        "jsFile": "lab_ipsec.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "IPsecによる安全なVPN通信のパケット構造と、接続前に鍵交換を行うIKEプロトコルの動作を学びます。AHとESP、トンネルモードとトランスポートモードの違いによるパケット配置をビジュアルで確認し、IKEのメインモードとアグレッシブモードのシーケンスを比較します。",
        "keywords": ["IPsec", "AH (認証のみ)", "ESP (暗号化+認証)", "トンネル / トランスポートモード", "IKE Phase 1 / Phase 2", "メイン / アグレッシブモード"]
    },
    {
        "id": "vpn_types",
        "title": "IPsec SA・広域ネットワークVPN",
        "description": "IPsecの鍵交換・接続管理を司る『SA (Security Association)』の動作概念と、キャリア閉域網などを利用した広域ネットワークVPNの違いを体系的に学びます。",
        "jsFile": "lab_vpn_types.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "IPsecの鍵交換・接続管理を司る『SA (Security Association)』の動作概念と、キャリア閉域網などを利用した広域ネットワークVPN（IP-VPN、広域イーサネット、インターネットVPN）の違いを学びます。SAの方向性やSPI、広域VPNの特徴を整理します。",
        "keywords": ["IKE SA (双方向1本)", "IPsec SA (片方向2本)", "SPI (Security Parameter Index)", "IP-VPN (MPLS閉域網)", "広域イーサネット (L2閉域網)"]
    },
    {
        "id": "osi_model",
        "title": "OSI参照モデル・カプセル化",
        "description": "データのカプセル化（ヘッダー付与）と非カプセル化を、物理層からアプリケーション層までの各プロトコル動作と共に視覚的に学びます。",
        "jsFile": "lab_osi_model.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "ネットワーク通信の共通規格であるOSI参照モデル7階層について、PCからWebサーバーへHTTPSでリクエストが送られる際の『カプセル化』および『非カプセル化』プロセスをアニメーションで視覚的に学習します。",
        "keywords": ["OSI参照モデル", "カプセル化 (Encapsulation)", "非カプセル化 (Decapsulation)", "PDU (プロトコルデータ単位)", "L2/L3スイッチ", "MAC/IPアドレス"]
    },
    {
        "id": "saml",
        "title": "SAML 認証 & 学認 SSO",
        "description": "SAML 2.0 に基づくシングルサインオン、アサーションの内部構造、および SP におけるデジタル署名や有効期限の厳密な検証基準を、学認 (GakuNin) のシナリオを通じて体験的に学びます。",
        "jsFile": "lab_saml.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "教育・研究機関で広く使われている学術認証フェデレーション「学認（GakuNin）」をモデルに、SAML 2.0 に基づくシングルサインオン（SSO）の仕組みを学習します。ユーザーがサービスプロバイダ（SP）にアクセスし、アイデンティティプロバイダ（IdP）で認証され、SAMLアサーションを含むSAMLResponseを受け取るフローを追体験し、SPがアサーションの信頼性をどのように厳密に検証しているか（署名・有効期限・宛先・リプレイ攻撃防止など）を学習します。",
        "keywords": ["SAML 2.0", "SP (Service Provider)", "IdP (Identity Provider)", "SAMLアサーション", "メタデータ", "学認 (GakuNin)", "ACS (Assertion Consumer Service)", "デジタル署名", "リプレイ攻撃対策"]
    },
    {
        "id": "pki",
        "title": "認証局 (CA) と PKI ライフサイクル",
        "description": "CA, RA, VA, AA, OCSP などの役割とデータの流れ、証明書の発行から失効検証（CRL/OCSP）までをインタラクティブに学びます。",
        "jsFile": "lab_pki.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "公開鍵基盤 (PKI) における認証局 (CA)、登録局 (RA)、検証局 (VA)、アトリビュート認証局 (AA) の役割を学びます。証明書発行申請 (CSR) から発行、そして証明書の有効性検証 (CRL / OCSP) までのデータと検証の流れを視覚的にシミュレートします。",
        "keywords": ["公開鍵基盤 (PKI)", "認証局 (CA)", "登録局 (RA)", "検証局 (VA)", "アトリビュート認証局 (AA)", "OCSP", "CRL (証明書失効リスト)", "CSR (証明書署名要求)"]
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
    import base64
    import hmac
    import hashlib
    import struct
    import time
    from datetime import datetime, timezone

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

@app.post("/api/crypto/symmetric/decrypt")
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


# --- LAB 13: Cookie and Web Security API ---
class CookieSimulateRequest(BaseModel):
    http_only: bool
    secure: bool
    same_site: str  # "strict", "lax", "none"
    request_type: str  # "normal", "csrf_link", "csrf_post"
    use_https: bool

@app.post("/api/cookie/simulate")
def simulate_cookie(req: CookieSimulateRequest):
    cookie_sent = True
    reason = "通常リクエストのため、Cookieは送信されました。"

    # 1. Secure attribute check
    if req.secure and not req.use_https:
        cookie_sent = False
        reason = "Secure属性が有効ですが、非暗号化通信 (HTTP) のためブラウザによってCookieの送信がブロックされました。"

    # 2. SameSite attribute check
    elif req.request_type == "csrf_link":
        if req.same_site == "strict":
            cookie_sent = False
            reason = "SameSite=Strict が設定されているため、クロスサイト（別サイトからのリンク遷移）でのGETリクエストではCookieは送信されません。"
        else:
            reason = f"SameSite={req.same_site.capitalize()} のため、クロスサイト遷移（GET）でもCookieは送信されます。"
            
    elif req.request_type == "csrf_post":
        if req.same_site in ["strict", "lax"]:
            cookie_sent = False
            reason = f"SameSite={req.same_site.capitalize()} が設定されているため、クロスサイトでのPOSTリクエスト（CSRF攻撃）ではCookieは送信されません。"
        else:
            reason = "SameSite=None（かつSecure有効）のため、クロスサイトのPOSTリクエストでもCookieが送信され、CSRF攻撃が成立する可能性があります。"

    # HttpOnly information
    js_readable = not req.http_only
    js_reason = "HttpOnly属性が無効なため、JavaScriptの document.cookie からCookie値を読み取り可能です（XSSによるセッション盗聴の危険性）。" if js_readable else "HttpOnly属性が有効なため、JavaScriptからCookie値へのアクセスは遮断されています。"

    return {
        "cookie_sent": cookie_sent,
        "reason": reason,
        "js_readable": js_readable,
        "js_reason": js_reason,
        "set_cookie_header": f"Set-Cookie: session_id=sess_abc123; Path=/; {'HttpOnly; ' if req.http_only else ''}{'Secure; ' if req.secure else ''}SameSite={req.same_site.capitalize()}"
    }


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


class SAMLAuthenticateRequest(BaseModel):
    username: str
    authn_request_id: str


class SAMLVerifyRequest(BaseModel):
    saml_response_xml: str
    expected_in_response_to: str
    time_offset_seconds: int = 0


@app.post("/api/saml/initiate")
def saml_initiate():
    import uuid
    import zlib
    import urllib.parse
    from datetime import datetime, timezone

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


@app.post("/api/saml/authenticate")
def saml_authenticate(req: SAMLAuthenticateRequest):
    import uuid
    from datetime import datetime, timezone, timedelta

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


@app.post("/api/saml/verify")
def saml_verify(req: SAMLVerifyRequest):
    import re
    import xml.etree.ElementTree as ET
    from datetime import datetime, timezone, timedelta

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

    assertion_xml_str = assertion_match.group(1) if assertion_match else ""

    sig_verified = False
    sig_error = ""
    if sig_val_el is not None and sig_val_el.text and assertion_xml_str:
        sig_b64 = sig_val_el.text.strip().replace("\n", "").replace(" ", "").replace("\r", "")
        try:
            sig_bytes = base64.b64decode(sig_b64)
            saml_idp_public_key.verify(
                sig_bytes,
                assertion_xml_str.encode('utf-8'),
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            sig_verified = True
        except Exception as e:
            sig_error = str(e)
    else:
        sig_error = "署名値またはAssertion要素が見つかりません"

    cond_el = find_element('.//saml:Conditions', root)
    not_before_str = cond_el.attrib.get('NotBefore') if cond_el is not None else None
    not_on_or_after_str = cond_el.attrib.get('NotOnOrAfter') if cond_el is not None else None

    aud_el = find_element('.//saml:Audience', root)
    audience_val = aud_el.text.strip() if aud_el is not None and aud_el.text else None

    sub_conf_data_el = find_element('.//saml:SubjectConfirmationData', root)
    in_response_to_val = sub_conf_data_el.attrib.get('InResponseTo') if sub_conf_data_el is not None else None
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


# --- LAB 15: Public Key Infrastructure & Certificate Authority API ---
pki_ca_store: Dict[str, Any] = {}
pki_aa_store: Dict[str, Any] = {}
pki_issued_certs: Dict[int, Dict[str, Any]] = {}
pki_ac_store: Dict[int, Dict[str, Any]] = {}

def ensure_pki_setup():
    if "private_key" in pki_ca_store:
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

class PKISetupResponse(BaseModel):
    ca_subject: str
    ca_cert_pem: str
    aa_public_key_pem: str

@app.post("/api/pki/setup", response_model=PKISetupResponse)
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

@app.post("/api/pki/csr")
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

@app.post("/api/pki/issue")
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

@app.post("/api/pki/revoke")
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

@app.post("/api/pki/ocsp")
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

@app.get("/api/pki/crl")
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

@app.post("/api/pki/issue-ac")
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
        "ac_json": ac_content,
        "signature_hex": signature.hex(),
        "aa_public_key_pem": pki_aa_store["public_key_pem"]
    }


# --- Server Route: Serve index.html or fallback ---
@app.get("/")
def get_index():
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    return HTMLResponse("<h1>Security & Auth Lab Backend is Running!</h1><p>Please place index.html in the static directory.</p>")

# Mount static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    # Use user-specified port (10000+)
    uvicorn.run("main:app", host="127.0.0.1", port=18000, reload=True)
