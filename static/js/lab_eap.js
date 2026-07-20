/**
 * Module 16: IEEE 802.1X & EAP Authentication Simulator
 */
window.SecurityLabModules["eap_auth"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2" style="grid-template-columns: 1.25fr 0.75fr;">
                <!-- Left: Handshake Diagram & Selector -->
                <div class="card">
                    <h3>🛡️ IEEE 802.1X / EAP 認証シミュレーター</h3>
                    <p class="card-subtitle">有線・無線LANのアクセス制御に使われる 802.1X ポート認証と、EAP (Extensible Authentication Protocol) の各認証方式のハンドシェイクを可視化します。</p>
                    
                    <!-- Config Controls -->
                    <div class="lab-grid-2" style="gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                        <div class="form-group">
                            <label for="eapMethodSelect">🔑 EAP 認証方式:</label>
                            <select id="eapMethodSelect" style="width: 100%; padding: 8px; background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm);">
                                <option value="PEAP" selected>PEAP (サーバー証明書 + トンネル内MS-CHAPv2)</option>
                                <option value="TLS">EAP-TLS (相互証明書認証 - クライアント&サーバー)</option>
                                <option value="TTLS">EAP-TTLS (サーバー証明書 + トンネル内ID/PW)</option>
                                <option value="EAP-FAST">EAP-FAST (証明書不要 - PAC認証キー使用)</option>
                                <option value="MD5">EAP-MD5 (パスワードハッシュ - 暗号化なし・MITM脆弱)</option>
                                <option value="LEAP">LEAP (Cisco独自MS-CHAPv1 - 辞書攻撃に脆弱)</option>
                            </select>
                        </div>
                        <div class="form-group" style="justify-content: flex-end;">
                            <div class="inline-group" style="gap: 12px; margin-top: auto;">
                                <div>
                                    <input type="checkbox" id="eapClientCert" checked>
                                    <label for="eapClientCert" style="cursor: pointer; font-size: 12px;">📄 クライアント証明書所持</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="eapPacKey" checked>
                                    <label for="eapPacKey" style="cursor: pointer; font-size: 12px;">🔑 PACキー所持 (FAST用)</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SVG Sequence Diagram -->
                    <div class="oauth-flow-diagram" style="background: #121214; border-radius: 8px; padding: 15px;">
                        <svg class="oauth-svg" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg">
                            <!-- Lifelines -->
                            <line x1="100" y1="50" x2="100" y2="350" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="300" y1="50" x2="300" y2="350" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="500" y1="50" x2="500" y2="350" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />

                            <!-- Actors -->
                            <rect id="eap-actor-supplicant" class="svg-actor" x="40" y="15" width="120" height="35" rx="5" />
                            <text class="svg-text" x="100" y="36">Supplicant (PC)</text>

                            <rect id="eap-actor-authenticator" class="svg-actor" x="240" y="15" width="120" height="35" rx="5" />
                            <text class="svg-text" x="300" y="36">Authenticator (AP/SW)</text>

                            <rect id="eap-actor-radius" class="svg-actor" x="440" y="15" width="120" height="35" rx="5" />
                            <text class="svg-text" x="500" y="36">RADIUS Server</text>

                            <!-- Step 1: Identity & EAPOL Init -->
                            <g id="eap-arrow-1" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 100,70 L 295,70" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="200" y="65">1a. EAPOL-Start (有線/無線接続)</text>
                                
                                <path class="svg-arrow" d="M 300,92 L 105,92" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="200" y="87">1b. EAP-Request / Identity</text>

                                <path class="svg-arrow" d="M 100,114 L 295,114" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="200" y="109">1c. EAP-Response / Identity (ID送信)</text>

                                <path class="svg-arrow" d="M 300,136 L 495,136" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="400" y="131">1d. RADIUS Access-Request (ID転送)</text>
                            </g>

                            <!-- Step 2: Method Start -->
                            <g id="eap-arrow-2" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 500,165 L 305,165" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                <text class="svg-text svg-text-sub" x="400" y="160">2a. RADIUS Access-Challenge</text>

                                <path class="svg-arrow" d="M 300,187 L 105,187" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="200" y="182">2b. EAP-Request (Method-Start)</text>
                            </g>

                            <!-- Step 3: TLS Tunnel or challenge-response exchange -->
                            <g id="eap-arrow-3" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 100,215 L 295,215" marker-end="url(#eap-arrowhead)" />
                                <path class="svg-arrow" d="M 300,225 L 495,225" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="300" y="210" id="eap-label-3a">3a. 資格情報送信 / TLSネゴシエーション</text>

                                <path class="svg-arrow" d="M 500,245 L 305,245" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                <path class="svg-arrow" d="M 300,255 L 105,255" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                <text class="svg-text svg-text-sub" x="300" y="240" id="eap-label-3b">3b. 認証サーバー応答 / TLS証明書検証</text>
                            </g>

                            <!-- Step 4: Tunnel inner credential verify -->
                            <g id="eap-arrow-4" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 100,285 L 295,285" marker-end="url(#eap-arrowhead)" />
                                <path class="svg-arrow" d="M 300,295 L 495,295" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="300" y="280" id="eap-label-4">4. トンネル内認証 (ID/PWまたは検証データ)</text>
                            </g>

                            <!-- Step 5: EAP Success & Port Open -->
                            <g id="eap-arrow-5" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 500,320 L 305,320" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                <text class="svg-text svg-text-sub" x="400" y="315">5a. RADIUS Access-Accept (鍵配布)</text>

                                <path class="svg-arrow" d="M 300,340 L 105,340" marker-end="url(#eap-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="200" y="335">5b. EAP-Success (ポート制御解放)</text>
                            </g>

                            <!-- Definitions for marker arrowheads -->
                            <defs>
                                <marker id="eap-arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                                    <polygon points="0 0, 5 2.5, 0 5" fill="currentColor" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    <!-- Flow Controls -->
                    <div style="display: flex; gap: 14px; margin-top: 20px;">
                        <button class="btn btn-secondary" id="btnEapReset">リセット</button>
                        <button class="btn btn-primary" id="btnEapNext">次のステップへ進む</button>
                        <button class="btn btn-secondary" id="btnEapAuto" style="color: var(--color-success); border-color: rgba(16, 185, 129, 0.4);">オートデモ実行</button>
                    </div>
                </div>

                <!-- Right: Explanations & Logs -->
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="margin: 0;">📁 RADIUS / EAPOL ログ詳細</h3>
                            <!-- Port Status Badge -->
                            <div id="eapPortStatus" style="font-size: 11px; padding: 4px 10px; border-radius: 4px; font-weight: bold; background: rgba(239, 68, 68, 0.15); border: 1px solid var(--color-danger); color: var(--color-danger);">
                                🔒 ポート閉鎖 (Unauthorized)
                            </div>
                        </div>

                        <div class="form-group">
                            <label>現在ステップ:</label>
                            <div style="font-size: 13px; font-weight: bold; color: var(--color-primary-hover);" id="eapStepTitle">
                                開始ボタンを押してください
                            </div>
                        </div>

                        <div class="form-group">
                            <label>パケット通信ログ (RADIUS / Supplicant):</label>
                            <div class="response-box" style="background-color: #0c0a09; height: 180px; overflow-y: auto;">
                                <code id="eapLogConsole" style="color: #34d399; font-size: 11px;">「次のステップへ進む」を押すと、802.1X認証シーケンスが開始され、パケット詳細が出力されます。</code>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>プロトコル解説 (セキスペ出題ポイント):</label>
                            <div style="font-size: 12px; line-height: 1.5; color: var(--text-secondary);" id="eapStepExplanation">
                                IEEE 802.1Xポート認証では、接続時点ではEAP以外の通信がブロックされます。サプリカントが認証サーバー（RADIUS）に正当性を証明（EAPOL/EAP経由）することで、スイッチやAPの物理・論理ポートが解放されます。
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- EAP Methods Comparison Card -->
            <div class="card" style="margin-top: 24px;">
                <h3>📊 セキスペ試験対策：各EAP認証方式の徹底比較</h3>
                <p class="card-subtitle">試験では、EAP各種認証方式におけるデジタル証明書の必要有無、暗号化通信路(TLS)の要否、およびそれぞれの安全性の特徴が頻出します。</p>
                <div style="overflow-x: auto; margin-top: 14px;">
                    <table class="sa-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02);">
                                <th>EAP認証方式</th>
                                <th>クライアント証明書</th>
                                <th>サーバー証明書</th>
                                <th>TLSトンネルの構築</th>
                                <th>安全性とセキュリティリスク</th>
                                <th>代表的な特徴・用途</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr id="row-PEAP">
                                <td><b>PEAP</b></td>
                                <td style="color: var(--text-muted);">不要 (ID/PW認証)</td>
                                <td style="color: var(--color-success); font-weight: bold;">必要 (サーバー確認)</td>
                                <td style="color: var(--color-success); font-weight: bold;">あり (外側TLS構築)</td>
                                <td>TLSトンネル内でユーザー認証を行うため盗聴に強い。ユーザー管理が容易。</td>
                                <td>企業の無線LAN (WPA2-Enterprise) で最も一般的。MS-CHAPv2を利用。</td>
                            </tr>
                            <tr id="row-TLS">
                                <td><b>EAP-TLS</b></td>
                                <td style="color: var(--color-success); font-weight: bold;">必要 (個別配布が必要)</td>
                                <td style="color: var(--color-success); font-weight: bold;">必要 (サーバー確認)</td>
                                <td style="color: var(--color-success); font-weight: bold;">あり (相互TLS接続)</td>
                                <td><b>最高強度</b>。パスワードを使わないため、フィッシングや辞書攻撃が完全に無効。</td>
                                <td>極めて強固なセキュリティが要求される社内LAN・スマートデバイス接続。</td>
                            </tr>
                            <tr id="row-TTLS">
                                <td><b>EAP-TTLS</b></td>
                                <td style="color: var(--text-muted);">不要 (オプション)</td>
                                <td style="color: var(--color-success); font-weight: bold;">必要 (サーバー確認)</td>
                                <td style="color: var(--color-success); font-weight: bold;">あり (外側TLS構築)</td>
                                <td>PEAPと類似。トンネル内で多様なレガシープロトコル（PAP/CHAPなど）を内包可能。</td>
                                <td>PEAPと並ぶWi-Fi認証規格。Windows外のマルチプラットフォームで多用。</td>
                            </tr>
                            <tr id="row-EAP-FAST">
                                <td><b>EAP-FAST</b></td>
                                <td style="color: var(--text-muted);">不要</td>
                                <td style="color: var(--text-muted);">不要 (オプション)</td>
                                <td style="color: var(--color-success); font-weight: bold;">あり (PACを用いて構築)</td>
                                <td>証明書管理の手間を排除しつつ、事前共有キー(PAC)によりTLSトンネルを生成し保護。</td>
                                <td>Ciscoが提唱。LEAPの脆弱性を克服し、証明書を配りたくない環境向け。</td>
                            </tr>
                            <tr id="row-MD5">
                                <td><b>EAP-MD5</b></td>
                                <td style="color: var(--text-muted);">不要</td>
                                <td style="color: var(--text-muted);">不要</td>
                                <td style="color: var(--text-muted);">なし (平文チャネル)</td>
                                <td style="color: var(--color-danger); font-weight: bold;">脆弱 (中間者攻撃、辞書攻撃)</td>
                                <td>レガシー規格。暗号化トンネルがなくサーバー認証も不可能なため、現在Wi-Fiでは使用不可。</td>
                            </tr>
                            <tr id="row-LEAP">
                                <td><b>LEAP</b></td>
                                <td style="color: var(--text-muted);">不要</td>
                                <td style="color: var(--text-muted);">不要</td>
                                <td style="color: var(--text-muted);">なし (MS-CHAPv1利用)</td>
                                <td style="color: var(--color-danger); font-weight: bold;">脆弱 (ASLEAPツール等でハッシュ解読可能)</td>
                                <td>Ciscoのレガシー無線LAN用規格。辞書攻撃の脆弱性から、現在はEAP-FASTへ移行。</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Reference Specs Cards -->
            <div class="card" style="margin-top: 24px;">
                <h3>📚 参照元・公式仕様リファレンス</h3>
                <p class="card-subtitle">本モジュールの解説およびシミュレーションは、以下の信頼できる仕様書・情報源を参考に構築されています。</p>
                <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.6; font-size: 13px;">
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc3748" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 3748: Extensible Authentication Protocol (EAP)</a> - EAPフレームワークの基本構造とパケット仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc5216" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 5216: The EAP-TLS Authentication Protocol</a> - 証明書を用いる最も安全なEAP-TLS認証方式。</li>
                    <li><a href="https://www.ipa.go.jp/security/technicalwatch/20060927.html" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">IPA: 無線LANのセキュリティとEAP認証</a> - 企業向けアクセス制御（802.1X/EAP）の安全性評価ガイド。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc4851" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 4851: The EAP-FAST Authentication Protocol</a> - PAC鍵に基づくCisco開発の高速・安全なEAP-FAST仕様。</li>
                </ul>
            </div>
        </div>
    `,

    init: function (app) {
        const eapMethodSelect = document.getElementById("eapMethodSelect");
        const eapClientCert = document.getElementById("eapClientCert");
        const eapPacKey = document.getElementById("eapPacKey");
        
        const btnEapReset = document.getElementById("btnEapReset");
        const btnEapNext = document.getElementById("btnEapNext");
        const btnEapAuto = document.getElementById("btnEapAuto");
        
        const eapPortStatus = document.getElementById("eapPortStatus");
        const eapStepTitle = document.getElementById("eapStepTitle");
        const eapLogConsole = document.getElementById("eapLogConsole");
        const eapStepExplanation = document.getElementById("eapStepExplanation");
        
        const eapLabel3a = document.getElementById("eap-label-3a");
        const eapLabel3b = document.getElementById("eap-label-3b");
        const eapLabel4 = document.getElementById("eap-label-4");

        let currentStep = 0;
        let isAutoRunning = false;
        let autoTimer = null;

        // Sequence steps setup
        const steps = [
            {
                title: "ステップ 1: サプリカント接続 & ポート初期化 (EAPOL-Start / Identity)",
                explain: "PCやモバイル機器が有線LANポートや無線アクセスポイントに接続し、EAPOL-Start信号を送信します。オーセンティケータはPCに向けてEAP-Request/Identityを返して身元を要求し、PCはユーザー名（Identity）を送信します。オーセンティケータはこれをRADIUSパケット（RADIUS Access-Request）にカプセル化して認証サーバーに転送します。",
                getLog: () => {
                    const method = eapMethodSelect.value;
                    return `[L2 Supplicant -> Authenticator] EAPOL-Start\n` +
                           `[L2 Authenticator -> Supplicant] EAP-Request (Type: Identity)\n` +
                           `[L2 Supplicant -> Authenticator] EAP-Response (Type: Identity) User: "lab_user@company.local"\n` +
                           `------------------------------------------------------------\n` +
                           `[L3 Authenticator -> RADIUS Server] RADIUS Access-Request (UDP Port 1812)\n` +
                           `  - User-Name: "lab_user@company.local"\n` +
                           `  - NAS-IP-Address: 192.168.10.1\n` +
                           `  - NAS-Port-Type: Wireless-802.11 (WPA2-Enterprise)\n` +
                           `  - EAP-Message: [EAP-Response/Identity]`;
                },
                actors: ["eap-actor-supplicant", "eap-actor-authenticator"],
                arrows: ["eap-arrow-1"]
            },
            {
                title: "ステップ 2: EAP認証方式の選択・ネゴシエーション開始",
                explain: "RADIUSサーバーは、要求されたユーザー名に対して適切なEAP認証方式を決定します。今回はドロップダウンで選択されたEAP方式（EAP-Request/Method-Start）をRADIUS Access-Challengeメッセージに乗せてオーセンティケータへ戻し、オーセンティケータがEAPパケットを抽出してサプリカントへ転送します。",
                getLog: () => {
                    const method = eapMethodSelect.value;
                    return `[L3 RADIUS Server -> Authenticator] RADIUS Access-Challenge\n` +
                           `  - State: 0x9a8f2c31\n` +
                           `  - EAP-Message: [EAP-Request (Type: EAP-${method}-Start)]\n` +
                           `------------------------------------------------------------\n` +
                           `[L2 Authenticator -> Supplicant] EAP-Request (Type: EAP-${method}-Start)`;
                },
                actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                arrows: ["eap-arrow-2"]
            },
            {
                title: "ステップ 3: 暗号化トンネルの交渉 / 認証証明書交換のフェーズ",
                explain: "サプリカントとRADIUSサーバー間で認証フェーズに入ります。TLSベース（PEAP, TLS, TTLS）では、この段階で外側の暗号化トンネルを構築するためのTLSハンドシェイクが実行されます。EAP-FASTではPACキーを使用した暗号路を組み立て、MD5やLEAPではハッシュ値を算出します。",
                getLog: () => {
                    const method = eapMethodSelect.value;
                    if (method === "TLS") {
                        const hasClientCert = eapClientCert.checked;
                        return `[EAP-TLS Mutual Handshake]\n` +
                               `1. [Supplicant -> RADIUS] EAP-Response/TLS (ClientHello)\n` +
                               `2. [RADIUS -> Supplicant] EAP-Request/TLS (ServerHello, Certificate, CertificateRequest)\n` +
                               `   --> サプリカントはRADIUSサーバー証明書をCAルートで検証成功！\n` +
                               `3. [Supplicant -> RADIUS] EAP-Response/TLS (Certificate, ClientKeyExchange, CertificateVerify)\n` +
                               (hasClientCert 
                                 ? `   --> サプリカントはクライアント証明書を正しく提示しました。` 
                                 : `   ⚠️ 【エラー】サプリカント側でクライアント証明書が選択されていないか、未所持です！`);
                    } else if (method === "PEAP" || method === "TTLS") {
                        return `[EAP-${method} Outer Tunnel Handshake]\n` +
                               `1. [Supplicant -> RADIUS] EAP-Response/TLS (ClientHello)\n` +
                               `2. [RADIUS -> Supplicant] EAP-Request/TLS (ServerHello, Certificate, ServerHelloDone)\n` +
                               `   --> サプリカントはRADIUSサーバー証明書の信頼性を検証（必須）。\n` +
                               `3. [Supplicant -> RADIUS] EAP-Response/TLS (ClientKeyExchange, ChangeCipherSpec, Finished)\n` +
                               `   --> サーバー証明書による片方向認証により、外側の安全な「TLS暗号化トンネル」が完成！`;
                    } else if (method === "EAP-FAST") {
                        const hasPac = eapPacKey.checked;
                        return `[EAP-FAST Handshake]\n` +
                               `1. [Supplicant -> RADIUS] EAP-Response/FAST (ClientHello, PAC-Opaque)\n` +
                               (hasPac 
                                 ? `   --> サプリカントが所持するPACキー (Protected Access Credential) を提示。\n` +
                                   `2. [RADIUS -> Supplicant] EAP-Request/FAST (ServerHello, Decrypted PAC Validation)\n` +
                                   `   --> 証明書を使わずに、PACに基づく安全なTLSトンネルが確立されました。`
                                 : `   ⚠️ 【エラー】Supplicantが認証に必要なPACキーを持っていません！新規プロビジョニングが必要です。`);
                    } else {
                        // MD5 or LEAP
                        return `[EAP-${method} Authentication Challenge]\n` +
                               `1. [RADIUS -> Supplicant] EAP-Request / Challenge (ランダム値送信)\n` +
                               `   --> ハッシュ計算用の乱数チャレンジが平文チャネルで送られました（暗号化トンネルなし）。`;
                    }
                },
                actors: ["eap-actor-supplicant", "eap-actor-radius"],
                arrows: ["eap-arrow-3"]
            },
            {
                title: "ステップ 4: トンネル内ユーザー認証 / チャレンジ応答検証",
                explain: "確立された暗号化トンネル（PEAP, TTLS, FASTの場合）の中で、サプリカントはユーザーID/パスワードなどの内部クレデンシャルを安全に送信し、RADIUSサーバーが認証を行います。EAP-TLSでは証明書のデジタル署名自体で認証されているため、このステップは追加の鍵整合性確認（Finished）のみです。MD5/LEAPではトンネルなしでハッシュの比較を行います。",
                getLog: () => {
                    const method = eapMethodSelect.value;
                    if (method === "TLS") {
                        return `[EAP-TLS Handshake Finalize]\n` +
                               `- [Supplicant -> RADIUS] TLS Finished (TLS Tunnel established successfully)\n` +
                               `- RADIUSはクライアント証明書に含まれる公開鍵でデジタル署名を検証。認証完了。`;
                    } else if (method === "PEAP") {
                        return `[PEAP Encrypted Tunnel Inner Auth]\n` +
                               `- トンネル内部で EAP-MS-CHAPv2 をネゴシエート。\n` +
                               `- [Supplicant -> RADIUS] Inner EAP-Response (MS-CHAPv2 Challenge-Response)\n` +
                               `  - パスワードはTLSトンネルで強力に暗号化されて送信されており、外部から盗聴不可能です。`;
                    } else if (method === "TTLS") {
                        return `[EAP-TTLS Encrypted Tunnel Inner Auth]\n` +
                               `- トンネル内で PAP/CHAP または MS-CHAPv2 認証を送信。\n` +
                               `- [Supplicant -> RADIUS] Inner Attribute-Value Pairs (User: lab_user, Pass: *****)\n` +
                               `  - 平文のレガシー認証形式であっても、外側のTLSトンネルで完全に保護されます。`;
                    } else if (method === "EAP-FAST") {
                        return `[EAP-FAST Encrypted Tunnel Inner Auth]\n` +
                               `- トンネル内で MS-CHAPv2 ユーザー認証を処理。\n` +
                               `- [Supplicant -> RADIUS] Inner EAP-Response (MS-CHAPv2 Challenge-Response)\n` +
                               `- 認証合格。`;
                    } else if (method === "MD5") {
                        return `[EAP-MD5 Challenge Succeeded / Failed]\n` +
                               `- [Supplicant -> RADIUS] EAP-Response / MD5 (Response Hash: e82f3a9b1c7...)\n` +
                               `  ⚠️ 【重要セキュリティ問題】暗号トンネルがないため、攻撃者がこのハッシュと乱数をキャプチャすると、オフライン辞書攻撃によってパスワードを解読される極めて高い危険性があります。`;
                    } else {
                        // LEAP
                        return `[LEAP Mutual MS-CHAPv1 Challenge]\n` +
                               `- [Supplicant -> RADIUS] LEAP MS-CHAPv1 Response (Hash: 9b2a7d1e8c...)\n` +
                               `- [RADIUS -> Supplicant] LEAP MS-CHAPv1 Challenge (サーバーの正当性を証明)\n` +
                               `  ⚠️ 【脆弱性情報】LEAPはCiscoのレガシー規格であり、オフラインでのASLEAP等の辞書攻撃ツールによって容易にパスワードを特定される脆弱性が実証されています。`;
                    }
                },
                actors: ["eap-actor-supplicant", "eap-actor-radius"],
                arrows: ["eap-arrow-4"]
            },
            {
                title: "ステップ 5: 認証成功・暗号鍵の配布とポート制御の解放 (Access-Accept)",
                explain: "RADIUSサーバーでの検証が完了すると、RADIUS Access-Acceptがオーセンティケータに届きます。この中に、無線通信を暗号化するための共有鍵の元（MSK: Master Session Key）が含まれています。オーセンティケータはサプリカントにEAP-Successを通知し、ポート状態をAuthorized（アクセス可）に変更して接続が完了します。",
                getLog: () => {
                    const method = eapMethodSelect.value;
                    const isTls = (method === "TLS" || method === "PEAP" || method === "TTLS" || method === "EAP-FAST");
                    const keyLog = isTls 
                      ? `  - MSK (Master Session Key) derived inside TLS context.\n` +
                        `  - Authenticator parses MSK and generates PMK/PTK (WPA2 4-Way Handshake keys).`
                      : `  - (Note: EAP-MD5 does not support dynamic key generation. Encryption key is static or none.)`;
                      
                    return `[L3 RADIUS Server -> Authenticator] RADIUS Access-Accept (UDP 1812)\n` +
                           `  - EAP-Message: [EAP-Success]\n` +
                           keyLog + `\n` +
                           `------------------------------------------------------------\n` +
                           `[L2 Authenticator -> Supplicant] EAP-Success\n` +
                           `[SYSTEM] Authenticator transitions logical port to [AUTHORIZED]!`;
                },
                actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                arrows: ["eap-arrow-5"]
            }
        ];

        // Apply visual active status
        function updateUI() {
            // Remove active classes from all actors and paths
            document.querySelectorAll(".svg-actor").forEach(a => a.classList.remove("svg-actor-active"));
            document.querySelectorAll(".flow-arrow-group path").forEach(p => p.classList.remove("svg-arrow-active"));
            
            const method = eapMethodSelect.value;
            
            // Adjust step labels based on the selected EAP method
            if (method === "MD5" || method === "LEAP") {
                eapLabel3a.textContent = "3a. チャレンジ乱数送信";
                eapLabel3b.textContent = "3b. レスポンス（ハッシュ）返却";
                eapLabel4.textContent = "4. チャレンジ応答のRADIUSサーバー内検証";
            } else if (method === "EAP-FAST") {
                eapLabel3a.textContent = "3a. PACキー提示 (ClientHello)";
                eapLabel3b.textContent = "3b. PAC検証・TLS暗号路確立";
                eapLabel4.textContent = "4. 暗号トンネル内でのユーザー認証 (MS-CHAPv2)";
            } else if (method === "TLS") {
                eapLabel3a.textContent = "3a. サーバー&クライアント証明書提示";
                eapLabel3b.textContent = "3b. 相互証明書検証 (CA署名検証)";
                eapLabel4.textContent = "4. TLS Finished検証 & 鍵合意";
            } else {
                // PEAP, TTLS
                eapLabel3a.textContent = "3a. サーバー証明書提示 (ClientHello/ServerHello)";
                eapLabel3b.textContent = "3b. サーバー署名検証 & 外側TLSトンネル確立";
                eapLabel4.textContent = `4. 暗号トンネル内でのユーザー認証 (${method === "PEAP" ? "MS-CHAPv2" : "ID/PW"})`;
            }

            // Method Matrix Highlight
            document.querySelectorAll(".sa-table tbody tr").forEach(tr => {
                tr.style.backgroundColor = "transparent";
                tr.style.border = "none";
            });
            const activeRow = document.getElementById(`row-${method}`);
            if (activeRow) {
                activeRow.style.backgroundColor = "rgba(99, 102, 241, 0.15)";
                activeRow.style.borderLeft = "3px solid var(--color-primary)";
            }

            if (currentStep === 0) {
                eapStepTitle.innerText = "802.1X認証開始待ち";
                eapLogConsole.innerText = "「次のステップへ進む」を押して、シミュレーションを開始してください。";
                eapStepExplanation.innerText = "有線/無線LANセキュリティで重要な802.1X認証をテストできます。Supplicant, Authenticator, RADIUSサーバーの連携を確認しましょう。";
                btnEapNext.innerText = "シミュレーション開始";
                eapPortStatus.innerText = "🔒 ポート閉鎖 (Unauthorized)";
                eapPortStatus.style.background = "rgba(239, 68, 68, 0.15)";
                eapPortStatus.style.borderColor = "var(--color-danger)";
                eapPortStatus.style.color = "var(--color-danger)";
                return;
            }

            btnEapNext.innerText = currentStep === steps.length ? "完了 (リセット)" : "次のステップへ進む";
            
            const step = steps[currentStep - 1];
            eapStepTitle.innerText = `${currentStep}/${steps.length} - ${step.title}`;
            eapStepExplanation.innerText = step.explain;
            
            // Generate simulated logs
            let logText = step.getLog();
            eapLogConsole.innerText = logText;

            // Highlight actors
            step.actors.forEach(actorId => {
                const el = document.getElementById(actorId);
                if (el) el.classList.add("svg-actor-active");
            });

            // Highlight arrows
            step.arrows.forEach(arrowId => {
                const group = document.getElementById(arrowId);
                if (group) {
                    group.querySelectorAll("path").forEach(p => p.classList.add("svg-arrow-active"));
                }
            });

            // Determine errors based on method preconditions
            let hasError = false;
            let errorMsg = "";
            if (currentStep === 3) {
                if (method === "TLS" && !eapClientCert.checked) {
                    hasError = true;
                    errorMsg = "\n\n❌ 【認証エラー】EAP-TLSではSupplicant(PC)側のクライアント証明書が必須ですが、未所持のためハンドシェイクが失敗しました。";
                } else if (method === "EAP-FAST" && !eapPacKey.checked) {
                    hasError = true;
                    errorMsg = "\n\n❌ 【認証エラー】EAP-FASTのトンネル確立に必要なPACキーがSupplicantにないため、認証が失敗しました。";
                }
            }

            if (hasError) {
                eapLogConsole.innerText += errorMsg;
                eapStepTitle.innerText = `⚠️ エラー発生 - ${step.title}`;
                eapStepExplanation.innerText = "前提条件（クライアント証明書の所持、またはPACキーの所持）が満たされていないため、認証プロセスが途中で中断されました。チェックボックスをONにしてリセットし、やり直してください。";
                app.log("error", `[EAP認証エラー] EAP-${method} の前提要件が不足しています。`);
                
                // Block progress
                btnEapNext.disabled = true;
                isAutoRunning = false;
                btnEapAuto.innerText = "オートデモ実行";
                return;
            }

            // Port status authorized at the last step
            if (currentStep === steps.length) {
                eapPortStatus.innerText = "🔓 ポート解放 (Authorized)";
                eapPortStatus.style.background = "rgba(16, 185, 129, 0.15)";
                eapPortStatus.style.borderColor = "var(--color-success)";
                eapPortStatus.style.color = "var(--color-success)";
                app.log("success", `[EAP認証成功] EAP-${method} により logical port がAUTHORIZEDに変更されました。`);
            }
        }

        function resetFlow() {
            currentStep = 0;
            btnEapNext.disabled = false;
            if (autoTimer) {
                clearTimeout(autoTimer);
                autoTimer = null;
            }
            isAutoRunning = false;
            btnEapAuto.innerText = "オートデモ実行";
            updateUI();
        }

        // 1. Next step handler
        btnEapNext.addEventListener("click", () => {
            if (currentStep >= steps.length) {
                resetFlow();
            } else {
                currentStep++;
                updateUI();
            }
        });

        // 2. Reset handler
        btnEapReset.addEventListener("click", () => {
            resetFlow();
            app.log("system", "EAPシミュレーターを初期化しました。");
        });

        // 3. Auto Demo handler
        btnEapAuto.addEventListener("click", () => {
            if (isAutoRunning) {
                isAutoRunning = false;
                btnEapAuto.innerText = "オートデモ実行";
                if (autoTimer) clearTimeout(autoTimer);
                return;
            }

            isAutoRunning = true;
            btnEapAuto.innerText = "停止";

            const runAutoStep = () => {
                if (!isAutoRunning) return;
                if (currentStep >= steps.length) {
                    resetFlow();
                    return;
                }
                currentStep++;
                updateUI();

                // If no error occurred (button is still enabled) and we aren't done, queue next
                if (!btnEapNext.disabled && currentStep < steps.length) {
                    autoTimer = setTimeout(runAutoStep, 2500);
                } else {
                    isAutoRunning = false;
                    btnEapAuto.innerText = "オートデモ実行";
                }
            };

            runAutoStep();
        });

        // Dropdown method change handler
        eapMethodSelect.addEventListener("change", () => {
            resetFlow();
            app.log("system", `EAP認証方式を EAP-${eapMethodSelect.value} に変更しました。`);
        });

        eapClientCert.addEventListener("change", () => {
            resetFlow();
        });

        eapPacKey.addEventListener("change", () => {
            resetFlow();
        });

        // Initial render
        resetFlow();
    }
};
