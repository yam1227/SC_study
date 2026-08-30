/**
 * Module 8: Kerberos Authentication & Log Lab
 */
window.SecurityLabModules["kerberos"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2" style="grid-template-columns: 1.2fr 0.8fr;">
                <!-- Left: Kerberos sequence simulator -->
                <div class="card">
                    <h3>🔑 Kerberos (ケルベロス) 認証シミュレーター</h3>
                    <p class="card-subtitle">Windows Active Directoryなどで広く使われる、チケットシステムに基づくシングルサインオン（SSO）プロトコルの動作をステップ毎に可視化します。</p>
                    
                    <div class="form-group">
                        <label for="krbUsername">認証ユーザーID (Client Principal):</label>
                        <input type="text" id="krbUsername" value="user" placeholder="ユーザーID">
                    </div>
                    
                    <div class="form-group">
                        <label for="krbService">利用するサービスサーバー (Service Principal):</label>
                        <select id="krbService">
                            <option value="CIFS/file_server" selected>ファイル共有サーバー (CIFS/file_server)</option>
                            <option value="HTTP/intranet_web">社内イントラWebサーバー (HTTP/intranet_web)</option>
                            <option value="LDAP/directory_service">ディレクトリサービス (LDAP/directory)</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px;">
                        <button class="btn btn-primary" id="btnKrbStep1">【ステップ 1】AS-REQ & AS-REP (TGTの取得)</button>
                        <button class="btn btn-primary" id="btnKrbStep2" disabled>【ステップ 2】TGS-REQ & TGS-REP (サービスチケットの取得)</button>
                        <button class="btn btn-primary" id="btnKrbStep3" disabled>【ステップ 3】AP-REQ & AP-REP (サービスへのログイン)</button>
                    </div>
                    
                    <!-- Visual Actor Statuses -->
                    <div style="background-color: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-top: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
                        <div id="krb-node-client" style="border: 1px solid var(--border-color); padding: 8px; border-radius: 4px;">
                            <div class="node-icon-lg">💻</div>
                            <span class="text-base" style="font-weight: bold;">クライアント</span><br>
                            <span id="status-client" class="text-xs text-muted">チケットなし</span>
                        </div>
                        <div id="krb-node-as" style="border: 1px solid var(--border-color); padding: 8px; border-radius: 4px;">
                            <div class="node-icon-lg">🏢</div>
                            <span class="text-base" style="font-weight: bold; color: #fb7185;">KDC: AS</span><br>
                            <span class="text-xs text-muted">認証サービス</span>
                        </div>
                        <div id="krb-node-tgs" style="border: 1px solid var(--border-color); padding: 8px; border-radius: 4px;">
                            <div class="node-icon-lg">🎟️</div>
                            <span class="text-base" style="font-weight: bold; color: #d97706;">KDC: TGS</span><br>
                            <span class="text-xs text-muted">チケット交付</span>
                        </div>
                        <div id="krb-node-ap" style="border: 1px solid var(--border-color); padding: 8px; border-radius: 4px;">
                            <div class="node-icon-lg">🖥️</div>
                            <span class="text-base" style="font-weight: bold; color: #38bdf8;">APサーバー</span><br>
                            <span id="status-ap" class="text-xs text-muted">未認証</span>
                        </div>
                    </div>
                </div>
                
                <!-- Right: Detailed Packets and logs -->
                <div class="card">
                    <h3>📁 認証ログ / チケット詳細インスペクター</h3>
                    <p class="card-subtitle">現在送信されたパケットデータ、チケット情報、暗号化に用いられた鍵のトレースです。</p>
                    
                    <div class="form-group">
                        <label>現在のアクティビティ:</label>
                        <div class="text-md text-primary-color" style="font-weight: bold;" id="krbStepTitle">
                            ステップ1を実行してください
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>パケットログ・データ詳細:</label>
                        <div class="response-box" style="background-color: #0c0a09; height: 260px; overflow-y: auto;">
                            <code id="krbLogCode" class="text-sm" style="color: #60a5fa;">リクエストを実行するとログが表示されます。</code>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Kerberos Study Guide -->
            <div class="card">
                <h3>💡 情報処理安全確保支援士試験ポイント: Kerberos認証の流れと脅威</h3>
                <div class="text-base text-muted" style="line-height: 1.6; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 6px;">1. Kerberosの3段階フェーズ</h4>
                        <p>
                            Kerberosは、以下の3段階の往復でSSOを実現します。<br>
                            - <strong>第一段階 (AS)</strong>: パスワードをネットワークに流さず、本人のパスワードから作成した暗号鍵を用いて、共通の入場パスとなる <strong>「TGT（チケット送信チケット）」</strong> を取得します。<br>
                            - <strong>第二段階 (TGS)</strong>: 取得した TGT を提示して、目的の個別サービスを利用するための <strong>「サービス利用チケット」</strong> を交付してもらいます。<br>
                            - <strong>第三段階 (AP)</strong>: サービスチケットを提示して、対象サーバー（ファイルサーバー等）にログインします。
                        </p>
                    </div>
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 6px;">2. チケット情報の暗号化と検証者</h4>
                        <p>
                            チケットシステムにおいて、「誰がどの鍵で暗号化したか、誰が復号して検証するか」が頻出します。<br>
                            - <strong>TGT (Ticket Granting Ticket)</strong>: <b style="color: #fb7185;">TGSの秘密鍵</b>で暗号化されています。そのため、クライアント（ユーザー）は中身を改ざんできず、そのままTGSに送信します。TGS自身のみが復号して検証できます。<br>
                            - <strong>サービス利用チケット</strong>: <b style="color: #38bdf8;">目的のサービスサーバーの秘密鍵</b>で暗号化されています。クライアントは中身を読めず、そのままサービスサーバーに送信します。サービスサーバー自身のみが復号できます。<br><br>
                            ※パスワードの平文通信がないため、盗聴によるパスワード漏洩を防げますが、<strong>KDC（キー配布センター）</strong>が単一障害点（SPOF）となる弱点があります。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `,

    references: [
        { source: "RFC 4120", title: "The Kerberos Network Authentication Service (V5)", url: "https://datatracker.ietf.org/doc/html/rfc4120", note: "Kerberos認証プロトコルの基本仕様" },
        { source: "IPA 独立行政法人 情報処理推進機構", title: "情報処理安全確保支援士 シラバス（シングルサインオンとKerberos認証）", url: "https://www.ipa.go.jp/shiken/syllabus/gaiyou.html" },
        { source: "Microsoft Learn", title: "Kerberos 認証の概要 (Active Directory ドメイン認証)", url: "https://learn.microsoft.com/ja-jp/windows-server/security/kerberos/kerberos-authentication-overview" }
    ],
    
    init: function(app) {
        const btnStep1 = document.getElementById("btnKrbStep1");
        const btnStep2 = document.getElementById("btnKrbStep2");
        const btnStep3 = document.getElementById("btnKrbStep3");
        const krbUsername = document.getElementById("krbUsername");
        const krbService = document.getElementById("krbService");
        
        const krbStepTitle = document.getElementById("krbStepTitle");
        const krbLogCode = document.getElementById("krbLogCode");
        
        const nodeClient = document.getElementById("krb-node-client");
        const nodeAs = document.getElementById("krb-node-as");
        const nodeTgs = document.getElementById("krb-node-tgs");
        const nodeAp = document.getElementById("krb-node-ap");
        
        const statusClient = document.getElementById("status-client");
        const statusAp = document.getElementById("status-ap");
        
        let sessionTgt = "";
        let sessionServiceTicket = "";
        let krbUser = "";
        let serviceName = "";
        
        // Reset states
        function resetStates() {
            btnStep2.disabled = true;
            btnStep3.disabled = true;
            statusClient.innerText = "チケットなし";
            statusClient.style.color = "var(--text-secondary)";
            statusAp.innerText = "未認証";
            statusAp.style.color = "var(--text-secondary)";
            nodeClient.style.borderColor = "var(--border-color)";
            nodeAs.style.borderColor = "var(--border-color)";
            nodeTgs.style.borderColor = "var(--border-color)";
            nodeAp.style.borderColor = "var(--border-color)";
        }
        
        krbUsername.addEventListener("input", resetStates);
        krbService.addEventListener("change", resetStates);
        
        // Step 1: AS-REQ -> AS-REP
        btnStep1.addEventListener("click", async () => {
            resetStates();
            krbUser = krbUsername.value.trim();
            if (!krbUser) {
                alert("ユーザーIDを入力してください。");
                return;
            }
            
            krbStepTitle.innerText = "ステップ 1/3: 認証サービス (AS) へTGTを要求中...";
            nodeClient.style.borderColor = "var(--color-primary)";
            nodeAs.style.borderColor = "var(--color-primary)";
            
            try {
                const res = await app.apiCall("/api/auth/kerberos", "POST", {
                    step: "AS-REQ",
                    username: krbUser
                });
                
                sessionTgt = res.response.tgt_hex;
                
                krbStepTitle.innerText = "ステップ 1/3: TGTの取得完了";
                statusClient.innerText = "🎫 TGT保有 (krbtgt)";
                statusClient.style.color = "var(--color-warning)";
                
                btnStep2.disabled = false;
                
                krbLogCode.innerHTML = `
[SENT PACKET - CLIENT -> AS]
${res.sent_request}

--------------------------------------------------
[RECEIVED PACKET - AS -> CLIENT]
Step: ${res.step}

1. 暗号化されたTGT (Ticket Granting Ticket):
   "${res.response.tgt_hex}"
   🔑 暗号鍵: K_tgs (TGSの秘密鍵) -> クライアント側では復号不可

2. 暗号化されたセッション鍵 (Client-TGS Session Key):
   "${res.response.session_key_enc}"
   🔑 暗号鍵: K_user (ユーザーパスワードから生成) -> クライアント側で復号可能
   ➔ 復号された鍵: "${res.response.session_key}"

--------------------------------------------------
[TGT内部データ (デコードイメージ)]
${JSON.stringify(res.response.raw_tgt_content_visible, null, 2)}

==================================================
${res.explanation}
`;
                
                app.log('system', "Kerberos Step 1: AS-REQ / AS-REP 完了。TGTをクライアントに保存しました。");
                
            } catch (err) {
                krbLogCode.innerText = "エラー: " + err.message;
            }
        });
        
        // Step 2: TGS-REQ -> TGS-REP
        btnStep2.addEventListener("click", async () => {
            if (!sessionTgt) return;
            serviceName = krbService.value;
            
            krbStepTitle.innerText = "ステップ 2/3: チケット交付サービス (TGS) へサービスチケットを要求中...";
            nodeClient.style.borderColor = "var(--color-primary)";
            nodeTgs.style.borderColor = "var(--color-primary)";
            
            try {
                const res = await app.apiCall("/api/auth/kerberos", "POST", {
                    step: "TGS-REQ",
                    username: krbUser,
                    service_name: serviceName
                });
                
                sessionServiceTicket = res.response.service_ticket_hex;
                
                krbStepTitle.innerText = "ステップ 2/3: サービスチケットの取得完了";
                statusClient.innerText = `🎫 サービスチケット保有 (${serviceName})`;
                statusClient.style.color = "var(--color-success)";
                
                btnStep3.disabled = false;
                
                krbLogCode.innerHTML = `
[SENT PACKET - CLIENT -> TGS]
${res.sent_request}
- 送信データ: TGT + Authenticator (Client-TGSセッション鍵で暗号化した認証子)

--------------------------------------------------
[RECEIVED PACKET - TGS -> CLIENT]
Step: ${res.step}

1. 暗号化されたサービスチケット (Service Ticket):
   "${res.response.service_ticket_hex}"
   🔑 暗号鍵: K_service (目的サービスサーバーの秘密鍵) -> クライアント側では復号不可

2. 暗号化されたセッション鍵 (Client-Server Session Key):
   "${res.response.session_key_enc}"
   🔑 暗号鍵: K_c_tgs (Client-TGSセッション鍵) -> クライアント側で復号可能
   ➔ 復号された鍵: "${res.response.session_key}"

--------------------------------------------------
[サービスチケット内部データ (デコードイメージ)]
${JSON.stringify(res.response.raw_ticket_content_visible, null, 2)}

==================================================
${res.explanation}
`;
                
                app.log('system', `Kerberos Step 2: TGS-REQ / TGS-REP 完了。サービスチケット [${serviceName}] を取得しました。`);
                
            } catch (err) {
                krbLogCode.innerText = "エラー: " + err.message;
            }
        });
        
        // Step 3: AP-REQ -> AP-REP
        btnStep3.addEventListener("click", async () => {
            if (!sessionServiceTicket) return;
            
            krbStepTitle.innerText = "ステップ 3/3: サービスサーバー (AP) へチケットを送信中...";
            nodeClient.style.borderColor = "var(--color-primary)";
            nodeAp.style.borderColor = "var(--color-primary)";
            
            try {
                const res = await app.apiCall("/api/auth/kerberos", "POST", {
                    step: "AP-REQ",
                    username: krbUser,
                    service_name: serviceName
                });
                
                krbStepTitle.innerText = "ステップ 3/3: 認証成功・セッション確立！";
                statusAp.innerText = "🟢 認証済";
                statusAp.style.color = "var(--color-success)";
                
                krbLogCode.innerHTML = `
[SENT PACKET - CLIENT -> AP]
${res.sent_request}
- 送信データ: サービス利用チケット + Authenticator (Client-Serverセッション鍵で暗号化した認証子)

--------------------------------------------------
[RECEIVED PACKET - AP -> CLIENT]
Step: ${res.step}

認証結果: ${res.response.message}

--------------------------------------------------
[APサーバー側での検証処理]
${res.response.explanation_ap}

==================================================
${res.explanation}
`;
                
                app.log('response', `Kerberos Step 3: AP-REQ / AP-REP 完了。サービス [${serviceName}] へのログインが成功しました。`);
                
            } catch (err) {
                krbLogCode.innerText = "エラー: " + err.message;
            }
        });
    }
};
