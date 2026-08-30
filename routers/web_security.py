from typing import Dict, Any, List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Web Security & Vulnerabilities"])


# ==============================================================================
# LAB 7: SQLi & XSS Vulnerability API
# ==============================================================================
class SQLiRequest(BaseModel):
    input_text: str
    secure_mode: bool = False


@router.post("/api/vuln/sqli")
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


@router.post("/api/vuln/xss")
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


# ==============================================================================
# LAB 17: CSRF vs XSS Simulation API
# ==============================================================================
class CsrfVsXssSimulationRequest(BaseModel):
    mode: str  # "csrf", "xss", または "transaction_signing"
    payload: str = ""
    csrf_token_enabled: bool = False
    provided_csrf_token: str = ""
    samesite_attribute: str = "None"  # "None", "Lax", "Strict"
    escape_html_enabled: bool = False
    httponly_enabled: bool = False
    # トランザクション署名用フィールド
    account_number: str = "123-4567"
    amount: int = 500000
    signed_account: str = "123-4567"
    auth_type: str = "transaction_signing"  # "otp" または "transaction_signing"
    mitb_attack: bool = False


@router.post("/api/vuln/csrf-vs-xss/simulate")
def simulate_csrf_vs_xss(req: CsrfVsXssSimulationRequest):
    valid_server_csrf_token = "sec_token_9f8a7b6c5d4e"
    
    if req.mode == "transaction_signing":
        target_account = "999-9999 (攻撃者の口座)" if req.mitb_attack else req.account_number
        
        if req.auth_type == "otp":
            if req.mitb_attack:
                return {
                    "success": True,
                    "blocked_by": None,
                    "status_code": 200,
                    "message": "🚨 不正送金成功 (MITB/CSRF被害発生): ブラウザ内のマルウェア(MITB)またはCSRFにより送金先が『999-9999』へ改ざんされました。通常のログインOTPは取引内容に依存しないため改ざんを検証できず、不正送金が完了してしまいました！",
                    "account_number": target_account,
                    "amount": req.amount,
                    "auth_type": "通常のOTP"
                }
            else:
                return {
                    "success": False,
                    "blocked_by": None,
                    "status_code": 200,
                    "message": f"✅ 正常送金完了: 指定口座({req.account_number})へ {req.amount:,} 円の送金が完了しました。（※ただし攻撃があった場合に防げない脆弱性があります）",
                    "account_number": req.account_number,
                    "amount": req.amount,
                    "auth_type": "通常のOTP"
                }
        else:  # transaction_signing
            # トランザクション署名の検証: 別デバイスで署名した口座(signed_account)と実際の送信先(target_account)の一致判定
            if req.signed_account == target_account:
                return {
                    "success": False,
                    "blocked_by": "Transaction Signing Verified",
                    "status_code": 200,
                    "message": f"🛡️ トランザクション署名検証成功: 別デバイスで承認された取引データ({req.signed_account}, {req.amount:,}円)と一致したため、安全に送金処理を完了しました。",
                    "account_number": req.account_number,
                    "amount": req.amount,
                    "auth_type": "トランザクション署名"
                }
            else:
                return {
                    "success": False,
                    "blocked_by": "Transaction Signing Mismatch",
                    "status_code": 403,
                    "message": f"🛡️ 攻撃遮断成功 (トランザクション署名による防衛): 別デバイスで生成された署名(口座: {req.signed_account})と、MITB/CSRFにより改ざんされた実際の送金先(口座: {target_account})の不整合を検出！ 銀行サーバで不正送金を自動ブロックしました！",
                    "account_number": target_account,
                    "amount": req.amount,
                    "auth_type": "トランザクション署名"
                }

    elif req.mode == "csrf":
        # CSRF 攻撃の判定
        # 1. SameSite Cookie 判定: Strict または Lax の場合、クロスサイトPOSTでCookieが送信されない
        cookie_attached = True
        if req.samesite_attribute in ["Strict", "Lax"]:
            cookie_attached = False
            
        # 2. 抗CSRFトークン判定
        token_valid = True
        if req.csrf_token_enabled:
            if req.provided_csrf_token != valid_server_csrf_token:
                token_valid = False

        if not cookie_attached:
            return {
                "success": False,
                "blocked_by": "SameSite Cookie",
                "status_code": 401,
                "message": f"🛡️ 攻撃失敗 (防御成功): Cookie に SameSite={req.samesite_attribute} 属性が設定されているため、外部罠サイトからのPOSTリクエストに認証Cookieが添付されませんでした。",
                "cookie_attached": False,
                "token_validated": None,
                "request_origin": "http://evil-site.net",
                "target_origin": "http://bank-service.local",
                "http_headers": {
                    "Host": "bank-service.local",
                    "Origin": "http://evil-site.net",
                    "Referer": "http://evil-site.net/win-prize.html",
                    "Cookie": "(なし - SameSite属性により遮断)"
                }
            }
        elif req.csrf_token_enabled and not token_valid:
            return {
                "success": False,
                "blocked_by": "CSRF Token Validation",
                "status_code": 403,
                "message": "🛡️ 攻撃失敗 (防御成功): リクエストに有効な抗CSRFトークンが含まれていません。外部罠サイトはSOP（同種オリジン制約）のためターゲットサイトのトークン値を取得できず、リクエストがサーバー側で拒否されました。",
                "cookie_attached": True,
                "token_validated": False,
                "request_origin": "http://evil-site.net",
                "target_origin": "http://bank-service.local",
                "http_headers": {
                    "Host": "bank-service.local",
                    "Origin": "http://evil-site.net",
                    "Cookie": "session_id=user_alice_sess_777",
                    "X-CSRF-Token": "(未送信または不正なトークン)"
                }
            }
        else:
            return {
                "success": True,
                "blocked_by": None,
                "status_code": 200,
                "message": "🚨 攻撃成功 (CSRF被害発生): ユーザーが罠サイトを閲覧した結果、被害者のセッションCookieが自動送信され、意図しない送金/パスワード変更処理が実行されてしまいました！",
                "cookie_attached": True,
                "token_validated": True if req.csrf_token_enabled else None,
                "request_origin": "http://evil-site.net",
                "target_origin": "http://bank-service.local",
                "http_headers": {
                    "Host": "bank-service.local",
                    "Origin": "http://evil-site.net",
                    "Cookie": "session_id=user_alice_sess_777"
                }
            }

    elif req.mode == "xss":
        # XSS 攻撃の判定
        raw_payload = req.payload or "<script>alert('XSS')</script>"
        has_script = ("<script>" in raw_payload.lower()) or ("onerror=" in raw_payload.lower()) or ("onload=" in raw_payload.lower()) or ("javascript:" in raw_payload.lower())
        
        if req.escape_html_enabled:
            escaped_content = (raw_payload.replace("&", "&amp;")
                                         .replace("<", "&lt;")
                                         .replace(">", "&gt;")
                                         .replace('"', "&quot;")
                                         .replace("'", "&#x27;"))
            return {
                "success": False,
                "blocked_by": "HTML Escape (Sanitization)",
                "rendered_html": escaped_content,
                "cookie_stolen": False,
                "cookie_accessible": not req.httponly_enabled,
                "message": "🛡️ 攻撃失敗 (防御成功): HTMLエスケープが適用されたため、悪意あるコードは安全なプレーンテキストとしてレンダリングされ、スクリプトは実行されませんでした。"
            }
        else:
            cookie_stolen = False
            if has_script:
                if req.httponly_enabled:
                    message = "⚠️ 半防御 (スクリプトは実行されましたがCookieは安全): スクリプトがDOM上で実行されましたが、Cookieに HttpOnly 属性が付与されていたため document.cookie からセッションIDを奪取することは防げました。"
                    cookie_stolen = False
                else:
                    message = "💥 攻撃成功 (XSS実行 & Cookie奪取): ターゲットサイト上で悪意あるスクリプトが実行され、HttpOnlyが付与されていない Cookie (session_id=user_alice_sess_777) が攻撃者のサーバーへ送信されました！さらに、ターゲット画面上のCSRFトークンもJavaScriptで読み取られるため、CSRF対策も破られてしまいます！"
                    cookie_stolen = True
            else:
                message = "入力内容がそのままHTMLとしてレンダリングされました。"
                
            return {
                "success": has_script and not req.httponly_enabled,
                "blocked_by": "HttpOnly (Partial)" if (has_script and req.httponly_enabled) else None,
                "rendered_html": raw_payload,
                "cookie_stolen": cookie_stolen,
                "cookie_accessible": not req.httponly_enabled,
                "csrf_token_compromised": has_script,
                "message": message
            }

    return {"error": "無効なモードです。"}


# ==============================================================================
# LAB 13: Cookie and Web Security API
# ==============================================================================
class CookieSimulateRequest(BaseModel):
    http_only: bool
    secure: bool
    same_site: str  # "strict", "lax", "none"
    request_type: str  # "normal", "csrf_link", "csrf_post"
    use_https: bool


@router.post("/api/cookie/simulate")
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
