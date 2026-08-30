/**
 * Module 16: IEEE 802.1X & RADIUS Authentication Simulator
 * 令和4年春期 午前Ⅱ 問17 を一般化したアーキテクチャ・ロール割り当て＆過去問演習・EAPハンドシェイクモジュール
 */
window.SecurityLabModules["eap_auth"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container">
                <button class="btn-tab active" id="btnTabEapArch">① アーキテクチャ ＆ 役割配置学習</button>
                <button class="btn-tab" id="btnTabEapFlow">② 802.1X / EAP 認証フロー ＆ パケット可視化</button>
            </div>

            <!-- TAB 1: Architecture & Role Assignment -->
            <div id="panelEapArch" class="tab-panel active">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>🏆 IEEE 802.1X ＆ RADIUS アーキテクチャ構成学習</h3>
                    <p class="card-subtitle">
                        情報処理安全確保支援士（セキスペ）試験で頻出する「IEEE 802.1X と RADIUS によるネットワーク認証」の基本構成です。<br>
                        端末（PC）、アクセスポイント（AP/スイッチ）、認証サーバの3つの登場人物に対し、それぞれが担う <strong>「802.1Xでの役割」</strong> と <strong>「RADIUSでの役割」</strong> を正しく割り当てて確認してみましょう。
                    </p>

                    <!-- Interactive Select Assignment Section -->
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-top: 16px;">
                        <h4 class="text-md text-primary-color" style="margin-top: 0;">🧩 機器別 役割割り当てチャレンジ</h4>
                        <p class="text-sm text-muted" style="margin-bottom: 16px;">
                            各機器のドロップダウンメニューから、正しい「802.1Xの役割」と「RADIUSでの役割」を選択し、【構成を検証する】ボタンを押してください。
                        </p>

                        <!-- Topology Visual Card Grid -->
                        <div class="lab-grid-3" style="gap: 16px; align-items: stretch;">
                            
                            <!-- Box 1: Client PC -->
                            <div style="background: var(--bg-panel); border: 2px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div class="node-icon-lg" style="margin-bottom: 6px;">💻</div>
                                    <div class="text-md" style="font-weight: bold; color: var(--text-primary);">① クライアントPC</div>
                                    <div class="text-xs text-muted" style="margin-top: 4px;">(有線/無線LAN接続を要求する端末)</div>
                                </div>
                                
                                <div style="margin-top: 16px; text-align: left; background: var(--bg-app); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                                    <div class="form-group" style="margin-bottom: 10px;">
                                        <label class="text-xs text-muted">IEEE 802.1Xでの役割:</label>
                                        <select id="rolePcDot1x" class="text-sm" style="width: 100%; padding: 6px; border-radius: 4px;">
                                            <option value="">-- 選択してください --</option>
                                            <option value="Supplicant">サプリカント (Supplicant)</option>
                                            <option value="Authenticator">オーセンティケータ (Authenticator)</option>
                                            <option value="Server">認証サーバ (Authentication Server)</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label class="text-xs text-muted">RADIUSでの役割:</label>
                                        <select id="rolePcRadius" class="text-sm" style="width: 100%; padding: 6px; border-radius: 4px;">
                                            <option value="">-- 選択してください --</option>
                                            <option value="None">なし (RADIUSプロトコルは直接扱わない)</option>
                                            <option value="Client">RADIUSクライアント</option>
                                            <option value="Server">RADIUSサーバ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Box 2: Access Point / Switch -->
                            <div style="background: var(--bg-panel); border: 2px solid var(--color-primary); border-radius: 8px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);">
                                <div>
                                    <div class="node-icon-lg" style="margin-bottom: 6px;">📡</div>
                                    <div class="text-md text-primary-color" style="font-weight: bold;">② 無線AP / L2スイッチ</div>
                                    <div class="text-xs text-muted" style="margin-top: 4px;">★試験最頻出ポイント！ (中継・制御機器)</div>
                                </div>
                                
                                <div style="margin-top: 16px; text-align: left; background: var(--bg-app); padding: 12px; border-radius: 6px; border: 1px solid var(--color-primary);">
                                    <div class="form-group" style="margin-bottom: 10px;">
                                        <label class="text-xs text-primary-color">IEEE 802.1Xでの役割:</label>
                                        <select id="roleApDot1x" class="text-sm" style="width: 100%; padding: 6px; border-radius: 4px;">
                                            <option value="">-- 選択してください --</option>
                                            <option value="Supplicant">サプリカント (Supplicant)</option>
                                            <option value="Authenticator">オーセンティケータ (Authenticator)</option>
                                            <option value="Server">認証サーバ (Authentication Server)</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label class="text-xs text-primary-color">RADIUSでの役割:</label>
                                        <select id="roleApRadius" class="text-sm" style="width: 100%; padding: 6px; border-radius: 4px;">
                                            <option value="">-- 選択してください --</option>
                                            <option value="None">なし (RADIUSプロトコルは直接扱わない)</option>
                                            <option value="Client">RADIUSクライアント</option>
                                            <option value="Server">RADIUSサーバ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Box 3: Authentication Server -->
                            <div style="background: var(--bg-panel); border: 2px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div class="node-icon-lg" style="margin-bottom: 6px;">🖥️</div>
                                    <div class="text-md" style="font-weight: bold; color: var(--text-primary);">③ 認証サーバ</div>
                                    <div class="text-xs text-muted" style="margin-top: 4px;">(ユーザーDB照合・判定を行うサーバ)</div>
                                </div>
                                
                                <div style="margin-top: 16px; text-align: left; background: var(--bg-app); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                                    <div class="form-group" style="margin-bottom: 10px;">
                                        <label class="text-xs text-muted">IEEE 802.1Xでの役割:</label>
                                        <select id="roleServerDot1x" class="text-sm" style="width: 100%; padding: 6px; border-radius: 4px;">
                                            <option value="">-- 選択してください --</option>
                                            <option value="Supplicant">サプリカント (Supplicant)</option>
                                            <option value="Authenticator">オーセンティケータ (Authenticator)</option>
                                            <option value="Server">認証サーバ (Authentication Server)</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label class="text-xs text-muted">RADIUSでの役割:</label>
                                        <select id="roleServerRadius" class="text-sm" style="width: 100%; padding: 6px; border-radius: 4px;">
                                            <option value="">-- 選択してください --</option>
                                            <option value="None">なし (RADIUSプロトコルは直接扱わない)</option>
                                            <option value="Client">RADIUSクライアント</option>
                                            <option value="Server">RADIUSサーバ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Verify Action Button & Feedback -->
                        <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: center;">
                            <button class="btn btn-primary" id="btnVerifyRoles" style="padding: 10px 24px; font-weight: bold; cursor: pointer;">
                                🔍 役割構成を検証・回答する
                            </button>
                            
                            <div id="roleVerifyResult" style="margin-top: 16px; width: 100%; display: none;"></div>
                        </div>
                    </div>

                    <!-- Key Technical Summary Table -->
                    <div style="margin-top: 24px;">
                        <h4 class="text-md" style="margin-bottom: 10px;">📌 機器ごとの機能まとめ（試験対策）</h4>
                        <div style="overflow-x: auto;">
                            <table class="text-sm" style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr class="table-row-header">
                                        <th style="padding: 10px; border: 1px solid var(--border-color);">対象機器</th>
                                        <th style="padding: 10px; border: 1px solid var(--border-color);">802.1Xの役割</th>
                                        <th style="padding: 10px; border: 1px solid var(--border-color);">RADIUSの役割</th>
                                        <th style="padding: 10px; border: 1px solid var(--border-color);">使用プロトコル</th>
                                        <th style="padding: 10px; border: 1px solid var(--border-color);">機能・役割の要点</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">PC / 端末</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #38bdf8;">サプリカント</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #9ca3af;">なし</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">EAPOL (L2)</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">ネットワークへのアクセスを要求し、自らの認証情報（ID/PWや証明書）を送信する。</td>
                                    </tr>
                                    <tr class="table-row-primary">
                                        <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold; color: #60a5fa;">無線AP / L2SW</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #60a5fa; font-weight: bold;">オーセンティケータ</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #60a5fa; font-weight: bold;">RADIUSクライアント</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">EAPOL ⇄ RADIUS</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #000000ff;">
                                            <strong>【問17正解ポイント】</strong>自身で判定を行わず、EAPOLをRADIUS（UDP 1812）に変換して認証サーバへ仲介する。認証成功時にポートを解放する。
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">認証サーバ</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #24ac6dff;">認証サーバ</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color); color: #24ac6dff;">RADIUSサーバ</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">RADIUS (UDP 1812/1813)</td>
                                        <td style="padding: 10px; border: 1px solid var(--border-color);">ユーザーDBと照合して認証の可否を判定し、APにAccess-Accept / Access-Reject を返す。</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Sequence & Flow Diagram -->
            <div id="panelEapFlow" class="tab-panel" style="display: none;">
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
                                        <label for="eapClientCert" class="text-xs" style="cursor: pointer;">📄 クライアント証明書所持</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" id="eapPacKey" checked>
                                        <label for="eapPacKey" class="text-xs" style="cursor: pointer;">🔑 PACキー所持 (FAST用)</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SVG Sequence Diagram -->
                        <div class="oauth-flow-diagram" style="background: #121214; border-radius: 8px; padding: 15px; overflow-x: auto;">
                            <svg class="oauth-svg" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" style="min-width: 500px;">
                                <!-- Lifelines -->
                                <line x1="100" y1="50" x2="100" y2="350" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                                <line x1="300" y1="50" x2="300" y2="350" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                                <line x1="500" y1="50" x2="500" y2="350" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />

                                <!-- Protocol Header Labels -->
                                <text x="200" y="25" fill="#38bdf8" font-size="10" text-anchor="middle">L2: EAPOL (有線/無線)</text>
                                <text x="400" y="25" fill="#a7f3d0" font-size="10" text-anchor="middle">L3: RADIUS (UDP 1812)</text>

                                <!-- Actors -->
                                <rect id="eap-actor-supplicant" class="svg-actor" x="40" y="32" width="120" height="35" rx="5" />
                                <text class="svg-text" x="100" y="53">Supplicant (PC)</text>

                                <rect id="eap-actor-authenticator" class="svg-actor" x="240" y="32" width="120" height="35" rx="5" />
                                <text class="svg-text" x="300" y="46" font-size="11">Authenticator (AP)</text>
                                <text class="svg-text" x="300" y="60" font-size="9" fill="#94a3b8">[RADIUS Client]</text>

                                <rect id="eap-actor-radius" class="svg-actor" x="440" y="32" width="120" height="35" rx="5" />
                                <text class="svg-text" x="500" y="53">RADIUS Server</text>

                                <!-- Step 1: Identity & EAPOL Init -->
                                <g id="eap-arrow-1" class="flow-arrow-group">
                                    <path class="svg-arrow" d="M 100,85 L 295,85" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="200" y="80">1a. EAPOL-Start (接続要求)</text>
                                    
                                    <path class="svg-arrow" d="M 300,107 L 105,107" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="200" y="102">1b. EAP-Request / Identity</text>

                                    <path class="svg-arrow" d="M 100,129 L 295,129" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="200" y="124">1c. EAP-Response / Identity (ID送信)</text>

                                    <path class="svg-arrow" d="M 300,151 L 495,151" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="400" y="146">1d. RADIUS Access-Request (転送)</text>
                                </g>

                                <!-- Step 2: Method Start -->
                                <g id="eap-arrow-2" class="flow-arrow-group">
                                    <path class="svg-arrow" d="M 500,180 L 305,180" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                    <text class="svg-text svg-text-sub" x="400" y="175">2a. RADIUS Access-Challenge</text>

                                    <path class="svg-arrow" d="M 300,202 L 105,202" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="200" y="197">2b. EAP-Request (Method-Start)</text>
                                </g>

                                <!-- Step 3: TLS Tunnel or challenge-response exchange -->
                                <g id="eap-arrow-3" class="flow-arrow-group">
                                    <path class="svg-arrow" d="M 100,230 L 295,230" marker-end="url(#eap-arrowhead)" />
                                    <path class="svg-arrow" d="M 300,240 L 495,240" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="300" y="225" id="eap-label-3a">3a. 資格情報送信 / TLSネゴシエーション</text>

                                    <path class="svg-arrow" d="M 500,260 L 305,260" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                    <path class="svg-arrow" d="M 300,270 L 105,270" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                    <text class="svg-text svg-text-sub" x="300" y="255" id="eap-label-3b">3b. 認証サーバー応答 / TLS証明書検証</text>
                                </g>

                                <!-- Step 4: Tunnel inner credential verify -->
                                <g id="eap-arrow-4" class="flow-arrow-group">
                                    <path class="svg-arrow" d="M 100,300 L 295,300" marker-end="url(#eap-arrowhead)" />
                                    <path class="svg-arrow" d="M 300,310 L 495,310" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="300" y="295" id="eap-label-4">4. トンネル内認証 (ID/PWまたは検証データ)</text>
                                </g>

                                <!-- Step 5: EAP Success & Port Open -->
                                <g id="eap-arrow-5" class="flow-arrow-group">
                                    <path class="svg-arrow" d="M 500,335 L 305,335" marker-end="url(#eap-arrowhead)" stroke-dasharray="2" />
                                    <text class="svg-text svg-text-sub" x="400" y="330">5a. RADIUS Access-Accept (鍵配布)</text>

                                    <path class="svg-arrow" d="M 300,355 L 105,355" marker-end="url(#eap-arrowhead)" />
                                    <text class="svg-text svg-text-sub" x="200" y="350">5b. EAP-Success (ポート解放)</text>
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
                        <div style="display: flex; gap: 14px; margin-top: 20px; flex-wrap: wrap;">
                            <button class="btn btn-secondary" id="btnEapReset">リセット</button>
                            <button class="btn btn-primary" id="btnEapNext" style="cursor: pointer;">次のステップへ進む</button>
                            <button class="btn btn-secondary" id="btnEapAuto" style="color: var(--color-success); border-color: rgba(16, 185, 129, 0.4); cursor: pointer;">オートデモ実行</button>
                        </div>
                    </div>

                    <!-- Right: Explanations & Logs -->
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h3 class="text-md" style="margin: 0;">📁 RADIUS / EAPOL ログ詳細</h3>
                                <!-- Port Status Badge -->
                                <div id="eapPortStatus" class="text-xs badge-subtle-danger" style="padding: 4px 10px; border-radius: 4px; font-weight: bold;">
                                    🔒 ポート閉鎖 (Unauthorized)
                                </div>
                            </div>

                            <div class="form-group">
                                <label>現在ステップ:</label>
                                <div class="text-base text-primary-color" style="font-weight: bold;" id="eapStepTitle">
                                    開始ボタンを押してください
                                </div>
                            </div>

                            <div class="form-group">
                                <label>ステップ解説:</label>
                                <div class="text-sm text-muted" style="line-height: 1.5; min-height: 50px;" id="eapStepExplanation">
                                    認証方式を選択し、「次のステップへ進む」を押してください。
                                </div>
                            </div>

                            <div class="form-group">
                                <label>パケット通信ログ (EAPOL ⇄ RADIUS):</label>
                                <div class="response-box" style="background-color: #0c0a09; height: 180px; overflow-y: auto;">
                                    <code id="eapLogConsole" class="text-sm text-success-color">「次のステップへ進む」を押すと、802.1X認証シーケンスが開始され、パケット詳細が出力されます。</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            </div>
        </div>
    `,

    quiz: [
        {
            id: "eapQuiz_1",
            year: "令和4年春期 午前Ⅱ 問17 (IEEE 802.1X / RADIUS)",
            question: "利用者認証情報を管理するサーバ1台と複数のアクセスポイントで構成された無線LAN環境を実現したい。PCが無線LAN環境に接続するときの利用者認証とアクセス制御に，IEEE 802.1XとRADIUSを利用する場合の標準的な方法はどれか。",
            options: [
                { key: "A", label: "ア", text: "PCにはIEEE 802.1Xのサプリカントを実装し，かつ，RADIUSクライアントの機能をもたせる。" },
                { key: "I", label: "イ", text: "アクセスポイントにはIEEE 802.1Xのオーセンティケータを実装し，かつ，RADIUSクライアントの機能をもたせる。" },
                { key: "U", label: "ウ", text: "アクセスポイントにはIEEE 802.1Xのサプリカントを実装し，かつ，RADIUSサーバの機能をもたせる。" },
                { key: "E", label: "エ", text: "サーバにはIEEE 802.1Xのオーセンティケータを実装し，かつ，RADIUSサーバの機能をもたせる。" }
            ],
            answer: "I",
            explanation: "アクセスポイント（AP）は、端末と接続する 802.1X の「<strong>オーセンティケータ</strong>」であり、認証サーバと通信する「<strong>RADIUSクライアント</strong>」の機能を持ちます。<br><br>【各選択肢の解説】<br>・ア: PCが持つのはサプリカントのみです。<br>・イ: アクセスポイント＝オーセンティケータ 兼 RADIUSクライアント (正解)。<br>・ウ: APはサプリカントでもRADIUSサーバでもありません。<br>・エ: サーバは認証サーバ（RADIUSサーバ）です。",
            point: "アクセスポイント（AP）が「802.1Xオーセンティケータ 兼 RADIUSクライアント」としてプロトコル変換（EAPOL ⇄ RADIUS）を担う点が最頻出です。"
        },
        {
            id: "eapQuiz_2",
            year: "セキスペ応用演習 (EAP認証方式比較)",
            question: "IEEE 802.1X認証で使用されるEAP方式のうち、クライアント端末（サプリカント）側にデジタル証明書（クライアント証明書）をあらかじめインストールしておく必要があり、サーバとクライアントの双方向で厳格な相互認証を行うプロトコルはどれか。",
            options: [
                { key: "A", label: "ア", text: "PEAP (Protected EAP)" },
                { key: "I", label: "イ", text: "EAP-TLS" },
                { key: "U", label: "ウ", text: "EAP-MD5" },
                { key: "E", label: "エ", text: "EAP-FAST" }
            ],
            answer: "I",
            explanation: "<strong>EAP-TLS (Transport Layer Security)</strong> では、サーバ証明書とクライアント証明書の両方を使用した『相互証明書認証』を行います。最も高セキュリティですがクライアント証明書の事前配布が必要です。<br><br>【他方式との比較】<br>・<strong>PEAP</strong>: サーバ証明書のみでTLSトンネルを構築し、内部でID/PW（MS-CHAPv2）認証を行う（クライアント証明書不要）。<br>・<strong>EAP-MD5</strong>: 暗号化なし・単方向ハッシュ（脆弱）。<br>・<strong>EAP-FAST</strong>: PACキーによる保護トンネル。",
            point: "「クライアント証明書が必須」＝EAP-TLS。「クライアント証明書不要でID/パスワード」＝PEAP / EAP-TTLS。"
        }
    ],

    references: [
        { source: "IPA 独立行政法人 情報処理推進機構", title: "令和4年春期 午前Ⅱ 問17 過去問解説（EAP-TLS / PEAP / EAP-TTLS）", url: "https://www.sc-siken.com/kakomon/04_haru/am2_17.html" },
        { source: "IEEE 802.1X", title: "Port-Based Network Access Control Standard", url: "https://standards.ieee.org/ieee/802.1X/3973/", note: "ポートベースネットワーク認証規格" },
        { source: "RFC 3748", title: "Extensible Authentication Protocol (EAP)", url: "https://datatracker.ietf.org/doc/html/rfc3748", note: "EAPプロトコル標準仕様" },
        { source: "RFC 2865", title: "Remote Authentication Dial In User Service (RADIUS)", url: "https://datatracker.ietf.org/doc/html/rfc2865", note: "RADIUS認証標準仕様" },
        { source: "Cisco Systems", title: "IEEE 802.1X 認証デザイン ＆ RADIUS 連携ガイド", url: "https://www.cisco.com/c/ja_jp/support/docs/lan-switching/8021x/118634-config-8021x-00.html" }
    ],
    init: function () {
        // --- Navigation Tab Switching ---
        if (window.UIComponents && window.UIComponents.setupSubTabs) {
            window.UIComponents.setupSubTabs([
                { btnId: "btnTabEapArch", panelId: "panelEapArch" },
                { btnId: "btnTabEapFlow", panelId: "panelEapFlow" }
            ], (btnId, panelId) => {
                if (panelId === "panelEapFlow" && typeof updateUI === "function") {
                    updateUI();
                }
            });
        }

        // --- TAB 1: Role Verification Logic ---
        const btnVerifyRoles = document.getElementById("btnVerifyRoles");
        const roleVerifyResult = document.getElementById("roleVerifyResult");

        if (btnVerifyRoles) {
            btnVerifyRoles.addEventListener("click", () => {
                const pcDot1x = document.getElementById("rolePcDot1x").value;
                const pcRadius = document.getElementById("rolePcRadius").value;

                const apDot1x = document.getElementById("roleApDot1x").value;
                const apRadius = document.getElementById("roleApRadius").value;

                const serverDot1x = document.getElementById("roleServerDot1x").value;
                const serverRadius = document.getElementById("roleServerRadius").value;

                if (!pcDot1x || !pcRadius || !apDot1x || !apRadius || !serverDot1x || !serverRadius) {
                    roleVerifyResult.style.display = "block";
                    roleVerifyResult.className = "alert alert-warning";
                    roleVerifyResult.innerHTML = "⚠️ すべての機器の「802.1Xの役割」と「RADIUSでの役割」を選択してください。";
                    return;
                }

                const isPcCorrect = (pcDot1x === "Supplicant" && pcRadius === "None");
                const isApCorrect = (apDot1x === "Authenticator" && apRadius === "Client");
                const isServerCorrect = (serverDot1x === "Server" && serverRadius === "Server");

                roleVerifyResult.style.display = "block";

                if (isPcCorrect && isApCorrect && isServerCorrect) {
                    roleVerifyResult.className = "alert alert-success text-sm";
                    roleVerifyResult.innerHTML = `
                        <div class="text-md" style="font-weight: bold; margin-bottom: 6px;">🎉 大正解です！パーフェクトな役割構成です！</div>
                        <div class="text-sm" style="line-height: 1.6;">
                            <strong>【解説】</strong><br>
                            ・<strong>クライアントPC</strong>: 802.1Xの「サプリカント」。RADIUSプロトコルは直接扱いません。<br>
                            ・<strong>アクセスポイント(AP)</strong>: 802.1Xの「オーセンティケータ」であり、かつRADIUSの「RADIUSクライアント」です！（<strong>★問17正解ポイント</strong>）<br>
                            ・<strong>認証サーバ</strong>: 802.1Xの「認証サーバ」であり、かつRADIUSの「RADIUSサーバ」です。
                        </div>
                    `;
                    if (window.app) window.app.log("success", "[IEEE 802.1X] 機器役割配置チャレンジに正解しました！");
                } else {
                    roleVerifyResult.className = "alert alert-danger text-sm";
                    let details = "<ul style='margin-top: 6px; margin-bottom: 0; padding-left: 18px;'>";
                    if (!isPcCorrect) details += "<li>PC: 802.1Xでは「サプリカント」であり、RADIUSプロトコルは直接動作させません（なし）。</li>";
                    if (!isApCorrect) details += "<li><strong>アクセスポイント(AP)</strong>: 802.1Xでは「オーセンティケータ」、RADIUSでは「RADIUSクライアント」として機能します。ここが最大の頻出ポイントです！</li>";
                    if (!isServerCorrect) details += "<li>認証サーバ: 802.1Xでは「認証サーバ」、RADIUSでは「RADIUSサーバ」です。</li>";
                    details += "</ul>";

                    roleVerifyResult.innerHTML = `
                        <div class="text-md" style="font-weight: bold; margin-bottom: 4px;">❌ 役割の設定に一部誤りがあります。</div>
                        <div class="text-sm" style="line-height: 1.6;">
                            もう一度見直してみましょう：
                            ${details}
                        </div>
                    `;
                    if (window.app) window.app.log("error", "[IEEE 802.1X] 機器役割配置チャレンジで不整合がありました。");
                }
            });
        }


        // --- TAB 2: Sequence & Handshake Flow Simulator ---
        const eapMethodSelect = document.getElementById("eapMethodSelect");
        const eapClientCert = document.getElementById("eapClientCert");
        const eapPacKey = document.getElementById("eapPacKey");
        const btnEapReset = document.getElementById("btnEapReset");
        const btnEapNext = document.getElementById("btnEapNext");
        const btnEapAuto = document.getElementById("btnEapAuto");

        const eapStepTitle = document.getElementById("eapStepTitle");
        const eapStepExplanation = document.getElementById("eapStepExplanation");
        const eapLogConsole = document.getElementById("eapLogConsole");
        const eapPortStatus = document.getElementById("eapPortStatus");

        // Correct SVG Element IDs (hyphenated as in HTML)
        const eapLabel3a = document.getElementById("eap-label-3a");
        const eapLabel3b = document.getElementById("eap-label-3b");
        const eapLabel4 = document.getElementById("eap-label-4");

        let currentStep = 0;
        let isAutoRunning = false;
        let autoTimer = null;

        function getStepsForMethod(method) {
            switch (method) {
                case "TLS":
                    return [
                        {
                            title: "Step 1: EAPOL開始 ＆ ID応答 (EAP-Request/Response Identity)",
                            explain: "Supplicant(PC)がアクセスポイント(AP)へ EAPOL-Start を送信。APは RADIUS Access-Request(EAP-Identity) としてRADIUSサーバへ転送します。",
                            actors: ["eap-actor-supplicant", "eap-actor-authenticator", "eap-actor-radius"],
                            arrows: ["eap-arrow-1"],
                            getLog: () => `[L2: EAPOL] Supplicant -> AP: EAPOL-Start\n[L2: EAPOL] AP -> Supplicant: EAP-Request/Identity\n[L2: EAPOL] Supplicant -> AP: EAP-Response/Identity (User: user1)\n[L3: RADIUS] AP(RADIUS Client) -> RADIUS Server: Access-Request [Code=1, EAP-Message]`
                        },
                        {
                            title: "Step 2: EAP-TLS 認証方式ネゴシエーション開始",
                            explain: "RADIUSサーバは EAP-TLS の使用を指定し、AP経由でSupplicantへ EAP-Request(EAP-TLS Start) を送信します。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-2"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Challenge [EAP-Message: EAP-TLS Start]\n[L2: EAPOL] AP -> Supplicant: EAP-Request/EAP-TLS (Start)`
                        },
                        {
                            title: "Step 3: TLS 相互ハンドシェイク ＆ クライアント証明書検証",
                            explain: "SupplicantとRADIUSサーバ間でTLSハンドシェイクが実行されます。EAP-TLSでは『サーバ証明書』と『クライアント証明書』の両方による相互認証が行われます。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-3"],
                            getLog: () => `[L2/L3: EAP-TLS] Supplicant -> RADIUS Server: ClientHello + Client Certificate\n[L2/L3: EAP-TLS] RADIUS Server -> Supplicant: ServerHello + Server Certificate\n[VALIDATION] RADIUS Server: クライアント証明書の有効性とPKIルートCAパスを検証中... [OK]`
                        },
                        {
                            title: "Step 4: マスター鍵(MSK)生成 ＆ 鍵交換",
                            explain: "TLSハンドシェイク完了後、相互の証明書からMaster Session Key (MSK) を生成。マスター鍵から暗号化通信用のPMK/PTKが導出されます。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-4"],
                            getLog: () => `[CRYPTO] TLSハンドシェイク成功。Master Session Key (MSK 64bytes) 派生完了。\n[EAP-TLS] Finished メッセージ交換成功。`
                        },
                        {
                            title: "Step 5: RADIUS Access-Accept ＆ AP論理ポート解放",
                            explain: "RADIUSサーバが AP へ RADIUS Access-Accept と暗号化鍵(EAP-Key)を送信。APはSupplicantへ EAP-Success を送り、ポートを解放（Authorized）します。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-5"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Accept [Attributes: EAP-Key/PMK]\n[L2: EAPOL] AP -> Supplicant: EAP-Success\n[AP PORT] Logical Port Status: UNAUTHORIZED -> AUTHORIZED (通信開放!)`
                        }
                    ];

                case "TTLS":
                    return [
                        {
                            title: "Step 1: EAPOL開始 ＆ ID応答",
                            explain: "Supplicant(PC)がAP経由でRADIUSサーバへIDを送信します。",
                            actors: ["eap-actor-supplicant", "eap-actor-authenticator", "eap-actor-radius"],
                            arrows: ["eap-arrow-1"],
                            getLog: () => `[L2: EAPOL] Supplicant -> AP: EAPOL-Start\n[L2: EAPOL] AP -> Supplicant: EAP-Request/Identity\n[L2: EAPOL] Supplicant -> AP: EAP-Response/Identity`
                        },
                        {
                            title: "Step 2: EAP-TTLS 開始要求",
                            explain: "RADIUSサーバから EAP-TTLS ネゴシエーションが開始されます。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-2"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Challenge (EAP-TTLS Start)\n[L2: EAPOL] AP -> Supplicant: EAP-Request/TTLS`
                        },
                        {
                            title: "Step 3: TTLS トンネル確立（サーバー証明書検証）",
                            explain: "RADIUSサーバの証明書を用いてTLSトンネルを確立します。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-3"],
                            getLog: () => `[TTLS Tunnel] TLS Handshake (Server Certificate Verification)... [OK]`
                        },
                        {
                            title: "Step 4: トンネル内での柔軟なユーザー認証 (PAP/CHAP/MS-CHAP)",
                            explain: "確立したTLSトンネル内部で、従来のPAP/CHAP/MS-CHAPv2などで安全にパスワード検証を行います。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-4"],
                            getLog: () => `[TTLS Inner] Tunnel Encrypted Authentication (PAP/CHAP/MS-CHAPv2)... [OK]`
                        },
                        {
                            title: "Step 5: 認証成功 ＆ APポート解放",
                            explain: "RADIUS Access-Accept がAPに届き、APが論理ポートを解放します。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-5"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Accept\n[AP PORT] Status: AUTHORIZED`
                        }
                    ];

                case "EAP-FAST":
                    return [
                        {
                            title: "Step 1: EAPOL開始 ＆ ID応答",
                            explain: "Supplicant(PC)がAP経由でRADIUSサーバへIDを送信します。",
                            actors: ["eap-actor-supplicant", "eap-actor-authenticator", "eap-actor-radius"],
                            arrows: ["eap-arrow-1"],
                            getLog: () => `[L2: EAPOL] Supplicant -> AP: EAPOL-Start\n[L2: EAPOL] AP -> Supplicant: EAP-Response/Identity`
                        },
                        {
                            title: "Step 2: EAP-FAST ネゴシエーション",
                            explain: "Ciscoが開発したデジタル証明書不要のEAP-FAST方式が指定されます。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-2"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Challenge (EAP-FAST Start)`
                        },
                        {
                            title: "Step 3: PAC (Protected Access Credential) キーによる証明書レス・トンネル確立",
                            explain: "証明書の代わりにPACキーを用いて安全なTLSトンネルを迅速に構築します。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-3"],
                            getLog: () => `[EAP-FAST] PAC Key Verification & Fast TLS Tunnel Setup... [OK]`
                        },
                        {
                            title: "Step 4: トンネル内MS-CHAPv2認証",
                            explain: "PACトンネル内でMS-CHAPv2によるユーザー認証を実施します。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-4"],
                            getLog: () => `[EAP-FAST Inner] MS-CHAPv2 Inner Authentication... [OK]`
                        },
                        {
                            title: "Step 5: 認証成功 ＆ APポート解放",
                            explain: "RADIUS Access-Accept がAPに届き、APが論理ポートを解放します。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-5"],
                            getLog: () => `[L3: RADIUS] Access-Accept -> AP Port Open (AUTHORIZED)`
                        }
                    ];

                case "MD5":
                    return [
                        {
                            title: "Step 1: EAPOL開始 ＆ ID応答",
                            explain: "Supplicant(PC)がAP経由でRADIUSサーバへIDを送信します。",
                            actors: ["eap-actor-supplicant", "eap-actor-authenticator", "eap-actor-radius"],
                            arrows: ["eap-arrow-1"],
                            getLog: () => `[L2: EAPOL] Supplicant -> AP: EAPOL-Start`
                        },
                        {
                            title: "Step 2: EAP-MD5 チャレンジ要求",
                            explain: "RADIUSサーバからランダムなチャレンジ文字列が届きます。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-2"],
                            getLog: () => `[EAP-MD5] RADIUS Server -> Supplicant: Challenge String`
                        },
                        {
                            title: "Step 3: パスワード + チャレンジのMD5ハッシュ送信（※暗号化トンネルなし！）",
                            explain: "Supplicantはパスワードとチャレンジを結合してMD5ハッシュを計算・送信します。※暗号化なしのためオフライン辞書攻撃に脆弱です。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-3"],
                            getLog: () => `[EAP-MD5] Supplicant -> RADIUS Server: MD5 Response Hash\n⚠️ WARNING: 暗号化トンネルがないため平文IDや辞書攻撃のリスクがあります！`
                        },
                        {
                            title: "Step 4: ハッシュ照合",
                            explain: "RADIUSサーバ側でハッシュの一致を検証します。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-4"],
                            getLog: () => `[MD5 Verify] Server MD5 Calculation Match: OK`
                        },
                        {
                            title: "Step 5: 認証成功 ＆ APポート解放",
                            explain: "認証成功。ただし鍵交換機能がないため有線LANなどの限定用途に使われます。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-5"],
                            getLog: () => `[L3: RADIUS] Access-Accept -> AP Port Open (AUTHORIZED)`
                        }
                    ];

                case "PEAP":
                default:
                    return [
                        {
                            title: "Step 1: EAPOL開始 ＆ ID応答",
                            explain: "Supplicant(PC)がAP経由でRADIUSサーバへIDを送信します。",
                            actors: ["eap-actor-supplicant", "eap-actor-authenticator", "eap-actor-radius"],
                            arrows: ["eap-arrow-1"],
                            getLog: () => `[L2: EAPOL] Supplicant -> AP: EAPOL-Start\n[L2: EAPOL] AP -> Supplicant: EAP-Request/Identity\n[L2: EAPOL] Supplicant -> AP: EAP-Response/Identity (User: user1)\n[L3: RADIUS] AP -> RADIUS Server: Access-Request`
                        },
                        {
                            title: "Step 2: PEAP (EAP-PEAP) ネゴシエーション開始",
                            explain: "RADIUSサーバから PEAP の開始要求が送られます。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-2"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Challenge (PEAP Start)\n[L2: EAPOL] AP -> Supplicant: EAP-Request/PEAP`
                        },
                        {
                            title: "Step 3: PEAP Outer TLS トンネル確立（サーバ証明書のみ検証）",
                            explain: "RADIUSサーバの『サーバ証明書』のみを用いて安全なTLS暗号化トンネルを確立します（クライアント証明書は不要）。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-3"],
                            getLog: () => `[PEAP Outer Tunnel] ClientHello -> ServerHello + Server Certificate\n[Supplicant] RADIUSサーバの証明書をCA証明書で検証... [OK]\n[TLS Tunnel] 暗号化PEAPトンネル確立成功！`
                        },
                        {
                            title: "Step 4: PEAP Inner 認証 (MS-CHAPv2 / ID・パスワード認証)",
                            explain: "確立したTLSトンネル内部で、ユーザーIDとパスワードによるMS-CHAPv2チャレンジレスポンス認証を実行します。",
                            actors: ["eap-actor-supplicant", "eap-actor-radius"],
                            arrows: ["eap-arrow-4"],
                            getLog: () => `[PEAP Inner (Encrypted)] RADIUS Server -> Supplicant: Challenge\n[PEAP Inner (Encrypted)] Supplicant -> RADIUS Server: Response (MS-CHAPv2 Hash)\n[RADIUS Server] ユーザーDBと照合... パスワード検証OK！`
                        },
                        {
                            title: "Step 5: 認証成功 ＆ APポート解放",
                            explain: "RADIUS Access-Accept がAPに届き、APが論理ポートを解放して暗号キー（WPA2/3-Enterpriseキー）が有効になります。",
                            actors: ["eap-actor-radius", "eap-actor-authenticator", "eap-actor-supplicant"],
                            arrows: ["eap-arrow-5"],
                            getLog: () => `[L3: RADIUS] RADIUS Server -> AP: Access-Accept\n[L2: EAPOL] AP -> Supplicant: EAP-Success\n[AP PORT] Logical Port Status: AUTHORIZED`
                        }
                    ];
            }
        }

        function updateUI() {
            if (!eapMethodSelect) return;
            const method = eapMethodSelect.value;
            const steps = getStepsForMethod(method);

            // Safely update SVG Labels according to method
            if (eapLabel3a && eapLabel3b && eapLabel4) {
                if (method === "TLS") {
                    eapLabel3a.textContent = "3a. Client/Server Certificate Handshake";
                    eapLabel3b.textContent = "3b. 相互証明書検証 (Client & Server)";
                    eapLabel4.textContent = "4. マスターセッション鍵 (MSK) 生成";
                } else if (method === "PEAP" || method === "TTLS") {
                    eapLabel3a.textContent = "3a. Outer TLS Tunnelネゴシエーション";
                    eapLabel3b.textContent = "3b. サーバー証明書検証 (Outer TLS)";
                    eapLabel4.textContent = "4. トンネル内認証 (ID/PW - MS-CHAPv2)";
                } else if (method === "EAP-FAST") {
                    eapLabel3a.textContent = "3a. PAC Key Key Exchange";
                    eapLabel3b.textContent = "3b. PAC Tunnel 確立";
                    eapLabel4.textContent = "4. トンネル内MS-CHAPv2認証";
                } else {
                    eapLabel3a.textContent = "3a. 資格情報送信 / チャレンジ生成";
                    eapLabel3b.textContent = "3b. レスポンス検証";
                    eapLabel4.textContent = "4. 認証結果確認";
                }
            }

            // Clear previous SVG highlights
            document.querySelectorAll(".svg-actor").forEach(el => el.classList.remove("svg-actor-active"));
            document.querySelectorAll(".svg-arrow-active").forEach(el => el.classList.remove("svg-arrow-active"));

            if (currentStep === 0) {
                if (eapStepTitle) eapStepTitle.innerText = "開始ボタンを押してください";
                if (eapStepExplanation) eapStepExplanation.innerText = `EAP-${method} の認証シーケンスを開始します。「次のステップへ進む」または「オートデモ実行」を押してください。`;
                if (eapLogConsole) eapLogConsole.innerText = `[READY] EAP-${method} 認証シミュレーション準備完了。`;
                if (btnEapNext) {
                    btnEapNext.innerText = "次のステップへ進む";
                    btnEapNext.disabled = false;
                }

                if (eapPortStatus) {
                    eapPortStatus.innerText = "🔒 ポート閉鎖 (Unauthorized)";
                    eapPortStatus.className = "text-xs badge-subtle-danger";
                }
                return;
            }

            if (btnEapNext) {
                btnEapNext.innerText = currentStep === steps.length ? "完了 (リセット)" : "次のステップへ進む";
                btnEapNext.disabled = false;
            }

            const step = steps[currentStep - 1];
            if (eapStepTitle) eapStepTitle.innerText = `${currentStep}/${steps.length} - ${step.title}`;
            if (eapStepExplanation) eapStepExplanation.innerText = step.explain;

            // Generate simulated logs
            let logText = step.getLog();
            if (eapLogConsole) eapLogConsole.innerText = logText;

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
                if (method === "TLS" && eapClientCert && !eapClientCert.checked) {
                    hasError = true;
                    errorMsg = "\n\n❌ 【認証エラー】EAP-TLSではSupplicant(PC)側のクライアント証明書が必須ですが、未所持のためハンドシェイクが失敗しました。";
                } else if (method === "EAP-FAST" && eapPacKey && !eapPacKey.checked) {
                    hasError = true;
                    errorMsg = "\n\n❌ 【認証エラー】EAP-FASTのトンネル確立に必要なPACキーがSupplicantにないため、認証が失敗しました。";
                }
            }

            if (hasError) {
                if (eapLogConsole) eapLogConsole.innerText += errorMsg;
                if (eapStepTitle) eapStepTitle.innerText = `⚠️ エラー発生 - ${step.title}`;
                if (eapStepExplanation) eapStepExplanation.innerText = "前提条件（クライアント証明書の所持、またはPACキーの所持）が満たされていないため、認証プロセスが途中で中断されました。チェックボックスをONにしてやり直してください。";
                if (window.app) window.app.log("error", `[EAP認証エラー] EAP-${method} の前提要件が不足しています。`);

                // Block progress
                if (btnEapNext) btnEapNext.disabled = true;
                isAutoRunning = false;
                if (btnEapAuto) btnEapAuto.innerText = "オートデモ実行";
                return;
            }

            // Port status authorized at the last step
            if (currentStep === steps.length) {
                if (eapPortStatus) {
                    eapPortStatus.innerText = "🔓 ポート解放 (Authorized)";
                    eapPortStatus.className = "text-xs badge-subtle-success";
                }
                if (window.app) window.app.log("success", `[EAP認証成功] EAP-${method} により logical port がAUTHORIZEDに変更されました。`);
            }
        }

        function resetFlow() {
            currentStep = 0;
            if (btnEapNext) btnEapNext.disabled = false;
            if (autoTimer) {
                clearTimeout(autoTimer);
                autoTimer = null;
            }
            isAutoRunning = false;
            if (btnEapAuto) btnEapAuto.innerText = "オートデモ実行";
            updateUI();
        }

        if (btnEapNext) {
            btnEapNext.addEventListener("click", () => {
                const steps = getStepsForMethod(eapMethodSelect.value);
                if (currentStep >= steps.length) {
                    resetFlow();
                } else {
                    currentStep++;
                    updateUI();
                }
            });
        }

        if (btnEapReset) {
            btnEapReset.addEventListener("click", () => {
                resetFlow();
                if (window.app) window.app.log("system", "EAPシミュレーターを初期化しました。");
            });
        }

        if (btnEapAuto) {
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
                    const steps = getStepsForMethod(eapMethodSelect.value);
                    if (!isAutoRunning) return;
                    if (currentStep >= steps.length) {
                        resetFlow();
                        return;
                    }
                    currentStep++;
                    updateUI();

                    if (btnEapNext && !btnEapNext.disabled && currentStep < steps.length) {
                        autoTimer = setTimeout(runAutoStep, 2400);
                    } else {
                        isAutoRunning = false;
                        if (btnEapAuto) btnEapAuto.innerText = "オートデモ実行";
                    }
                };

                runAutoStep();
            });
        }

        if (eapMethodSelect) eapMethodSelect.addEventListener("change", resetFlow);
        if (eapClientCert) eapClientCert.addEventListener("change", resetFlow);
        if (eapPacKey) eapPacKey.addEventListener("change", resetFlow);

        resetFlow();
    }
};
