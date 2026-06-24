/**
 * Module 4: OAuth 2.0 / OIDC Flow Simulator
 */
window.SecurityLabModules["oauth"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2" style="grid-template-columns: 1.3fr 0.7fr;">
                <!-- Left: Flow Diagram & Control -->
                <div class="card">
                    <h3>🤝 OAuth 2.0 認可コードフロー・シミュレーター</h3>
                    <p class="card-subtitle">安全確保支援士試験で最重要テーマである「認可コードフロー」のシーケンスを1ステップずつ動かして通信内容を可視化します。</p>
                    
                    <div class="form-group" style="flex-direction: row; gap: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                        <div>
                            <input type="checkbox" id="oauthUseState" checked>
                            <label for="oauthUseState" style="cursor: pointer;">🛡️ state パラメータを使用する (CSRF対策あり)</label>
                        </div>
                        <div>
                            <input type="checkbox" id="oauthUsePkce">
                            <label for="oauthUsePkce" style="cursor: pointer;">🔑 PKCE (Proof Key for Code Exchange) を有効にする</label>
                        </div>
                    </div>
                    
                    <!-- SVG Interactive Sequence Diagram -->
                    <div class="oauth-flow-diagram">
                        <svg class="oauth-svg" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg">
                            <!-- Actors Background Line -->
                            <line x1="80" y1="50" x2="80" y2="280" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="220" y1="50" x2="220" y2="280" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="380" y1="50" x2="380" y2="280" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="520" y1="50" x2="520" y2="280" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />

                            <!-- Actors Boxes -->
                            <rect id="actor-user" class="svg-actor" x="30" y="15" width="100" height="35" rx="5" />
                            <text class="svg-text" x="80" y="36">ユーザー (ブラウザ)</text>
                            
                            <rect id="actor-client" class="svg-actor" x="170" y="15" width="100" height="35" rx="5" />
                            <text class="svg-text" x="220" y="36">クライアント (アプリ)</text>
                            
                            <rect id="actor-auth" class="svg-actor" x="330" y="15" width="100" height="35" rx="5" />
                            <text class="svg-text" x="380" y="36">認可サーバー</text>
                            
                            <rect id="actor-resource" class="svg-actor" x="470" y="15" width="100" height="35" rx="5" />
                            <text class="svg-text" x="520" y="36">リソースサーバー</text>

                            <!-- Step Arrows -->
                            <!-- Step 1: User clicks Login (User -> Client) -->
                            <g id="arrow-1" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 80,75 L 210,75" marker-end="url(#arrowhead)" />
                                <text class="svg-text svg-text-sub" x="150" y="70">1. ログイン要求</text>
                            </g>

                            <!-- Step 2: Auth Redirect (Client -> User -> AuthServer) -->
                            <g id="arrow-2" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 220,110 L 80,110 L 370,110" marker-end="url(#arrowhead)" />
                                <text class="svg-text svg-text-sub" x="220" y="105">2. 認可要求 (リダイレクト)</text>
                            </g>

                            <!-- Step 3: Auth Consent & Code Redirect (AuthServer -> User -> Client) -->
                            <g id="arrow-3" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 380,155 L 80,155 L 210,155" marker-end="url(#arrowhead)" />
                                <text class="svg-text svg-text-sub" x="210" y="150">3. 同意＆認可コード返却</text>
                            </g>

                            <!-- Step 4: Token Exchange (Client -> AuthServer) (Backchannel) -->
                            <g id="arrow-4" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 220,205 L 370,205" marker-end="url(#arrowhead)" />
                                <path class="svg-arrow" d="M 370,225 L 225,225" marker-end="url(#arrowhead)" stroke-dasharray="2" />
                                <text class="svg-text svg-text-sub" x="295" y="200">4. コードとトークン交換</text>
                            </g>

                            <!-- Step 5: Resource Access (Client -> ResourceServer) (Backchannel) -->
                            <g id="arrow-5" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 220,260 L 510,260" marker-end="url(#arrowhead)" />
                                <path class="svg-arrow" d="M 510,280 L 225,280" marker-end="url(#arrowhead)" stroke-dasharray="2" />
                                <text class="svg-text svg-text-sub" x="365" y="255">5. アクセストークンでデータ取得</text>
                            </g>

                            <!-- Definitions for marker arrowheads -->
                            <defs>
                                <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                                    <polygon points="0 0, 7 3.5, 0 7" fill="currentColor" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                    
                    <!-- Sequence Controls -->
                    <div style="display: flex; gap: 14px; margin-top: 20px;">
                        <button class="btn btn-secondary" id="btnOauthReset">リセット</button>
                        <button class="btn btn-primary" id="btnOauthNext">次のステップへ進む</button>
                        <button class="btn btn-secondary" id="btnOauthAuto" style="color: var(--color-success); border-color: rgba(16, 185, 129, 0.4);">オートデモ実行</button>
                    </div>
                </div>
                
                <!-- Right: Step Explanation & Log -->
                <div class="card">
                    <h3>📁 HTTP パケット / パラメータ詳細</h3>
                    <p class="card-subtitle">現在のアクティブなステップで送信されている実際のパラメータとデータ内容です。</p>
                    
                    <div class="form-group">
                        <label>現在地:</label>
                        <div style="font-size: 14px; font-weight: bold; color: var(--color-primary-hover);" id="oauthStepTitle">
                            開始ボタンを押してください
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>HTTPメッセージ詳細:</label>
                        <div class="response-box" style="background-color: #0c0a09; height: 180px; overflow-y: auto;">
                            <code id="oauthPacketCode" style="color: #60a5fa;">シーケンスを開始するとパケットデータが表示されます。</code>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>セキュリティ解説:</label>
                        <div style="font-size: 13px; line-height: 1.5; color: var(--text-secondary);" id="oauthStepExplanation">
                            認可コードフローは、ブラウザ（フロントチャネル）を介して認可コードを渡し、そのコードをもとにクライアントがサーバー間通信（バックチャネル）で安全にトークンを取得する仕組みです。
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Learning Content: CSRF Attack scenario explanation -->
            <div class="card">
                <h3>💡 セキスペ試験対策：OAuth 2.0 / OIDC に潜む脅威と対策</h3>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px;">1. CSRF (クロスサイトリクエストフォージェリ) 攻撃と state</h4>
                        <p>
                            <b>攻撃手法</b>: 攻撃者は自分が認可サーバーから取得した「有効な認可コード」を含むリダイレクトURI（<code>https://client.com/callback?code=ATTACKER_CODE</code>）を、罠サイトなどを通じて被害者のブラウザに強制的に踏ませます。<br>
                            被害者は自分のブラウザでそのリクエストを送信し、被害者のクライアントアプリが攻撃者のコードを使ってトークン交換を行い、攻撃者のアカウントに被害者のセッションがバインドされてしまいます。<br><br>
                            <b>対策 (state)</b>: クライアントは認可要求時に推測困難な一時的な文字列 <code>state</code> を生成してセッションに保持し、認可サーバーへ送ります。コールバック時に戻ってきた <code>state</code> がセッションのものと一致するか検証することで、第三者が勝手に開始したリクエストを拒否できます。
                        </p>
                    </div>
                    
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px;">2. PKCE (Proof Key for Code Exchange)</h4>
                        <p>
                            <b>攻撃手法</b>: ネイティブアプリやSPAなどの「パブリッククライアント」では、認可コードを他アプリに盗聴されるリスク（認可コード横取り攻撃）があります。パブリッククライアントはクライアントシークレットを安全に保持できないため、コードがあれば誰でもアクセストークンを奪えてしまいます。<br><br>
                            <b>対策 (PKCE)</b>: 認可要求時にランダム値（<code>code_verifier</code>）のハッシュ値（<code>code_challenge</code>）を送信し、トークン交換時に生値の <code>code_verifier</code> を送信します。認可サーバー側で検証することで、途中でコードを盗んだ攻撃者（verifierを知らない）によるトークン交換を防ぎます。現在のOAuth 2.1ではPKCEが必須化されています。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        const btnOauthNext = document.getElementById("btnOauthNext");
        const btnOauthReset = document.getElementById("btnOauthReset");
        const btnOauthAuto = document.getElementById("btnOauthAuto");
        const oauthUseState = document.getElementById("oauthUseState");
        const oauthUsePkce = document.getElementById("oauthUsePkce");
        
        const oauthStepTitle = document.getElementById("oauthStepTitle");
        const oauthPacketCode = document.getElementById("oauthPacketCode");
        const oauthStepExplanation = document.getElementById("oauthStepExplanation");
        
        let currentStep = 0;
        let isAutoRunning = false;
        let stateVal = "";
        let codeVerifierVal = "";
        let codeChallengeVal = "";
        let codeVal = "";
        
        const steps = [
            {
                title: "ステップ 1: クライアントでログインボタンをクリック",
                explain: "ユーザーがクライアントアプリの「ログイン」ボタンを押します。クライアントはCSRF対策の state 値および、PKCE用の code_verifier / code_challenge（有効な場合）をローカルに生成して準備します。",
                getPacket: () => {
                    stateVal = oauthUseState.checked ? Math.random().toString(36).substring(2, 12) : "";
                    codeVerifierVal = oauthUsePkce.checked ? "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" : "";
                    codeChallengeVal = oauthUsePkce.checked ? "E9Melhoa2OwvFrGMTJguCHaoeK1t8URWbuGJSstw-cM" : "";
                    
                    return `[Client Internal Action]\n` +
                           `Generated Local Sessions:\n` +
                           (oauthUseState.checked ? ` - State Session: "${stateVal}"\n` : ` - State Session: [NONE! CSRF危険状態]\n`) +
                           (oauthUsePkce.checked ? ` - PKCE Code Verifier: "${codeVerifierVal}"\n - PKCE Challenge Method: S256\n` : "");
                },
                actors: ["actor-user", "actor-client"],
                arrows: ["arrow-1"]
            },
            {
                title: "ステップ 2: 認可サーバーへのリダイレクト (認可要求)",
                explain: "クライアントは、ユーザーのブラウザを認可サーバーの /authorize エンドポイントへリダイレクトさせます。パラメータにクライアントID、リダイレクトURI、スコープ、および生成した state / code_challenge を付与します。",
                getPacket: () => {
                    const stateParam = oauthUseState.checked ? `&state=${stateVal}` : "";
                    const pkceParams = oauthUsePkce.checked ? `&code_challenge=${codeChallengeVal}&code_challenge_method=S256` : "";
                    return `GET /authorize?response_type=code\n` +
                           `    &client_id=sec_lab_app_777\n` +
                           `    &redirect_uri=http://127.0.0.1:18000/callback\n` +
                           `    &scope=openid%20profile\n` +
                           `    ${stateParam}\n` +
                           `    ${pkceParams} HTTP/1.1\n` +
                           `Host: auth.securitylab.local`;
                },
                actors: ["actor-user", "actor-auth"],
                arrows: ["arrow-2"]
            },
            {
                title: "ステップ 3: 認証・同意と認可コードの発行 (リダイレクトバック)",
                explain: "認可サーバーはユーザーを認証し、データへの同意を求めます。同意後、ブラウザをリダイレクトURIに戻し、クエリパラメータとして一時的な「認可コード (code)」および「state」を返却します。クライアントは受取った state が自身のセッション値と一致するかチェックします。",
                getPacket: () => {
                    codeVal = "spl_auth_code_" + Math.random().toString(36).substring(2, 8);
                    const stateParam = oauthUseState.checked ? `&state=${stateVal}` : "";
                    
                    let securityNote = "";
                    if (!oauthUseState.checked) {
                        securityNote = "\n\n⚠️ 【セキュリティ警告】: stateパラメータがありません！攻撃者が作成した「罠の認可コードリクエスト」を流し込まれるCSRF攻撃を防御できません。";
                    } else {
                        securityNote = "\n\n🛡️ 【セキュリティ検証成功】: クライアントは受信した state とローカルセッションの state が一致することを確認しました！";
                    }
                    
                    return `HTTP/1.1 302 Found\n` +
                           `Location: http://127.0.0.1:18000/callback?code=${codeVal}${stateParam}${securityNote}`;
                },
                actors: ["actor-auth", "actor-user", "actor-client"],
                arrows: ["arrow-3"]
            },
            {
                title: "ステップ 4: 認可コードとトークンの交換 (バックチャネル通信)",
                explain: "クライアントアプリは、ブラウザを介さずに直接サーバー間通信（バックチャネル）で認可サーバーの /token エンドポイントへPOSTリクエストを送信します。認可コード、クライアント秘密鍵（Client Secret）、およびPKCE用の code_verifier（有効な場合）を送り、アクセストークンを取得します。",
                getPacket: () => {
                    const pkceVerifier = oauthUsePkce.checked ? `&code_verifier=${codeVerifierVal}` : "";
                    
                    return `POST /token HTTP/1.1\n` +
                           `Host: auth.securitylab.local\n` +
                           `Content-Type: application/x-www-form-urlencoded\n` +
                           `Authorization: Basic c2VjX2xhYl9hcHBfNzc3OmNsaWVudF9zZWNyZXRfcGFzc3dvcmQ=\n\n` +
                           `grant_type=authorization_code\n` +
                           `&code=${codeVal}\n` +
                           `&redirect_uri=http://127.0.0.1:18000/callback\n` +
                           `${pkceVerifier}\n\n` +
                           `-----------------------------------------\n` +
                           `[RESPONSE FROM AUTH SERVER]\n` +
                           `HTTP/1.1 200 OK\n` +
                           `Content-Type: application/json\n\n` +
                           `{\n` +
                           `  "access_token": "eyJhbGciOi...", \n` +
                           `  "token_type": "Bearer",\n` +
                           `  "expires_in": 3600,\n` +
                           `  "id_token": "eyJhbGciOi..." (OIDCの場合)\n` +
                           `}`;
                },
                actors: ["actor-client", "actor-auth"],
                arrows: ["arrow-4"]
            },
            {
                title: "ステップ 5: アクセストークンを使ったリソース（ユーザー情報）取得",
                explain: "取得したアクセストークンをHTTPの Authorization ヘッダー（Bearerスキーム）に付与して、リソースサーバーの /userinfo にアクセスし、ユーザーデータを取得してログイン処理が完了します。",
                getPacket: () => {
                    return `GET /userinfo HTTP/1.1\n` +
                           `Host: api.securitylab.local\n` +
                           `Authorization: Bearer eyJhbGciOi... (アクセストークン)\n\n` +
                           `-----------------------------------------\n` +
                           `[RESPONSE FROM RESOURCE SERVER]\n` +
                           `HTTP/1.1 200 OK\n` +
                           `Content-Type: application/json\n\n` +
                           `{\n` +
                           `  "sub": "user_10283",\n` +
                           `  "username": "user",\n` +
                           `  "email": "user@example.com",\n` +
                           `  "status": "authorized"\n` +
                           `}`;
                },
                actors: ["actor-client", "actor-resource"],
                arrows: ["arrow-5"]
            }
        ];
        
        function updateUI() {
            // Remove active classes on all elements
            document.querySelectorAll(".svg-actor").forEach(a => a.classList.remove("svg-actor-active"));
            document.querySelectorAll(".flow-arrow-group path").forEach(p => p.classList.remove("svg-arrow-active"));
            
            if (currentStep === 0) {
                oauthStepTitle.innerText = "認可フロー待機中";
                oauthPacketCode.innerText = "「次のステップへ進む」を押して、フローを開始してください。";
                oauthStepExplanation.innerText = "認可コードフローは最も標準的なOAuthフローです。各ステップの通信パケットを確認できます。";
                btnOauthNext.innerText = "フローを開始する";
                return;
            }
            
            btnOauthNext.innerText = currentStep === steps.length ? "完了 (リセット)" : "次のステップへ進む";
            
            const step = steps[currentStep - 1];
            oauthStepTitle.innerText = `${currentStep}/${steps.length} - ${step.title}`;
            oauthStepExplanation.innerText = step.explain;
            oauthPacketCode.innerText = step.getPacket();
            
            // Highlight active actors
            step.actors.forEach(actorId => {
                const el = document.getElementById(actorId);
                if (el) el.classList.add("svg-actor-active");
            });
            
            // Highlight active arrows
            step.arrows.forEach(arrowId => {
                const group = document.getElementById(arrowId);
                if (group) {
                    group.querySelectorAll("path").forEach(p => p.classList.add("svg-arrow-active"));
                }
            });
            
            // Log to terminal console
            app.log('system', `OAuth Flow Step ${currentStep}: ${step.title}`);
        }
        
        // 1. Next step handler
        btnOauthNext.addEventListener("click", () => {
            if (currentStep >= steps.length) {
                resetFlow();
                return;
            }
            currentStep++;
            updateUI();
        });
        
        // 2. Reset flow handler
        function resetFlow() {
            currentStep = 0;
            isAutoRunning = false;
            btnOauthAuto.innerText = "オートデモ実行";
            updateUI();
        }
        btnOauthReset.addEventListener("click", resetFlow);
        
        // 3. Auto play handler
        btnOauthAuto.addEventListener("click", () => {
            if (isAutoRunning) {
                isAutoRunning = false;
                btnOauthAuto.innerText = "オートデモ実行";
                return;
            }
            
            isAutoRunning = true;
            btnOauthAuto.innerText = "停止";
            
            const runAuto = () => {
                if (!isAutoRunning) return;
                if (currentStep >= steps.length) {
                    resetFlow();
                    return;
                }
                currentStep++;
                updateUI();
                
                if (currentStep < steps.length) {
                    setTimeout(runAuto, 2500);
                } else {
                    isAutoRunning = false;
                    btnOauthAuto.innerText = "オートデモ実行";
                }
            };
            
            runAuto();
        });
        
        // Handle checklist settings change
        oauthUseState.addEventListener("change", () => {
            resetFlow();
            app.log('system', `OAuth設定変更: state検証 = ${oauthUseState.checked}`);
        });
        
        oauthUsePkce.addEventListener("change", () => {
            resetFlow();
            app.log('system', `OAuth設定変更: PKCE = ${oauthUsePkce.checked}`);
        });
        
        // Initial setup
        resetFlow();
    }
};
