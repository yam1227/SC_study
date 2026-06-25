/**
 * Module 7: Web Vulnerability (SQLi & XSS) Lab
 */
window.SecurityLabModules["vuln"] = {
    html: `
        <div class="lab-container">
            <!-- 1. SQL Injection (SQLi) -->
            <div class="card">
                <h3>💥 SQL インジェクション (SQLi) の攻撃と防衛</h3>
                <p class="card-subtitle">入力欄にSQL構文を挿入し、認証回避やデータベース情報漏洩がどのように起こるか、また「プレースホルダ（バインド変数）」による対策を体験します。</p>
                
                <div class="lab-grid-2">
                    <div>
                        <div class="form-group">
                            <label for="sqliUsername">ユーザー名入力欄:</label>
                            <input type="text" id="sqliUsername" value="' OR '1'='1" placeholder="例: admin または ' OR '1'='1">
                        </div>
                        
                        <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center; margin-top: 10px;">
                            <input type="checkbox" id="sqliSecureMode">
                            <label for="sqliSecureMode" style="cursor: pointer; font-weight: bold; color: var(--color-success);">
                                🛡️ プレースホルダ（静的プレースホルダ）を使用する (安全)
                            </label>
                        </div>
                        
                        <button class="btn btn-primary" id="btnRunSqli" style="margin-top: 14px;">SQLクエリを実行</button>
                    </div>
                    
                    <div>
                        <div class="form-group">
                            <label>サーバー内で実行された擬似SQL文:</label>
                            <div class="response-box" style="background-color: #0c0a09; min-height: 50px;">
                                <code id="sqliQueryText" style="color: #60a5fa;">SQL未実行</code>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>取得されたデータ結果 (データベースのレコード):</label>
                            <div class="response-box" id="sqliResultBox" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
                                <code id="sqliResultText" style="color: #34d399;">データ未取得</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Cross-Site Scripting (XSS) -->
            <div class="card">
                <h3>💥 クロスサイトスクリプティング (XSS) の攻撃と防衛</h3>
                <p class="card-subtitle">悪意あるスクリプトがブラウザで実行される脆弱性と、「HTMLエスケープ（サニタイズ）」による無害化を体験します。</p>
                
                <div class="lab-grid-2">
                    <div>
                        <div class="form-group">
                            <label for="xssInput">入力テキスト (掲示板への投稿など):</label>
                            <textarea id="xssInput" class="jwt-editor" style="height: 100px;" placeholder="HTMLやスクリプトを入力してみましょう...">こんにちは！ <script>alert('XSS攻撃!')</script> です。</textarea>
                        </div>
                        
                        <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center; margin-top: 10px;">
                            <input type="checkbox" id="xssSecureMode">
                            <label for="xssSecureMode" style="cursor: pointer; font-weight: bold; color: var(--color-success);">
                                🛡️ 出力時に HTML エスケープを適用する (安全)
                            </label>
                        </div>
                        
                        <button class="btn btn-primary" id="btnRunXss" style="margin-top: 14px;">掲示板に反映 (送信)</button>
                    </div>
                    
                    <div>
                        <div class="form-group">
                            <label>ブラウザ上の表示出力 (HTMLレンダリングのシミュレーション):</label>
                            <!-- Sandbox mock browser container -->
                            <div style="background-color: white; color: black; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; min-height: 120px; font-family: sans-serif;" id="xssBrowserOutput">
                                <span style="color: #64748b; font-style: italic;">ここに投稿内容がレンダリングされます。</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>出力された生HTMLソースコード:</label>
                            <div class="response-box" style="background-color: #0c0a09; min-height: 60px;">
                                <code id="xssSourceCode" style="color: #fb7185;">ソース未出力</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Secure Programming Explanations -->
            <div class="card">
                <h3>💡 セキスペ試験対策：SQLi と XSS の防衛コード設計</h3>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 6px;">1. SQLインジェクションの根本対策</h4>
                        <p>
                            <b>静的プレースホルダ (静的バインド)</b>:<br>
                            プレースホルダを用いたSQL文（例: <code>SELECT * FROM users WHERE username = ?</code>）をあらかじめコンパイルしておき、パラメータの値を後からバインドして実行する方式。SQLの構文解析が完了した後にデータが流し込まれるため、パラメータ内にどれだけ凶悪なSQL構文（<code>' OR 1=1 --</code>）が含まれていても、単なる「文字列データ」として解釈され、攻撃が成立しません。<br><br>
                            ※動的プレースホルダ（アプリ側で文字列結合してプレースホルダに見せかける方式）やエスケープ処理は、エスケープの漏れやSQLエンジンの解釈の差（文字コードのバグ等）を突かれるリスクがあるため、セキスペでは「静的プレースホルダの使用」が根本的対策として強く求められます。
                        </p>
                    </div>
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 6px;">2. XSSの根本対策</h4>
                        <p>
                            <b>HTMLエスケープ (HTMLサニタイズ)</b>:<br>
                            ブラウザにとって特別な意味を持つマークアップ文字を、安全な「文字エンティティ」に置き換える処理です。<br>
                            - <code>&lt;</code> ➔ <code>&amp;lt;</code><br>
                            - <code>&gt;</code> ➔ <code>&amp;gt;</code><br>
                            - <code>&amp;</code> ➔ <code>&amp;amp;</code><br>
                            - <code>"</code> ➔ <code>&amp;quot;</code><br>
                            - <code>'</code> ➔ <code>&amp;#x27;</code> (または <code>&amp;#39;</code>)<br><br>
                            これにより、ブラウザは文字列を「スクリプト（実行命令）」ではなく「単なる文字テキスト（表示要素）」としてレンダリングするため、スクリプトの実行を完全に封じ込めることができます。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        // --- 1. SQL Injection Handlers ---
        const sqliUsername = document.getElementById("sqliUsername");
        const sqliSecureMode = document.getElementById("sqliSecureMode");
        const btnRunSqli = document.getElementById("btnRunSqli");
        const sqliQueryText = document.getElementById("sqliQueryText");
        const sqliResultText = document.getElementById("sqliResultText");
        const sqliResultBox = document.getElementById("sqliResultBox");
        
        btnRunSqli.addEventListener("click", async () => {
            btnRunSqli.disabled = true;
            sqliQueryText.innerText = "実行中...";
            sqliResultText.innerText = "取得中...";
            sqliResultBox.style.borderColor = "var(--border-color)";
            
            try {
                const res = await app.apiCall("/api/vuln/sqli", "POST", {
                    input_text: sqliUsername.value,
                    secure_mode: sqliSecureMode.checked
                });
                
                sqliQueryText.innerText = res.sql_query;
                
                if (res.success) {
                    sqliResultText.innerText = JSON.stringify(res.results, null, 2);
                    
                    // Highlight bypassed login if SQLi returns more than typical single row for a user OR admin role bypass
                    const hasAdmin = res.results.some(u => u.username === "admin");
                    const size = res.results.length;
                    
                    if (!sqliSecureMode.checked && size > 1) {
                        sqliResultBox.style.borderColor = "var(--color-danger)";
                        app.log('warning', "SQLインジェクションが成功し、データベースの全レコードが露出しました！");
                    } else if (!sqliSecureMode.checked && hasAdmin && sqliUsername.value.includes("'")) {
                        sqliResultBox.style.borderColor = "var(--color-danger)";
                        app.log('warning', "SQLインジェクションにより認証回避が成立し、管理者ログインが成功しました！");
                    } else {
                        sqliResultBox.style.borderColor = "var(--color-success)";
                    }
                } else {
                    sqliResultText.innerText = res.error || "マッチするデータはありません。";
                }
            } catch (err) {
                sqliResultText.innerText = "エラー: " + err.message;
            } finally {
                btnRunSqli.disabled = false;
            }
        });
        
        // --- 2. XSS Handlers ---
        const xssInput = document.getElementById("xssInput");
        const xssSecureMode = document.getElementById("xssSecureMode");
        const btnRunXss = document.getElementById("btnRunXss");
        const xssBrowserOutput = document.getElementById("xssBrowserOutput");
        const xssSourceCode = document.getElementById("xssSourceCode");
        
        btnRunXss.addEventListener("click", async () => {
            btnRunXss.disabled = true;
            
            try {
                const res = await app.apiCall("/api/vuln/xss", "POST", {
                    input_text: xssInput.value,
                    secure_mode: xssSecureMode.checked
                });
                
                xssSourceCode.innerText = res.output_html;
                
                if (res.escaped) {
                    // Safe mode: Render escaped text safely
                    xssBrowserOutput.innerText = xssInput.value; // innerText handles escaping naturally in DOM
                    xssBrowserOutput.style.backgroundColor = "#e0f2fe"; // Soft light blue for safe
                } else {
                    // Vulnerable mode: Inject raw HTML/script
                    // In a real environment, using innerHTML with script tag might not execute immediately depending on browser security,
                    // but we will simulate the vulnerability's impact by intercepting the script tag and displaying an alert mock in UI
                    xssBrowserOutput.innerHTML = res.output_html;
                    xssBrowserOutput.style.backgroundColor = "#fef2f2"; // Soft light red for vulnerable
                    
                    // Trigger simulated alert popup if script tag is found
                    if (res.output_html.toLowerCase().includes("<script>") || res.output_html.toLowerCase().includes("onerror=") || res.output_html.toLowerCase().includes("onload=")) {
                        app.log('error', "XSS攻撃が成功し、ブラウザ上で不正なスクリプトが実行されました！");
                        
                        // Show overlay/popup inside the app to simulate alert
                        setTimeout(() => {
                            alert("[XSS 脆弱性検知]\nブラウザ上で不正スクリプトが実行されました！\nセッションCookieやアクセストークンが窃取される危険性があります。");
                        }, 100);
                    }
                }
            } catch (err) {
                xssSourceCode.innerText = "エラー: " + err.message;
            } finally {
                btnRunXss.disabled = false;
            }
        });
    }
};
