/**
 * Module 3: TOTP MFA Lab
 */
window.SecurityLabModules["mfa"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2">
                <!-- Part 1: MFA Setup -->
                <div class="card">
                    <h3>📱 TOTP ワンタイムパスワード の初期設定</h3>
                    <p class="card-subtitle">サーバーが生成した秘密の共有鍵（Base32）を、QRコードを用いて認証アプリに安全に共有します。</p>
                    
                    <div class="form-group">
                        <label for="mfaUsername">登録ユーザーのメールアドレス:</label>
                        <input type="text" id="mfaUsername" value="user@example.com" placeholder="メールアドレス">
                    </div>
                    
                    <button class="btn btn-primary" id="btnSetupMFA">MFA鍵を生成する</button>
                    
                    <div class="mfa-setup-visual" id="mfaSetupVisual" style="display: none;">
                        <img id="mfaQrCode" class="qr-code-img" src="" alt="MFA QR Code">
                        <div class="form-group" style="width: 100%;">
                            <label>共有鍵 (Base32 Secret Key):</label>
                            <div class="response-box" style="padding: 10px;">
                                <code id="mfaSecretText" style="font-weight: bold; color: var(--color-primary-hover);">未生成</code>
                            </div>
                        </div>
                        <p style="font-size: 11px; color: var(--text-secondary); text-align: center;">
                            💡 スマートフォンの認証アプリ（Google Authenticator等）でこのQRコードをスキャンすると、実際のワンタイムパスワードが生成されます。
                        </p>
                    </div>
                </div>
                
                <!-- Part 2: Verification & Timer -->
                <div class="card">
                    <h3>🔐 TOTP ワンタイムパスワード検証</h3>
                    <p class="card-subtitle">認証アプリに表示された6桁のコードを入力して、サーバーで検証します。</p>
                    
                    <div class="totp-sim-card" id="totpSimCard" style="display: none;">
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">⏰ ローカル認証アプリシミュレーター</span>
                        <div class="totp-digits" id="totpSimDigits">------</div>
                        
                        <div class="totp-progress">
                            <span style="font-size: 11px; color: var(--text-secondary); min-width: 50px;">次の更新まで:</span>
                            <div class="attack-progress-bar" style="flex: 1; height: 8px;">
                                <div class="attack-progress-fill" id="totpProgressFill" style="background-color: var(--color-success); width: 100%;"></div>
                            </div>
                            <span id="totpTimerSec" style="font-family: var(--font-mono); font-size: 12px; font-weight: bold;">30s</span>
                        </div>
                        
                        <button class="btn btn-secondary" id="btnSyncMockCode" style="font-size: 12px; padding: 6px 12px;">
                            コードを検証フォームにコピー
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label for="mfaToken">6桁のワンタイムパスワード:</label>
                        <input type="text" id="mfaToken" max-length="6" placeholder="例: 123456" style="font-size: 24px; text-align: center; letter-spacing: 4px; font-family: var(--font-mono);">
                    </div>
                    
                    <button class="btn btn-primary" id="btnVerifyMFA" style="background-color: var(--color-success); border-color: var(--color-success);">コードを検証</button>
                    
                    <div class="form-group">
                        <label>検証結果・内部情報:</label>
                        <div class="response-box" id="mfaVerifyReportBox">
                            <code id="mfaVerifyReport">コードを検証してください。</code>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Technical Flow Breakdown -->
            <div class="card">
                <h3>🛠️ TOTP (Time-based One-Time Password) の数式・計算ステップ</h3>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); display: flex; flex-direction: column; gap: 12px;">
                    <p>
                        TOTPは、<b>RFC 6238</b>で標準化されているアルゴリズムで、共通鍵と現在の時刻のみからワンタイムパスワードを計算します。ネットワーク通信を必要とせず、クライアントとサーバーの時計が合っていれば認証が成立します。
                    </p>
                    <div style="background-color: var(--bg-app); padding: 14px; border-radius: 6px; font-family: var(--font-mono); border: 1px solid var(--border-color);">
                        1. タイムステップカウンター (Counter) の算出:<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;<b>Counter = floor(現在のUnix時刻 / 30)</b><br><br>
                        
                        2. HMAC-SHA1によるハッシュ生成:<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;<b>HS = HMAC-SHA-1(Secret, Counter)</b>  (※Counterは8バイトのバイナリ表現)<br><br>
                        
                        3. ダイナミックトランケーションによる4バイトの抽出 (Dynamic Truncation):<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;HSの末尾4ビット（最後の1バイトの下位4ビット）をオフセット値（0〜15）とし、ハッシュ値のオフセット位置から4バイトを取り出す。<br><br>
                        
                        4. 6桁の十進数に変換:<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;<b>OTP = 抽出した数値 mod 10^6</b> (0詰めして6桁にする)
                    </div>
                </div>
            </div>

            <!-- Reference Documents Links (Required by AGENTS.md) -->
            <div class="card" style="margin-top: 24px;">
                <h3>📚 参照元・公式仕様リファレンス</h3>
                <p class="card-subtitle">本モジュールの解説およびシミュレーションは、以下の信頼できる仕様書・情報源を参考に構築されています。</p>
                <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.6; font-size: 13px;">
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc6238" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 6238: TOTP: Time-Based One-Time Password Algorithm</a> - 時間ベースのワンタイムパスワード (TOTP) の標準仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc4226" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 4226: HOTP: An HMAC-Based One-Time Password Algorithm</a> - イベントベースのワンタイムパスワード (HOTP) の標準仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc3548" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 3548: The Base16, Base32, and Base64 Data Encodings</a> - 共有鍵の表現に使用される Base32 を含むエンコーディング仕様。</li>
                </ul>
            </div>
        </div>
    `,

    init: function (app) {
        const btnSetupMFA = document.getElementById("btnSetupMFA");
        const mfaUsername = document.getElementById("mfaUsername");
        const mfaSetupVisual = document.getElementById("mfaSetupVisual");
        const mfaQrCode = document.getElementById("mfaQrCode");
        const mfaSecretText = document.getElementById("mfaSecretText");

        const totpSimCard = document.getElementById("totpSimCard");
        const totpSimDigits = document.getElementById("totpSimDigits");
        const totpProgressFill = document.getElementById("totpProgressFill");
        const totpTimerSec = document.getElementById("totpTimerSec");
        const btnSyncMockCode = document.getElementById("btnSyncMockCode");

        const mfaToken = document.getElementById("mfaToken");
        const btnVerifyMFA = document.getElementById("btnVerifyMFA");
        const mfaVerifyReport = document.getElementById("mfaVerifyReport");
        const mfaVerifyReportBox = document.getElementById("mfaVerifyReportBox");

        let mfaUser = "";
        let mfaSecret = "";
        let timerInterval = null;

        // 1. Setup MFA Handler
        btnSetupMFA.addEventListener("click", async () => {
            const user = mfaUsername.value.trim();
            if (!user) {
                alert("ユーザー名（メールアドレス）を入力してください。");
                return;
            }

            try {
                const res = await app.apiCall(`/api/mfa/setup?user=${encodeURIComponent(user)}`, "GET");

                mfaUser = res.user;
                mfaSecret = res.secret;

                mfaQrCode.src = res.qr_code_base64;
                mfaSecretText.innerText = res.secret;

                mfaSetupVisual.style.display = "flex";
                totpSimCard.style.display = "flex";

                // Start local clock timer
                startTotpTimer();

            } catch (err) {
                alert("MFAセットアップエラー: " + err.message);
            }
        });

        // 2. TOTP Timer and simulated code update
        function startTotpTimer() {
            if (timerInterval) clearInterval(timerInterval);

            const updateClock = async () => {
                const now = Math.floor(Date.now() / 1000);
                const remaining = 30 - (now % 30);

                // Update countdown bar
                const percent = (remaining / 30) * 100;
                totpProgressFill.style.width = `${percent}%`;
                totpTimerSec.innerText = `${remaining}s`;

                // Color countdown bar warning when time is low
                if (remaining <= 5) {
                    totpProgressFill.style.backgroundColor = "var(--color-danger)";
                } else {
                    totpProgressFill.style.backgroundColor = "var(--color-success)";
                }

                // If it rolls over or we don't have code yet, fetch simulated code
                if (remaining === 30 || totpSimDigits.innerText === "------") {
                    try {
                        // Fetch what server calculates right now as current code
                        // We use the MFA verification endpoint to inspect calculated OTP
                        const info = await app.apiCall("/api/mfa/verify", "POST", {
                            user: mfaUser,
                            token: "000000" // Send dummy token to get server OTP calculation info
                        });
                        totpSimDigits.innerText = info.server_info.calculated_otp;
                    } catch (e) {
                        // Suppress background errors
                    }
                }
            };

            updateClock();
            timerInterval = setInterval(updateClock, 1000);
        }

        // Copy mock code to verify form
        btnSyncMockCode.addEventListener("click", () => {
            mfaToken.value = totpSimDigits.innerText;
        });

        // 3. Verify MFA Handler
        btnVerifyMFA.addEventListener("click", async () => {
            const token = mfaToken.value.trim();
            if (!mfaUser) {
                alert("先にMFA初期設定を実行してください。");
                return;
            }
            if (token.length !== 6 || isNaN(token)) {
                alert("6桁の数字を入力してください。");
                return;
            }

            try {
                const res = await app.apiCall("/api/mfa/verify", "POST", {
                    user: mfaUser,
                    token: token
                });

                const isSuccess = res.valid;
                mfaVerifyReportBox.style.borderColor = isSuccess ? "var(--color-success)" : "var(--color-danger)";

                let logsHtml = "";
                if (res.server_info && res.server_info.verification_logs) {
                    logsHtml = `<div style="margin-top: 12px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); line-height: 1.4; overflow-x: auto; max-height: 250px; text-align: left;">
                        <span style="color: var(--color-primary-hover); font-weight: 600;">💻 サーバー側の詳細検証ログ:</span><br>
                        ${res.server_info.verification_logs.map(log => {
                        let escaped = app.escapeHtml(log);
                        escaped = escaped.replace(/ /g, "&nbsp;");
                        if (log.includes("[★一致]")) {
                            return `<span style="color: var(--color-success);">${escaped}</span>`;
                        }
                        if (log.includes("認証成功")) {
                            return `<span style="color: var(--color-success); font-weight: 600;">${escaped}</span>`;
                        }
                        if (log.includes("認証失敗")) {
                            return `<span style="color: var(--color-danger); font-weight: 600;">${escaped}</span>`;
                        }
                        return escaped;
                    }).join("<br>")}
                    </div>`;
                }

                if (isSuccess) {
                    mfaVerifyReport.innerHTML = `
                        <span style="color: var(--color-success); font-weight: bold;">🟢 認証成功 (MFA Verified)</span>
                        <br>入力コード [${token}] は有効です！
                        ${logsHtml}
                    `;
                } else {
                    mfaVerifyReport.innerHTML = `
                        <span style="color: var(--color-danger); font-weight: bold;">🔴 認証失敗 (Verification Failed)</span>
                        <br>入力コード [${token}] は正しくないか、有効期限（30秒）が切れています。
                        ${logsHtml}
                    `;
                }
            } catch (err) {
                mfaVerifyReport.innerText = "通信エラー: " + err.message;
            }
        });

        // Cleanup interval on module unload (when navigation changes)
        // Since main.js destroys the container, we can hooks this to DOM destruction
        const observer = new MutationObserver((mutations, obs) => {
            if (!document.getElementById("btnSetupMFA")) {
                if (timerInterval) clearInterval(timerInterval);
                obs.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
};
