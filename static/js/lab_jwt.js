/**
 * Module 2: JWT Security Lab
 */
window.SecurityLabModules["jwt"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2">
                <!-- Part 1: Token Generator -->
                <div class="card">
                    <h3>🎟️ JWT (JSON Web Token) 生成器</h3>
                    <p class="card-subtitle">サーバーがユーザー情報をJWTとしてカプセル化し、署名して発行するプロセスです。</p>
                    
                    <div class="form-group">
                        <label for="jwtUserId">ユーザーID (sub):</label>
                        <input type="text" id="jwtUserId" value="user_10283" placeholder="ユーザーID">
                    </div>
                    
                    <div class="form-group">
                        <label for="jwtUsername">ユーザー名:</label>
                        <input type="text" id="jwtUsername" value="m_yudai" placeholder="ユーザー名">
                    </div>
                    
                    <div class="form-group">
                        <label for="jwtRole">付与する権限 (role):</label>
                        <select id="jwtRole">
                            <option value="user" selected>一般ユーザー (user)</option>
                            <option value="admin">システム管理者 (admin)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="jwtSecret">サーバー秘密鍵 (Secret Key):</label>
                        <input type="password" id="jwtSecret" value="my-super-secret-key-999" placeholder="秘密鍵">
                    </div>
                    
                    <button class="btn btn-primary" id="btnGenerateJWT">JWTを発行する</button>
                    
                    <div class="form-group">
                        <label>発行されたJWT (Base64URL):</label>
                        <div class="response-box" style="background-color: #0c0a09; min-height: 100px;">
                            <code id="outJwtToken" style="word-wrap: break-word; color: #f43f5e;">トークン未発行</code>
                        </div>
                    </div>
                </div>
                
                <!-- Part 2: Tampering Sandbox & Verification -->
                <div class="card">
                    <h3>🛠️ JWT改ざん＆検証サンドボックス</h3>
                    <p class="card-subtitle">発行されたJWTのペイロードやアルゴリズムを意図的に書き換え、検証結果を調べます。</p>
                    
                    <div class="jwt-debugger">
                        <!-- Left column: Raw JWT input/editor -->
                        <div class="jwt-col">
                            <div class="jwt-part">
                                <label for="sandboxJwtToken">検証するJWTトークン（直接編集可能）:</label>
                                <textarea id="sandboxJwtToken" class="jwt-editor" style="height: 120px;" placeholder="ここにJWTを貼り付けます"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="verifySecret">検証用のサーバー秘密鍵:</label>
                                <input type="password" id="verifySecret" value="my-super-secret-key-999" placeholder="検証鍵">
                            </div>
                            
                            <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center;">
                                <input type="checkbox" id="allowNoneAlg">
                                <label for="allowNoneAlg" style="color: var(--color-danger); cursor: pointer;">
                                    ⚠️ サーバーで 「alg: none」 を許可する (脆弱な設定)
                                </label>
                            </div>
                            
                            <button class="btn btn-secondary" id="btnVerifyJWT" style="border-color: var(--color-primary);">検証を要求する</button>
                        </div>
                        
                        <!-- Right column: Decoded payload preview -->
                        <div class="jwt-col">
                            <div class="jwt-part header">
                                <h4>Header (ヘッダー)</h4>
                                <pre id="jwtDecodedHeader" style="font-family: var(--font-mono); font-size: 11px; color: #fb7185; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">{}</pre>
                            </div>
                            <div class="jwt-part payload">
                                <h4>Payload (ペイロード)</h4>
                                <pre id="jwtDecodedPayload" style="font-family: var(--font-mono); font-size: 11px; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">{}</pre>
                            </div>
                            <div class="jwt-part signature">
                                <h4>Signature (署名部分)</h4>
                                <span id="jwtDecodedSignature" style="font-family: var(--font-mono); font-size: 11px; color: #4ade80; overflow-wrap: anywhere;">[署名データ]</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>サーバー検証レポート:</label>
                        <div class="response-box" id="jwtVerificationReportBox">
                            <code id="jwtVerificationReport">検証を実行してください。</code>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Learning Info -->
            <div class="card">
                <h3>💡 情報処理安全確保支援士試験ポイント: JWTの脅威</h3>
                <div style="font-size: 14px; line-height: 1.6; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px;">
                    <p>
                        <b>1. 改ざん検知の仕組み</b><br>
                        JWTは、Base64URLでエンコードされているため誰でもデコードして中身を読むことができます（機密性はありません）。しかし、署名（Signature）部分があるため、改ざんされた場合はサーバー側で秘密鍵（HS256）または公開鍵（RS256）を用いて検証した際に不一致となり、拒否されます。
                    </p>
                    <p>
                        <b>2. alg: "none" 脆弱性</b><br>
                        JWTのヘッダーにある <code>alg</code> フィールドは、署名検証アルゴリズムを示します。ライブラリの古いバージョンや誤った設定により、クライアントが <code>alg: "none"</code>（署名なし）を指定したときにサーバーが署名の検証を行わずにペイロードを信頼してしまう脆弱性が存在します。攻撃者は署名部分を空にして、管理者（admin）などのペイロードに改ざんしたトークンを送りつけて認証を突破できてしまいます。
                    </p>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        const btnGenerateJWT = document.getElementById("btnGenerateJWT");
        const jwtUserId = document.getElementById("jwtUserId");
        const jwtUsername = document.getElementById("jwtUsername");
        const jwtRole = document.getElementById("jwtRole");
        const jwtSecret = document.getElementById("jwtSecret");
        const outJwtToken = document.getElementById("outJwtToken");
        
        const sandboxJwtToken = document.getElementById("sandboxJwtToken");
        const verifySecret = document.getElementById("verifySecret");
        const allowNoneAlg = document.getElementById("allowNoneAlg");
        const btnVerifyJWT = document.getElementById("btnVerifyJWT");
        const jwtDecodedHeader = document.getElementById("jwtDecodedHeader");
        const jwtDecodedPayload = document.getElementById("jwtDecodedPayload");
        const jwtDecodedSignature = document.getElementById("jwtDecodedSignature");
        const jwtVerificationReport = document.getElementById("jwtVerificationReport");
        const jwtVerificationReportBox = document.getElementById("jwtVerificationReportBox");
        
        // 1. Generate JWT Handler
        btnGenerateJWT.addEventListener("click", async () => {
            const userId = jwtUserId.value.trim();
            const username = jwtUsername.value.trim();
            const role = jwtRole.value;
            const secret = jwtSecret.value.trim();
            
            if (!userId || !username || !secret) {
                alert("すべてのフィールドを入力してください。");
                return;
            }
            
            try {
                const res = await app.apiCall("/api/jwt/generate", "POST", {
                    user_id: userId,
                    username: username,
                    role: role,
                    secret: secret
                });
                
                outJwtToken.innerText = res.token;
                sandboxJwtToken.value = res.token;
                verifySecret.value = secret;
                
                // Parse and decode locally for display
                updateDecoderDisplay(res.token);
                
            } catch (err) {
                outJwtToken.innerText = "エラーが発生しました";
            }
        });
        
        // Local parsing helper
        function updateDecoderDisplay(token) {
            try {
                const parts = token.split(".");
                if (parts.length < 2) {
                    jwtDecodedHeader.innerText = "{}";
                    jwtDecodedPayload.innerText = "{}";
                    jwtDecodedSignature.innerText = "署名なし";
                    return;
                }
                
                // Base64URL decode
                const base64UrlDecode = (str) => {
                    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }
                    return decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                };
                
                const headerJson = JSON.parse(base64UrlDecode(parts[0]));
                const payloadJson = JSON.parse(base64UrlDecode(parts[1]));
                
                jwtDecodedHeader.innerText = JSON.stringify(headerJson, null, 2);
                jwtDecodedPayload.innerText = JSON.stringify(payloadJson, null, 2);
                jwtDecodedSignature.innerText = parts[2] || "なし (alg: none)";
                
                // Coloring depending on verification state
                if (headerJson.alg && headerJson.alg.toUpperCase() === "NONE") {
                    jwtDecodedHeader.style.color = "var(--color-danger)";
                } else {
                    jwtDecodedHeader.style.color = "#fb7185";
                }
            } catch (e) {
                jwtDecodedHeader.innerText = "パースエラー";
                jwtDecodedPayload.innerText = "無効なJWTフォーマットです";
                jwtDecodedSignature.innerText = "";
            }
        }
        
        // Listen to edits in the token text area
        sandboxJwtToken.addEventListener("input", () => {
            updateDecoderDisplay(sandboxJwtToken.value.trim());
        });
        
        // 2. Verify JWT Handler
        btnVerifyJWT.addEventListener("click", async () => {
            const token = sandboxJwtToken.value.trim();
            const secret = verifySecret.value.trim();
            
            if (!token) {
                alert("検証するトークンを入力または生成してください。");
                return;
            }
            
            try {
                const res = await app.apiCall("/api/jwt/verify", "POST", {
                    token: token,
                    expected_secret: secret,
                    allow_none_alg: allowNoneAlg.checked
                });
                
                if (res.valid) {
                    jwtVerificationReportBox.style.borderColor = res.message.includes("警告") ? "var(--color-warning)" : "var(--color-success)";
                    jwtVerificationReport.innerHTML = `
                        <span style="color: ${res.message.includes("警告") ? 'var(--color-warning)' : 'var(--color-success)'}; font-weight: bold;">
                            ${res.message.includes("警告") ? '⚠️ SUCCESS (脆弱性成立)' : '🟢 VALID'}
                        </span>
                        <br>${res.message}
                        <br><br>ユーザー: <b>${res.payload.username || '不明'}</b>
                        <br>権限 (role): <b style="color: ${res.payload.role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary-hover)'};">${res.payload.role}</b>
                    `;
                } else {
                    jwtVerificationReportBox.style.borderColor = "var(--color-danger)";
                    jwtVerificationReport.innerHTML = `
                        <span style="color: var(--color-danger); font-weight: bold;">🔴 INVALID</span>
                        <br>${res.message}
                    `;
                }
            } catch (err) {
                jwtVerificationReport.innerText = "通信エラー: " + err.message;
            }
        });
    }
};
