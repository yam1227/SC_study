/**
 * Module 2: JWT Security Lab
 */
window.SecurityLabModules["jwt"] = {
    html: `
        <div class="lab-container">
            <!-- Part 0: JWT Intro Guide -->
            <div class="card jwt-intro-card" style="border-left: 4px solid var(--color-primary); margin-bottom: 8px;">
                <h3>📖 JWTの基本と認証方式の理解</h3>
                <p class="card-subtitle" style="margin-bottom: 20px;">手を動かして実験を行う前に、JWTの目的や脅威について理解しましょう。</p>
                
                <div class="jwt-intro-grid" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px;">
                    <!-- Left: Base Tech & Auth comparison -->
                    <div>
                        <h4 style="color: var(--color-primary-hover); margin-bottom: 10px; font-size: 14px; font-weight: 600;">🔑 JWT (JSON Web Token) とは？</h4>
                        <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 16px;">
                            JWTは、クライアントとサーバー間でユーザー情報や権限（クレーム）を<b>JSON形式のトークン</b>として安全に送受信するためのオープン標準（RFC 7519）です。トークン自身に必要なデータが含まれているため、データベースへのセッション問い合わせをせずに信頼性を担保できるのが特徴です。主にWeb APIの認可やシングルサインオン（SSO）で実装されます。
                        </p>
                        
                        <h4 style="color: var(--color-primary-hover); margin-bottom: 10px; font-size: 14px; font-weight: 600;">⚔️ セッションベース認証 vs トークンベース認証（JWT）</h4>
                        <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                            JWTは<b>トークンベース認証</b>に分類されます。それぞれの認証方式には、以下のような目的と役割の違いがあります。
                        </p>
                        
                        <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary); text-align: left;">
                                    <th style="padding: 8px 4px; font-weight: 600; width: 25%;">特徴</th>
                                    <th style="padding: 8px 4px; font-weight: 600; width: 38%;">セッションベース（Cookie等）</th>
                                    <th style="padding: 8px 4px; font-weight: 600; width: 37%;">トークンベース（JWT）</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-secondary);">
                                    <td style="padding: 8px 4px; font-weight: 500; color: var(--text-primary);">状態の保持</td>
                                    <td style="padding: 8px 4px;"><b>ステートフル</b><br>(サーバーのメモリ/DBに保存)</td>
                                    <td style="padding: 8px 4px;"><b>ステートレス</b><br>(サーバーは状態を保持しない)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-secondary);">
                                    <td style="padding: 8px 4px; font-weight: 500; color: var(--text-primary);">情報の実体</td>
                                    <td style="padding: 8px 4px;">セッションIDのみを渡し、中身はサーバーが管理</td>
                                    <td style="padding: 8px 4px;">ユーザー情報や権限をトークン内に丸ごと内包</td>
                                </tr>
                                <tr style="color: var(--text-secondary);">
                                    <td style="padding: 8px 4px; font-weight: 500; color: var(--text-primary);">スケーラビリティ</td>
                                    <td style="padding: 8px 4px;">サーバー間でのセッション同期が必要で負荷が高い</td>
                                    <td style="padding: 8px 4px;">サーバーは署名の鍵を検証するだけなので容易にスケール</td>
                                </tr>
                            </tbody>
                        </table>

                        <h4 style="color: var(--color-primary-hover); margin-top: 16px; margin-bottom: 8px; font-size: 14px; font-weight: 600;">🔒 JWS (JSON Web Signature) と JWE (JSON Web Encryption) の違い</h4>
                        <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 8px;">
                            セキスペ試験対策において非常に重要なJWTの2大規格です。
                        </p>
                        <ul style="font-size: 12.5px; line-height: 1.6; color: var(--text-secondary); margin-left: 20px; margin-bottom: 12px; padding-left: 0;">
                            <li style="margin-bottom: 4px;">
                                <b>JWS (署名付きJWT):</b> 本ページで扱う標準的なJWTです。データは署名で改ざん防止（<b>完全性</b>）されていますが暗号化はされておらず、Base64URLデコードすれば誰でも中身を閲覧できます。
                            </li>
                            <li>
                                <b>JWE (暗号化JWT):</b> クレーム内に個人情報（PII）などの機微データを含める必要がある場合、暗号キーを用いてペイロード全体を暗号化（<b>機密性</b>）します。
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Right: alg none vulnerability -->
                    <div style="border-left: 1px solid var(--border-color); padding-left: 32px;">
                        <h4 style="color: var(--color-danger); margin-bottom: 10px; font-size: 14px; font-weight: 600;">⚠️ alg: none 脆弱性とは？</h4>
                        <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                            JWTのヘッダー部分には、署名検証に使用したアルゴリズムを示す <code>"alg"</code> フィールドが存在します（例: <code>"HS256"</code>, <code>"RS256"</code>）。
                        </p>
                        <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                            <code>"none"</code> アルゴリズムは、「署名検証をスキップする」ための開発・テスト用の指定です。しかし、本番サーバーの検証ロジックが <code>alg: "none"</code> トークンを正当なものとして受け入れてしまう場合、<b>改ざん検知の仕組みが完全にバイパス</b>されます。
                        </p>
                        <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: var(--radius-sm); font-size: 12.5px; color: #fecdd3; line-height: 1.5;">
                            <b>攻撃のシナリオ:</b><br>
                            攻撃者はトークンのヘッダーを <code>"alg": "none"</code> に書き換えた上で、ペイロードを <code>"role": "admin"</code> に改ざんし、末尾の署名部分を削除してサーバーに送信します。脆弱なサーバーは署名検証を行わないため、改ざんされた管理者権限をそのまま信用し、アクセスを許可してしまいます。
                        </div>
                    </div>
                </div>
            </div>

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
                        <input type="text" id="jwtUsername" value="user" placeholder="ユーザー名">
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
                                <button class="btn btn-secondary" id="btnTamperNone" style="border-color: var(--color-danger); color: var(--color-danger); margin-top: 8px; padding: 8px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                                    ⚠️ トークンを「alg: none」に改ざんする
                                </button>
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
                <h3>💡 情報処理安全確保支援士試験ポイント: JWTと鍵管理</h3>
                <div style="font-size: 14px; line-height: 1.6; color: var(--text-secondary); display: flex; flex-direction: column; gap: 14px;">
                    <p>
                        <b>1. 改ざん検知の仕組み（完全性の確保）</b><br>
                        JWTはBase64URLで符号化されているため、通信路上での盗聴により中身を解読することが容易です（暗号化されていません）。しかし、ヘッダーとペイロードをもとにサーバーの秘密鍵で生成した「署名（Signature）」を末尾に付加しているため、攻撃者が値を1文字でも改ざんすればサーバーでの署名検証が失敗し、不正トークンとして破棄されます。
                    </p>
                    <p>
                        <b>2. alg: "none" 脆弱性</b><br>
                        JWTのヘッダーの <code>alg</code> は署名アルゴリズムを指定するフィールドです。サーバーがこの値を鵜呑みにして <code>"none"</code>（署名検証なし）を許可していると、攻撃者が署名部分を空欄にした上でペイロード（<code>role: admin</code> など）を改ざんしたトークンを送り、認証を突破できてしまいます。サーバー側では <code>alg: "none"</code> を明示的に拒否する実装が必須です。
                    </p>
                    <p>
                        <b>3. JWS（署名）と JWE（暗号化）の違い（完全性 vs 機密性）</b><br>
                        セキスペの記述式問題では、JWSとJWEの違いや使い分けが問われます。
                        <br>・<b>JWS (JSON Web Signature):</b> 署名により<b>「完全性（改ざん防止）」</b>を担保します。中身は平文（符号化のみ）で見えるため、公開されて困る機微データは含められません。
                        <br>・<b>JWE (JSON Web Encryption):</b> コンテンツ全体を共通鍵・公開鍵で暗号化し、<b>「機密性（盗聴防止）」</b>を確保します。ユーザーのマイナンバーや詳細な個人情報（PII）をトークン内に含めて配送せざるを得ないシステムで採用されます。
                    </p>
                    <p>
                        <b>4. 対称鍵（HS256）と非対称鍵（RS256）の特性比較</b><br>
                        ・<b>対称鍵 (HS256):</b> 発行側と検証側で同一の共通鍵（秘密鍵）を共有します。検証を行うWebサーバーすべてに同じ秘密鍵を持たせる必要があるため、サーバーのどれか1台でも侵害されると鍵が漏洩し、偽のトークンが発行可能になるリスクがあります。
                        <br>・<b>非対称鍵 (RS256/ES256):</b> 発行側（認可サーバー）のみが「秘密鍵」を厳重に保管し、検証側（リソースサーバー）は一般に公開された「公開鍵」で検証します。仮に検証サーバーの1台が乗っ取られても公開鍵しか漏洩しないため、トークンの偽造は不可能です。
                    </p>
                    <p>
                        <b>5. JWKS（JSON Web Key Set）と鍵のローテーション（運用設計）</b><br>
                        非対称鍵（RS256）を使う場合、認可サーバーは署名検証に必要な公開鍵の情報を <b>JWKS (JSON Web Key Set)</b> というJSON形式の鍵リストとして公開エンドポイント（例: <code>/.well-known/jwks.json</code>）で配信します。
                        <br>検証側は定期的にこのエンドポイントに問い合わせて公開鍵を更新（ローテーション）します。鍵更新時に検証側サーバーのソースコードや設定ファイルを書き換える必要がないため、<b>鍵の漏洩対策や鍵のライフサイクル管理</b>を円滑に行うことができます。
                    </p>
                </div>
            </div>

            <!-- Call to Action: Next steps to OIDC -->
            <div class="card" style="border: 1px solid rgba(99, 102, 241, 0.3); background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05)); display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 20px; gap: 20px; margin-top: 16px;">
                <div style="flex: 1;">
                    <h4 style="color: var(--color-primary-hover); margin-bottom: 6px; font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                        🔗 JWTを実際の認証フローで使ってみましょう！
                    </h4>
                    <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin: 0;">
                        JWTのデータ構造やセキュリティ（alg: none）を理解したら、次はこれが実際にどのように利用されるかを学びましょう。<br>
                        現代のWebシステムでは、<b>OAuth 2.0</b> や <b>OpenID Connect (OIDC)</b> のフローにおいて、認証情報やクレームを格納した「IDトークン」としてJWTがやり取りされます。
                    </p>
                </div>
                <button class="btn btn-primary" id="btnGoToOAuth" style="flex-shrink: 0; padding: 12px 20px; font-size: 13px; border-radius: var(--radius-sm); white-space: nowrap;">
                    🤝 OAuth / OIDC フロー学習に進む ➔
                </button>
            </div>

            <!-- Reference Documents Links (Required by AGENTS.md) -->
            <div class="card" style="margin-top: 24px;">
                <h3>📚 参照元・公式仕様リファレンス</h3>
                <p class="card-subtitle">本モジュールの解説およびシミュレーションは、以下の信頼できる仕様書・情報源を参考に構築されています。</p>
                <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.6; font-size: 13px;">
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc7519" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 7519: JSON Web Token (JWT)</a> - JWTの標準仕様書。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc7515" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 7515: JSON Web Signature (JWS)</a> - デジタル署名による完全性担保の標準仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc7516" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 7516: JSON Web Encryption (JWE)</a> - 暗号化による機密性担保の標準仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc7517" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 7517: JSON Web Key (JWK) / JWKS</a> - 公開鍵配信および鍵フォーマットの標準仕様。</li>
                </ul>
            </div>
        </div>
    `,

    init: function (app) {
        const btnGenerateJWT = document.getElementById("btnGenerateJWT");
        const jwtUserId = document.getElementById("jwtUserId");
        const jwtUsername = document.getElementById("jwtUsername");
        const jwtRole = document.getElementById("jwtRole");
        const jwtSecret = document.getElementById("jwtSecret");
        const outJwtToken = document.getElementById("outJwtToken");

        const sandboxJwtToken = document.getElementById("sandboxJwtToken");
        const btnTamperNone = document.getElementById("btnTamperNone");
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

        // 1.5. Tamper JWT with alg: none
        btnTamperNone.addEventListener("click", () => {
            const token = sandboxJwtToken.value.trim();
            if (!token || token === "トークン未発行") {
                alert("改ざんするトークンがありません。先にトークンを発行するか、トークンを入力してください。");
                return;
            }

            const parts = token.split(".");
            if (parts.length < 2) {
                alert("無効なトークン形式です。");
                return;
            }

            try {
                // Base64URL decode helper
                const base64UrlDecode = (str) => {
                    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }
                    return decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                };

                // Base64URL encode helper
                const base64UrlEncode = (str) => {
                    const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
                        return String.fromCharCode(parseInt(p1, 16));
                    }));
                    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
                };

                const headerJson = JSON.parse(base64UrlDecode(parts[0]));
                headerJson.alg = "none"; // alg を none に書き換え

                const newHeaderB64 = base64UrlEncode(JSON.stringify(headerJson));

                // 新しいトークン（署名を空にした header.payload. 形式）を生成
                const tamperedToken = `${newHeaderB64}.${parts[1]}.`;

                sandboxJwtToken.value = tamperedToken;
                updateDecoderDisplay(tamperedToken);
                app.log('system', 'トークンを「alg: none」に改ざんしました（署名データを消去）。');
            } catch (e) {
                alert("トークンのデコード・改ざんに失敗しました。");
                app.log('error', '改ざん処理中のエラー', e);
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
                    return decodeURIComponent(atob(base64).split('').map(function (c) {
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

        // 3. Navigate to OAuth Module
        const btnGoToOAuth = document.getElementById("btnGoToOAuth");
        if (btnGoToOAuth) {
            btnGoToOAuth.addEventListener("click", () => {
                app.switchTab("oauth");
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }
    }
};
