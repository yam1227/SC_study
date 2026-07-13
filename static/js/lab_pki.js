/**
 * Module 15: Public Key Infrastructure & Certificate Authority Lab
 */
window.SecurityLabModules["pki"] = {
    html: `
        <style>
            .pki-layout {
                display: flex;
                flex-direction: column;
                gap: 20px;
                margin-bottom: 24px;
            }
            .topology-container {
                position: relative;
                background: #0f172a;
                border-radius: 8px;
                border: 1px solid var(--border-color);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                min-height: 400px;
            }
            .topology-header {
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.02);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .topology-header h4 {
                margin: 0;
                font-size: 14px;
                color: var(--text-primary);
            }
            .topology-map {
                flex-grow: 1;
                width: 100%;
                height: 100%;
                min-height: 350px;
            }
            .node-label {
                font-family: 'Inter', sans-serif;
                font-size: 11px;
                fill: #94a3b8;
                text-anchor: middle;
                font-weight: 500;
            }
            .node-title {
                font-family: 'Outfit', sans-serif;
                font-size: 13px;
                fill: #ffffff;
                text-anchor: middle;
                font-weight: 600;
            }
            .connection-line {
                stroke: #334155;
                stroke-width: 2px;
                fill: none;
            }
            @keyframes pulse-flow {
                to {
                    stroke-dashoffset: -40;
                }
            }
            .connection-line.pulse {
                stroke: #38bdf8;
                stroke-dasharray: 8, 4;
                stroke-width: 3px;
                animation: pulse-flow 1.5s linear infinite;
            }
            .connection-line.pulse-reverse {
                stroke: #38bdf8;
                stroke-dasharray: 8, 4;
                stroke-width: 3px;
                animation: pulse-flow 1.5s linear infinite reverse;
            }
            .connection-line.pulse-red {
                stroke: #f43f5e;
                stroke-dasharray: 8, 4;
                stroke-width: 3px;
                animation: pulse-flow 1.5s linear infinite;
            }
            .node-circle {
                fill: #1e293b;
                stroke: #475569;
                stroke-width: 2px;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .node-circle:hover, .node-circle.active-node {
                fill: #0f172a;
                stroke: #38bdf8;
                filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
            }
            .node-circle.ca-node {
                stroke: #a855f7;
            }
            .node-circle.ca-node:hover, .node-circle.ca-node.active-node {
                stroke: #c084fc;
                filter: drop-shadow(0 0 8px rgba(192, 132, 252, 0.4));
            }
            .node-circle.aa-node {
                stroke: #f59e0b;
            }
            .node-circle.aa-node:hover, .node-circle.aa-node.active-node {
                stroke: #fbbf24;
                filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
            }
            .control-panel {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .pki-tabs {
                display: flex;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 3px;
            }
            .pki-tab-btn {
                flex-grow: 1;
                background: transparent;
                border: none;
                color: var(--text-secondary);
                padding: 8px 12px;
                font-size: 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .pki-tab-btn.active {
                background: var(--color-primary);
                color: #ffffff;
                font-weight: 500;
            }
            .pki-tab-content {
                display: none;
            }
            .pki-tab-content.active {
                display: block;
            }
            .pki-log {
                background: #020617;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 10px;
                height: 120px;
                overflow-y: auto;
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                color: #38bdf8;
                margin-top: 14px;
            }
            .pem-text {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                background: rgba(0,0,0,0.3);
                border: 1px solid var(--border-color);
                padding: 8px;
                border-radius: 4px;
                max-height: 140px;
                overflow-y: auto;
                color: #94a3b8;
                white-space: pre-wrap;
                word-break: break-all;
                line-height: 1.4;
            }
        </style>

        <div class="pki-layout">
            <!-- Topology Interactive Map -->
            <div class="topology-container">
                <div class="topology-header">
                    <h4>📡 PKI エンティティ & データフロー・マップ</h4>
                    <span id="pkiFlowStatus" style="font-size: 11px; color: var(--text-secondary);">ノードをクリックすると役割が表示されます</span>
                </div>
                
                <svg class="topology-map" id="pkiSvg" viewBox="0 0 750 380">
                    <!-- Definitions for markers and filters -->
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                        </marker>
                        <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                        </marker>
                        <marker id="arrow-active-red" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                        </marker>
                    </defs>

                    <!-- Connection Lines -->
                    <!-- User <-> RA -->
                    <path d="M 120 280 L 120 120" class="connection-line" id="line-user-ra" marker-end="url(#arrow)" />
                    <!-- RA <-> CA -->
                    <path d="M 150 90 L 340 50" class="connection-line" id="line-ra-ca" marker-end="url(#arrow)" />
                    <!-- CA -> Repository -->
                    <path d="M 375 80 L 375 160" class="connection-line" id="line-ca-repo" marker-end="url(#arrow)" />
                    <!-- User -> Server (Auth/Handshake) -->
                    <path d="M 160 300 L 590 300" class="connection-line" id="line-user-server" marker-end="url(#arrow)" />
                    <!-- Server -> VA (OCSP Request) -->
                    <path d="M 610 270 L 610 120" class="connection-line" id="line-server-va" marker-end="url(#arrow)" />
                    <!-- Server -> Repository (CRL Download) -->
                    <path d="M 590 285 L 410 200" class="connection-line" id="line-server-repo" marker-end="url(#arrow)" />
                    <!-- User <-> AA (Attribute Request) - Connect User(120,300) to AA(260,185) -->
                    <path d="M 140 280 L 240 200" class="connection-line" id="line-user-aa" marker-end="url(#arrow)" />
                    
                    <!-- Nodes (Circles with icons) -->
                    <!-- CA (Certificate Authority) -->
                    <g transform="translate(375, 50)" class="pki-node" data-node="ca">
                        <circle r="30" class="node-circle ca-node" id="node-ca" />
                        <text y="5" font-size="20" text-anchor="middle">🏛️</text>
                        <text y="42" class="node-title">CA (認証局)</text>
                        <text y="54" class="node-label">Certificate Authority</text>
                    </g>
                    
                    <!-- RA (Registration Authority) -->
                    <g transform="translate(120, 90)" class="pki-node" data-node="ra">
                        <circle r="25" class="node-circle" id="node-ra" />
                        <text y="5" font-size="16" text-anchor="middle">🔎</text>
                        <text y="38" class="node-title">RA (登録局)</text>
                        <text y="50" class="node-label">Registration Authority</text>
                    </g>
                    
                    <!-- VA (Validation Authority) -->
                    <g transform="translate(610, 90)" class="pki-node" data-node="va">
                        <circle r="25" class="node-circle" id="node-va" />
                        <text y="5" font-size="16" text-anchor="middle">🤖</text>
                        <text y="38" class="node-title">VA (検証局 / OCSP)</text>
                        <text y="50" class="node-label">Validation Authority</text>
                    </g>
                    
                    <!-- AA (Attribute Authority) - Moved to x=260 (left of Repository) -->
                    <g transform="translate(260, 185)" class="pki-node" data-node="aa">
                        <circle r="25" class="node-circle aa-node" id="node-aa" />
                        <text y="5" font-size="16" text-anchor="middle">🛡️</text>
                        <text y="38" class="node-title">AA (属性認証局)</text>
                        <text y="50" class="node-label">Attribute Authority</text>
                    </g>
                    
                    <!-- Repository -->
                    <g transform="translate(375, 185)" class="pki-node" data-node="repo">
                        <circle r="25" class="node-circle" id="node-repo" />
                        <text y="5" font-size="16" text-anchor="middle">🛢️</text>
                        <text y="38" class="node-title">リポジトリ</text>
                        <text y="50" class="node-label">Repository (LDAP/Web)</text>
                    </g>
                    
                    <!-- User / EE (End Entity) -->
                    <g transform="translate(120, 300)" class="pki-node" data-node="user">
                        <circle r="25" class="node-circle" id="node-user" />
                        <text y="5" font-size="16" text-anchor="middle">👤</text>
                        <text y="38" class="node-title">利用者 (EE)</text>
                        <text y="50" class="node-label">End Entity</text>
                    </g>
                    
                    <!-- Web Server (Relying Party) -->
                    <g transform="translate(610, 300)" class="pki-node" data-node="server">
                        <circle r="25" class="node-circle" id="node-server" />
                        <text y="5" font-size="16" text-anchor="middle">💻</text>
                        <text y="38" class="node-title">Webサーバー</text>
                        <text y="50" class="node-label">Relying Party (検証者)</text>
                    </g>
                </svg>

                <!-- Dynamic explanation box inside map card -->
                <div style="padding: 12px 16px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-color); font-size: 12px; line-height: 1.5;" id="pkiNodeExplainer">
                    <b>💡 インタラクティブマップ:</b> 上記の丸いノードをクリックすると、その機関の役割とセキスペ試験でのポイントが表示されます。
                </div>
            </div>

            <!-- Action Control Panel (Moved beneath the map) -->
            <div class="control-panel">
                <div class="pki-tabs">
                    <button class="pki-tab-btn active" data-tab="tab-issue">① 証明書発行</button>
                    <button class="pki-tab-btn" data-tab="tab-verify">② 失効・検証</button>
                    <button class="pki-tab-btn" data-tab="tab-ac">③ 属性証明書</button>
                </div>

                <!-- Tab 1: Certificate Issuance (CSR -> RA -> CA) -->
                <div class="card pki-tab-content active" id="tab-issue">
                    <h4>🔑 X.509 公開鍵証明書の発行フロー</h4>
                    <p class="card-subtitle" style="margin-bottom: 16px;">公開鍵と身元情報を結びつける証明書を発行します。</p>
                    
                    <div class="lab-grid-2" style="gap: 20px;">
                        <div>
                            <div class="form-group">
                                <label for="pkiCn">コモンネーム (CN - 氏名/ドメイン):</label>
                                <input type="text" id="pkiCn" value="Alice Smith" placeholder="例: Alice Smith または domain.com">
                            </div>
                            <div class="form-group" style="margin-top: 10px;">
                                <label for="pkiOrg">組織名 (O):</label>
                                <input type="text" id="pkiOrg" value="Science Univ" placeholder="例: Science Univ">
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
                                <button class="btn btn-primary" id="btnPkiCsr">【ステップ 1】CSR (証明書署名要求) を生成</button>
                                <button class="btn btn-secondary" id="btnPkiSubmitRa" disabled>【ステップ 2】RA (登録局) に本人確認申請</button>
                                <button class="btn btn-secondary" id="btnPkiIssueCa" style="border-color: var(--color-success);" disabled>【ステップ 3】CA (認証局) で署名・発行</button>
                            </div>
                        </div>
                        
                        <div>
                            <div id="pkiCertInventory">
                                <div class="form-group">
                                    <label>発行された証明書のシリアル番号:</label>
                                    <div class="response-box" style="padding: 6px;"><code id="outPkiSerial" style="color: #fb7185;">未発行</code></div>
                                </div>
                                <div class="form-group" style="margin-top: 8px;">
                                    <label>X.509 証明書 (PEM形式) - 公開鍵と署名を含む:</label>
                                    <div class="pem-text" id="outPkiCertPem">-----</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 2: Revocation & Verification (CRL vs OCSP) -->
                <div class="card pki-tab-content" id="tab-verify">
                    <h4>🔍 証明書の有効性検証 (CRL vs OCSP)</h4>
                    <p class="card-subtitle" style="margin-bottom: 16px;">鍵漏洩時などの失効処理と、検証者の検証方式の違いを比較します。</p>
                    
                    <div class="lab-grid-2" style="gap: 20px;">
                        <div>
                            <div class="form-group">
                                <label for="pkiSelectCert">検証・失効対象の証明書:</label>
                                <select id="pkiSelectCert" style="width:100%; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 6px; border-radius: 4px;">
                                    <option value="">-- 証明書を選択してください --</option>
                                </select>
                            </div>
        
                            <div style="display: flex; gap: 8px; margin-top: 10px;">
                                <button class="btn btn-primary" id="btnPkiRevoke" style="background-color: var(--color-danger); border-color: var(--color-danger);" disabled>証明書を失効申請 (Revoke)</button>
                            </div>
        
                            <div style="border-top: 1px solid var(--border-color); margin-top: 14px; padding-top: 14px;">
                                <label>検証方式の選択と実行:</label>
                                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                                    <button class="btn btn-secondary" id="btnPkiCheckCrl" disabled>方式A: CRL（失効リスト）を取得して検証</button>
                                    <button class="btn btn-secondary" id="btnPkiCheckOcsp" disabled>方式B: OCSPでVAに問い合わせて検証</button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div>
                                <label>検証結果レポート:</label>
                                <div class="response-box" id="pkiVerifyReportBox" style="min-height: 140px; font-size: 12px; line-height: 1.6;">
                                    <span id="pkiVerifyReport">証明書を選択し、検証方式（CRL または OCSP）を実行してください。</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 3: Attribute Authority & Access Control (AA & AC) -->
                <div class="card pki-tab-content" id="tab-ac">
                    <h4>🛡️ 属性証明書 (AC) による特権認可</h4>
                    <p class="card-subtitle" style="margin-bottom: 16px;">AAは公開鍵を含まない「職位・権限の証明書（AC）」を発行します。</p>
                    
                    <div class="lab-grid-2" style="gap: 20px;">
                        <div>
                            <div class="form-group">
                                <label for="pkiAcSelectCert">身元証明書 (PKC) シリアル選択:</label>
                                <select id="pkiAcSelectCert" style="width:100%; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 6px; border-radius: 4px;">
                                    <option value="">-- 証明書を選択してください --</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="margin-top: 10px;">
                                <label for="pkiAcRole">付与する特権職位 (属性):</label>
                                <select id="pkiAcRole" style="width:100%; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 6px; border-radius: 4px;">
                                    <option value="Admin">管理者 (Admin) - read/write/admin 権限</option>
                                    <option value="Staff">一般社員 (Staff) - read 権限</option>
                                </select>
                            </div>
        
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
                                <button class="btn btn-primary" id="btnPkiIssueAc" disabled>AA (属性認証局) から属性証明書 (AC) を発行</button>
                                <button class="btn btn-secondary" id="btnPkiAccessServer" style="border-color: var(--color-success);" disabled>サーバーの特権機能へアクセス検証</button>
                            </div>
                        </div>
                        
                        <div>
                            <div id="pkiAcResultArea">
                                <div class="form-group">
                                    <label>発行された属性証明書 (AC JSON):</label>
                                    <div class="pem-text" id="outPkiAcJson">-----</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Simulation Execution Logs -->
                <div class="pki-log" id="pkiSimLog">
                    [SYSTEM] 認証局モジュールがロードされました。
                </div>
            </div>
        </div>

        <!-- Reference Documents Links (Required by AGENTS.md) -->
        <div class="card" style="margin-top: 24px;">
            <h3>📚 参照元・公式仕様リファレンス</h3>
            <p class="card-subtitle">本モジュールの解説およびシミュレーションは、以下の信頼できる仕様書・情報源を参考に構築されています。</p>
            <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.6; font-size: 13px;">
                <li><a href="https://www.ipa.go.jp/security/pki/" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">IPA: 公開鍵基盤 (PKI) について</a> - 暗号技術や認証局の基本概念についての解説。</li>
                <li><a href="https://datatracker.ietf.org/doc/html/rfc5280" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 5280: Internet X.509 PKI & CRL Profile</a> - デジタル証明書(X.509)および失効リスト(CRL)の標準仕様。</li>
                <li><a href="https://datatracker.ietf.org/doc/html/rfc6960" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 6960: Online Certificate Status Protocol (OCSP)</a> - オンライン失効検証プロトコル仕様。</li>
                <li><a href="https://datatracker.ietf.org/doc/html/rfc5755" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 5755: Attribute Certificate Profile for Authorization</a> - 属性証明書(AC)による認可制御の標準仕様。</li>
            </ul>
        </div>
    `,

    init: function (app) {
        // Elements
        const pkiSimLog = document.getElementById("pkiSimLog");
        const pkiFlowStatus = document.getElementById("pkiFlowStatus");
        const pkiNodeExplainer = document.getElementById("pkiNodeExplainer");
        const pkiSvg = document.getElementById("pkiSvg");
        
        // Input & Buttons Tab 1
        const pkiCn = document.getElementById("pkiCn");
        const pkiOrg = document.getElementById("pkiOrg");
        const btnPkiCsr = document.getElementById("btnPkiCsr");
        const btnPkiSubmitRa = document.getElementById("btnPkiSubmitRa");
        const btnPkiIssueCa = document.getElementById("btnPkiIssueCa");
        const outPkiSerial = document.getElementById("outPkiSerial");
        const outPkiCertPem = document.getElementById("outPkiCertPem");
        const pkiCertInventory = document.getElementById("pkiCertInventory");

        // Input & Buttons Tab 2
        const pkiSelectCert = document.getElementById("pkiSelectCert");
        const btnPkiRevoke = document.getElementById("btnPkiRevoke");
        const btnPkiCheckCrl = document.getElementById("btnPkiCheckCrl");
        const btnPkiCheckOcsp = document.getElementById("btnPkiCheckOcsp");
        const pkiVerifyReportBox = document.getElementById("pkiVerifyReportBox");
        const pkiVerifyReport = document.getElementById("pkiVerifyReport");

        // Input & Buttons Tab 3
        const pkiAcSelectCert = document.getElementById("pkiAcSelectCert");
        const pkiAcRole = document.getElementById("pkiAcRole");
        const btnPkiIssueAc = document.getElementById("btnPkiIssueAc");
        const btnPkiAccessServer = document.getElementById("btnPkiAccessServer");
        const outPkiAcJson = document.getElementById("outPkiAcJson");
        const pkiAcResultArea = document.getElementById("pkiAcResultArea");

        // State variables for current session
        let caSubject = "";
        let caCertPem = "";
        let aaPublicKeyPem = "";
        
        let currentCsrPem = "";
        let currentUserPrivateKeyPem = "";
        let currentUserPublicKeyPem = "";
        
        let issuedCertsList = []; // Local cache of certificates {serial, cn, org, status, pem}
        let latestIssuedSerial = "";
        let activeAc = null; // Current active attribute certificate

        const nodesInfo = {
            ca: {
                title: "🏛️ CA (認証局: Certificate Authority)",
                desc: "<b>役割:</b> 公開鍵証明書（デジタル証明書）にデジタル署名を施して発行し、管理（無効化など）する第三者機関。<br><b>試験ポイント:</b> CA自身の秘密鍵で証明書に署名を行うことで、その証明書が改ざんされていないこと（完全性）および信頼できるCAから発行されたこと（真正性）を保証します。CA鍵の安全管理はPKI全体の信頼性の根拠になります。"
            },
            ra: {
                title: "🔎 RA (登録局: Registration Authority)",
                desc: "<b>役割:</b> 証明書の発行申請を受け付け、申請者の身元（本人確認）の審査・承認を行う機関。<br><b>試験ポイント:</b> 本人確認手続き（実在証明書類の確認）を担当しますが、<b>証明書への署名処理自体は行いません</b>（署名はCAが行います）。この役割分担が試験でよく問われます。"
            },
            va: {
                title: "🤖 VA (検証局: Validation Authority)",
                desc: "<b>役割:</b> 証明書の有効期限や、失効していないかという「有効性」の検証要求を受け付け、結果を検証者に返す機関。OCSPレスポンダーが代表例。<br><b>試験ポイント:</b> 検証者がローカルにCRLをダウンロードして探す代わりに、VAへ直接オンラインで問い合わせる（OCSPプロトコル）ことで、リアルタイムかつ低トラフィックな有効性検証が可能になります。"
            },
            aa: {
                title: "属性認証局 (AA: Attribute Authority)",
                desc: "<b>役割:</b> 利用者の氏名以外の「職位」「所属部署」「アクセス権限」などの属性を証明する<b>「属性証明書 (AC: Attribute Certificate)」</b>を発行する機関。<br><b>試験ポイント:</b> CAの発行する公開鍵証明書(PKC)が「身元」を証明するのに対し、AAの発行するACは「権限」を証明します。<b>属性証明書 (AC) には公開鍵が含まれません</b>。"
            },
            repo: {
                title: "🛢️ リポジトリ (Repository)",
                desc: "<b>役割:</b> 发行された証明書や、失効した証明書のリストである<b>CRL（証明書失効リスト）</b>などを一般に公開して誰でもダウンロードできるようにしたディレクトリデータベース（LDAPやWebサーバー）。<br><b>試験ポイント:</b> 検証者はリポジトリから最新のCRLを取得し、提示された証明書が失効していないか検証します。"
            },
            user: {
                title: "👤 利用者 (EE: End Entity / 申請者)",
                desc: "<b>役割:</b> 自身の鍵ペア（公開鍵・秘密鍵）を生成し、証明書の発行を申請して利用する個人やサーバーなどの主体。<br><b>試験ポイント:</b> 証明書発行申請時に<b>CSR（証明書署名要求）</b>を自身で作成します。CSRは、自身の公開鍵に身元情報を加え、自身の秘密鍵で署名したデータです。"
            },
            server: {
                title: "💻 Webサーバー (Relying Party / 検証者)",
                desc: "<b>役割:</b> クライアントから提示された証明書を受け取り、その信頼性を検証した上でサービスを提供する主体。<br><b>試験ポイント:</b> 検証ステップは次の通りです：①信頼できるRoot CAの公開鍵で証明書の署名を検証する、②有効期限内かチェックする、③CRLやOCSPを利用して証明書が失効していないか確認する。"
            }
        };

        // Initialize PKI System on Backend
        async function setupPkiSystem() {
            try {
                const res = await app.apiCall("/api/pki/setup", "POST");
                caSubject = res.ca_subject;
                caCertPem = res.ca_cert_pem;
                aaPublicKeyPem = res.aa_public_key_pem;
                logConsole(`[SYSTEM] CA初期化完了: Subject [${caSubject}]`);
            } catch (err) {
                logConsole(`[ERROR] CA初期化エラー: ${err.message}`);
            }
        }

        setupPkiSystem();

        // Helper: Write log inside module
        function logConsole(msg) {
            const time = new Date().toLocaleTimeString();
            pkiSimLog.innerHTML += `<br>[${time}] ${msg}`;
            pkiSimLog.scrollTop = pkiSimLog.scrollHeight;
            app.log('system', msg);
        }

        // Helper: Clear active lines
        function clearActiveLines() {
            document.querySelectorAll(".connection-line").forEach(l => {
                l.classList.remove("pulse", "pulse-reverse", "pulse-red");
                l.style.stroke = "#334155";
            });
        }

        // Helper: Highlight Line
        function highlightLine(lineId, type = "pulse") {
            const line = document.getElementById(lineId);
            if (line) {
                line.classList.add(type);
                if (type.includes("red")) {
                    line.style.stroke = "#f43f5e";
                } else {
                    line.style.stroke = "#38bdf8";
                }
            }
        }

        // Helper: Highlight Node
        function highlightNode(nodeId, isActive = true) {
            document.querySelectorAll(".node-circle").forEach(n => n.classList.remove("active-node"));
            if (isActive) {
                const node = document.getElementById(nodeId);
                if (node) node.classList.add("active-node");
            }
        }

        // Interactive Map Click handlers
        document.querySelectorAll(".pki-node").forEach(nodeEl => {
            nodeEl.addEventListener("click", () => {
                const nodeName = nodeEl.dataset.node;
                const info = nodesInfo[nodeName];
                if (info) {
                    highlightNode(`node-${nodeName}`, true);
                    pkiNodeExplainer.innerHTML = `<h5 style="margin: 0 0 6px 0; color: #38bdf8; font-size:13px;">${info.title}</h5><div>${info.desc}</div>`;
                    pkiFlowStatus.innerText = `表示中: ${nodeName.toUpperCase()}`;
                }
            });
        });

        // Tab Switching Logic
        document.querySelectorAll(".pki-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".pki-tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".pki-tab-content").forEach(c => c.classList.remove("active"));
                
                btn.classList.add("active");
                const tabId = btn.dataset.tab;
                document.getElementById(tabId).classList.add("active");
                
                clearActiveLines();
                highlightNode("", false);
            });
        });

        // ==========================================
        // TAB 1: CERTIFICATE ISSUANCE FLOW
        // ==========================================
        
        // Step 1: Generate CSR
        btnPkiCsr.addEventListener("click", async () => {
            clearActiveLines();
            highlightNode("node-user", true);
            logConsole("【ステップ1】利用者(EE)の鍵ペア生成およびCSRの作成を開始...");
            
            try {
                const res = await app.apiCall("/api/pki/csr", "POST", {
                    common_name: pkiCn.value.trim(),
                    organization: pkiOrg.value.trim(),
                    country: "JP"
                });
                
                currentCsrPem = res.csr_pem;
                currentUserPrivateKeyPem = res.private_key_pem;
                currentUserPublicKeyPem = res.public_key_pem;
                
                logConsole("利用者のRSA鍵ペアをローカルで生成しました。");
                logConsole("身元情報を付加し、秘密鍵で自己署名した「CSR (証明書署名要求)」を作成完了。");
                
                pkiCertInventory.style.display = "block";
                outPkiSerial.innerText = "CSR生成済み (署名未完了)";
                outPkiCertPem.innerText = currentCsrPem;
                
                btnPkiSubmitRa.disabled = false;
                btnPkiIssueCa.disabled = true;
            } catch (err) {
                logConsole(`[ERROR] CSR作成失敗: ${err.message}`);
            }
        });

        // Step 2: Submit to RA
        btnPkiSubmitRa.addEventListener("click", () => {
            clearActiveLines();
            highlightNode("node-ra", true);
            highlightLine("line-user-ra", "pulse");
            logConsole("【ステップ2】登録局(RA)への本人確認申請パケットを送信...");
            
            setTimeout(() => {
                logConsole("RAによって申請者の本人確認書類・組織実在確認が正常に行われました（審査合格）。");
                logConsole("RAはCAへ証明書発行依頼を承認・転送しました。");
                btnPkiIssueCa.disabled = false;
            }, 1000);
        });

        // Step 3: Issue Certificate by CA
        btnPkiIssueCa.addEventListener("click", async () => {
            clearActiveLines();
            highlightNode("node-ca", true);
            highlightLine("line-ra-ca", "pulse");
            logConsole("【ステップ3】認証局(CA)での署名・発行プロセスを実行中...");
            
            try {
                const res = await app.apiCall("/api/pki/issue", "POST", {
                    csr_pem: currentCsrPem,
                    valid_days: 365
                });
                
                latestIssuedSerial = res.serial_number;
                
                // Add to local inventory cache
                const newCert = {
                    serial: res.serial_number,
                    cn: pkiCn.value.trim(),
                    org: pkiOrg.value.trim(),
                    status: "Good",
                    pem: res.cert_pem
                };
                issuedCertsList.push(newCert);
                
                setTimeout(() => {
                    highlightLine("line-ca-repo", "pulse");
                    highlightLine("line-user-ra", "pulse-reverse"); // Send back cert
                    
                    logConsole(`CAはCSRから公開鍵を抽出し、シリアル番号 [${res.serial_number}] を付与。`);
                    logConsole("CAの秘密鍵を用いてX.509デジタル証明書へデジタル署名を施しました。");
                    logConsole("証明書を「リポジトリ」へ登録完了。利用者は証明書をダウンロードしました。");
                    
                    outPkiSerial.innerText = res.serial_number;
                    outPkiCertPem.innerText = res.cert_pem;
                    
                    // Update Dropdowns in other tabs
                    updateCertificateDropdowns();
                    
                    btnPkiSubmitRa.disabled = true;
                    btnPkiIssueCa.disabled = true;
                }, 1000);
                
            } catch (err) {
                logConsole(`[ERROR] 証明書発行失敗: ${err.message}`);
            }
        });

        function updateCertificateDropdowns() {
            const currentVal2 = pkiSelectCert.value;
            const currentVal3 = pkiAcSelectCert.value;

            // Tab 2 Dropdown
            pkiSelectCert.innerHTML = '<option value="">-- 証明書を選択してください --</option>';
            // Tab 3 Dropdown
            pkiAcSelectCert.innerHTML = '<option value="">-- 証明書を選択してください --</option>';
            
            issuedCertsList.forEach(c => {
                const label = `シリアル: ${c.serial.substring(0, 8)}... (CN: ${c.cn}, 組織: ${c.org}) [${c.status === 'Good' ? '🟢有効' : '🔴失効'}]`;
                
                const opt2 = document.createElement("option");
                opt2.value = c.serial;
                opt2.innerText = label;
                pkiSelectCert.appendChild(opt2);
                
                if (c.status === "Good") {
                    const opt3 = document.createElement("option");
                    opt3.value = c.serial;
                    opt3.innerText = label;
                    pkiAcSelectCert.appendChild(opt3);
                }
            });

            if (currentVal2 && Array.from(pkiSelectCert.options).some(o => o.value === currentVal2)) {
                pkiSelectCert.value = currentVal2;
            }
            if (currentVal3 && Array.from(pkiAcSelectCert.options).some(o => o.value === currentVal3)) {
                pkiAcSelectCert.value = currentVal3;
            }
            
            btnPkiRevoke.disabled = (pkiSelectCert.value === "");
            btnPkiCheckCrl.disabled = (pkiSelectCert.value === "");
            btnPkiCheckOcsp.disabled = (pkiSelectCert.value === "");
            btnPkiIssueAc.disabled = (pkiAcSelectCert.value === "");
        }

        // ==========================================
        // TAB 2: REVOCATION & VALIDATION (CRL vs OCSP)
        // ==========================================
        pkiSelectCert.addEventListener("change", () => {
            const hasVal = (pkiSelectCert.value !== "");
            btnPkiRevoke.disabled = !hasVal;
            btnPkiCheckCrl.disabled = !hasVal;
            btnPkiCheckOcsp.disabled = !hasVal;
            
            if (hasVal) {
                const target = issuedCertsList.find(c => c.serial === pkiSelectCert.value);
                if (target && target.status === "Revoked") {
                    btnPkiRevoke.disabled = true; // Already revoked
                }
            }
        });

        // Revoke Cert Action
        btnPkiRevoke.addEventListener("click", async () => {
            const serial = pkiSelectCert.value;
            if (!serial) return;
            
            clearActiveLines();
            highlightNode("node-ca", true);
            highlightLine("line-user-ra", "pulse");
            highlightLine("line-ra-ca", "pulse");
            logConsole(`証明書シリアル [${serial}] の失効申請を送信中...`);
            
            try {
                const res = await app.apiCall("/api/pki/revoke", "POST", {
                    serial_number: serial
                });
                
                // Update local status
                const idx = issuedCertsList.findIndex(c => c.serial === serial);
                if (idx !== -1) {
                    issuedCertsList[idx].status = "Revoked";
                }
                
                logConsole(`CAデータベース上の証明書ステータスを「Revoked（失効）」に書き換えました。`);
                logConsole(`失効日時: ${res.revoked_at}`);
                
                updateCertificateDropdowns();
                pkiSelectCert.value = serial;
                btnPkiRevoke.disabled = true;
            } catch (err) {
                logConsole(`[ERROR] 失効申請失敗: ${err.message}`);
            }
        });

        // CRL Check (Method A)
        btnPkiCheckCrl.addEventListener("click", async () => {
            const serial = pkiSelectCert.value;
            if (!serial) return;
            
            clearActiveLines();
            highlightNode("node-server", true);
            highlightLine("line-user-server", "pulse"); // Client presents cert to server
            logConsole("【方式A: CRL検証】クライアントがWebサーバーに接続要求。証明書を提示しました。");
            
            setTimeout(async () => {
                highlightLine("line-server-repo", "pulse"); // Server downloads CRL
                logConsole("Webサーバーは、証明書失効リスト(CRL)を取得するためリポジトリ(LDAP/Web)にアクセスします。");
                
                try {
                    const crlRes = await app.apiCall("/api/pki/crl", "GET");
                    
                    setTimeout(() => {
                        highlightNode("node-repo", true);
                        logConsole("リポジトリから大容量のCRLデータをダウンロードしました。");
                        logConsole("サーバー側で、CRLのデジタル署名（CA鍵）を検証します。署名妥当。");
                        logConsole("ダウンロードしたCRLの全リストを線形探索し、提示されたシリアル番号があるか検索します。");
                        
                        const target = issuedCertsList.find(c => c.serial === serial);
                        const isRevoked = target && target.status === "Revoked";
                        
                        pkiVerifyReportBox.style.borderColor = isRevoked ? "var(--color-danger)" : "var(--color-success)";
                        
                        if (isRevoked) {
                            pkiVerifyReport.innerHTML = `
                                <span style="color: var(--color-danger); font-weight: bold;">🔴 接続拒否 (CRLにより失効検知)</span><br>
                                証明書はCRLに登録されています（失効済み）。アクセスを遮断しました。<br>
                                <pre style="font-size: 9px; margin-top:6px; background:rgba(0,0,0,0.2); padding:4px;">${crlRes.crl_text}</pre>
                            `;
                            logConsole("警告: 証明書がCRL上で見つかりました。接続を拒否します。");
                        } else {
                            pkiVerifyReport.innerHTML = `
                                <span style="color: var(--color-success); font-weight: bold;">🟢 接続許可 (有効確認完了)</span><br>
                                証明書シリアルはCRL上に存在しません。有効期限も妥当なため、HTTPS通信を確立します。
                            `;
                            logConsole("証明書はCRLにありません。検証パス。");
                        }
                    }, 1000);
                } catch (err) {
                    logConsole(`[ERROR] CRL取得エラー: ${err.message}`);
                }
            }, 1000);
        });

        // OCSP Check (Method B)
        btnPkiCheckOcsp.addEventListener("click", async () => {
            const serial = pkiSelectCert.value;
            if (!serial) return;
            
            clearActiveLines();
            highlightNode("node-server", true);
            highlightLine("line-user-server", "pulse"); // Present cert
            logConsole("【方式B: OCSP検証】クライアントがWebサーバーに接続要求。証明書を提示しました。");
            
            setTimeout(async () => {
                highlightLine("line-server-va", "pulse"); // Send OCSP request to VA
                logConsole(`Webサーバーは、検証局(VA)に対してシリアル番号 [${serial.substring(0,8)}...] の状態確認要求をリアルタイムで送信します。`);
                
                try {
                    const res = await app.apiCall("/api/pki/ocsp", "POST", {
                        serial_number: serial
                    });
                    
                    setTimeout(() => {
                        highlightNode("node-va", true);
                        highlightLine("line-server-va", "pulse-reverse"); // Response from VA
                        logConsole(`VAから署名付きOCSPレスポンス（ステータス: ${res.status}）を受信しました。`);
                        logConsole("サーバー側でOCSPレスポンスに施されたCAのデジタル署名を検証。検証成功。");
                        
                        pkiVerifyReportBox.style.borderColor = (res.status === "Good") ? "var(--color-success)" : "var(--color-danger)";
                        
                        if (res.status === "Good") {
                            pkiVerifyReport.innerHTML = `
                                <span style="color: var(--color-success); font-weight: bold;">🟢 接続許可 (OCSP検証パス)</span><br>
                                VAからの署名付き応答: Status=Good (有効)<br>
                                リアルタイム問い合わせにより有効性が証明されました。
                            `;
                            logConsole("証明書のステータスはGoodです。接続を許可します。");
                        } else {
                            pkiVerifyReport.innerHTML = `
                                <span style="color: var(--color-danger); font-weight: bold;">🔴 接続拒否 (OCSPにより失効検知)</span><br>
                                VAからの署名付き応答: Status=Revoked (失効)<br>
                                失効日時: ${res.response_data.revoked_at}<br>
                                リアルタイムで鍵の無効化が検知されました。
                            `;
                            logConsole("警告: 証明書のステータスがRevokedです。接続を拒否します。");
                        }
                    }, 1000);
                } catch (err) {
                    logConsole(`[ERROR] OCSP問い合わせエラー: ${err.message}`);
                }
            }, 1000);
        });

        // ==========================================
        // TAB 3: ATTRIBUTE CERTIFICATE (AA & AC)
        // ==========================================
        pkiAcSelectCert.addEventListener("change", () => {
            btnPkiIssueAc.disabled = (pkiAcSelectCert.value === "");
        });

        btnPkiIssueAc.addEventListener("click", async () => {
            const serial = pkiAcSelectCert.value;
            if (!serial) return;
            
            const target = issuedCertsList.find(c => c.serial === serial);
            if (!target) return;
            
            clearActiveLines();
            highlightNode("node-aa", true);
            highlightLine("line-user-aa", "pulse");
            logConsole(`【AA申請】利用者 [${target.cn}] の身元証明書(PKC)シリアル [${serial.substring(0,8)}...] を添えて、属性認証局(AA)に属性証明書(AC)の発行を申請中...`);
            
            try {
                const role = pkiAcRole.value;
                const res = await app.apiCall("/api/pki/issue-ac", "POST", {
                    holder_serial: serial,
                    username: target.cn,
                    role: role
                });
                
                activeAc = res;
                
                setTimeout(() => {
                    highlightLine("line-user-aa", "pulse-reverse");
                    logConsole("属性認証局(AA)は、指定されたPKCシリアルに紐付く属性証明書(AC)を作成。");
                    logConsole(`アトリビュート（属性）に [役職: ${role}] を設定し、AAの秘密鍵でデジタル署名を施しました。`);
                    logConsole("利用者は属性証明書(AC)を取得しました。");
                    
                    pkiAcResultArea.style.display = "block";
                    outPkiAcJson.innerText = JSON.stringify(res.ac_json, null, 2);
                    
                    btnPkiAccessServer.disabled = false;
                }, 1000);
                
            } catch (err) {
                logConsole(`[ERROR] AC発行失敗: ${err.message}`);
            }
        });

        btnPkiAccessServer.addEventListener("click", () => {
            if (!activeAc) return;
            
            clearActiveLines();
            highlightNode("node-server", true);
            highlightLine("line-user-server", "pulse");
            logConsole("【特権アクセス検証】利用者がWebサーバーに対して、公開鍵証明書(PKC)と属性証明書(AC)の両方を提示してアクセス要求中...");
            
            setTimeout(() => {
                logConsole("Webサーバーは提示された証明書を検証中:");
                logConsole("1. 身元検証: 公開鍵証明書(PKC)のCA署名を検証 ➔ 本人確認成功。");
                logConsole("2. 権限検証: 属性証明書(AC)のAA署名を検証 ➔ 署名妥当。");
                logConsole(`3. 属性チェック: ACの特権情報「役職: ${activeAc.ac_json.attributes.role}」を確認。`);
                
                const role = activeAc.ac_json.attributes.role;
                
                pkiVerifyReportBox.scrollIntoView({ behavior: 'smooth' });
                
                const tabVerifyBtn = document.querySelector('[data-tab="tab-verify"]');
                if (tabVerifyBtn) tabVerifyBtn.click(); // Switch tab to see report
                
                pkiVerifyReportBox.style.borderColor = "var(--color-success)";
                
                if (role === "Admin") {
                    pkiVerifyReport.innerHTML = `
                        <span style="color: var(--color-success); font-weight: bold;">🟢 特権アクセス承認 (Access Granted)</span><br>
                        身元証明: ${activeAc.ac_json.holder_name} (シリアル: ${activeAc.ac_json.holder_pkc_serial.substring(0,8)}...)<br>
                        権限属性: 役職 = ${role} (管理者特権機能へのフルアクセスを許可しました)<br>
                        特権権限: [read, write, admin]
                    `;
                    logConsole("認可成功: 管理者権限を確認。特権アクセスを許可しました。");
                } else {
                    pkiVerifyReport.innerHTML = `
                        <span style="color: var(--color-primary-hover); font-weight: bold;">精度制限: 一般アクセス承認 (Access Restricted)</span><br>
                        身元証明: ${activeAc.ac_json.holder_name}<br>
                        権限属性: 役職 = ${role} (一般参照のみ許可。管理者機能は非認可です)<br>
                        特権権限: [read]
                    `;
                    logConsole("認可完了: 一般社員権限を確認。特権機能は制限されました。");
                }
            }, 1500);
        });
    }
};
