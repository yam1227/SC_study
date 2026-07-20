/**
 * Module 9: IPsec Packet Structure & IKE exchange Lab
 */
window.SecurityLabModules["ipsec"] = {
    html: `
        <div class="lab-container">
            <!-- Part 1: Packet Encapsulation Simulator -->
            <div class="card">
                <h3>🔐 IPsec カプセル化・パケット構造ビジュアライザー</h3>
                <p class="card-subtitle">モード（トンネル / トランスポート）とプロトコル（AH / ESP）を切り替え、パケットヘッダーの再構成と暗号化の適用範囲を視覚的に理解します。</p>
                
                <div class="lab-grid-3" style="grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                    <div class="form-group">
                        <label>IPsec 動作モードを選択:</label>
                        <select id="ipsecMode">
                            <option value="tunnel" selected>トンネルモード (ゲートウェイ間 - VPN用)</option>
                            <option value="transport">トランスポートモード (端末間通信用)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>セキュリティプロトコルを選択:</label>
                        <select id="ipsecProtocol">
                            <option value="esp" selected>ESP (Encapsulating Security Payload - 暗号化＋認証)</option>
                            <option value="ah">AH (Authentication Header - 認証のみ・暗号化なし)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ipsecPayload">送信するデータ部 (Payload):</label>
                        <input type="text" id="ipsecPayload" value="GET /secret_data HTTP/1.1" placeholder="データ">
                    </div>
                </div>
                
                <h4 style="font-size: 13px; color: var(--text-secondary); margin-top: 14px;">📦 構築されたパケットの配置レイアウト (クリックで各ヘッダーの説明を表示)</h4>
                
                <!-- Dynamic Packet layout rendering area -->
                <div id="ipsecPacketLayoutContainer" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; padding: 14px; background-color: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); min-height: 80px;">
                    <!-- Filled dynamically -->
                </div>
                
                <div class="form-group" style="margin-top: 14px;">
                    <label>選択したヘッダーの詳細情報:</label>
                    <div class="response-box" id="ipsecHeaderDescBox" style="min-height: 80px; background-color: #0c0a09; border-color: rgba(99,102,241,0.3);">
                        <code id="ipsecHeaderDescText">上のパケットブロックをクリックすると、そのヘッダーの詳細とセキスペでの役割が表示されます。</code>
                    </div>
                </div>
            </div>

            <!-- Part 2: IKE Exchange Sequence -->
            <div class="card">
                <h3>🤝 IKE (Internet Key Exchange) 鍵交換シミュレーター</h3>
                <p class="card-subtitle">IPsec通信を確立する前に、暗号鍵や接続ポリシーを安全に交渉する IKE フェーズのステップを学びます。</p>
                
                <div class="form-group" style="width: 250px;">
                    <label for="ikeMode">IKE Phase 1 ネゴシエーションモード:</label>
                    <select id="ikeMode">
                        <option value="main" selected>メインモード (Main Mode - 推奨・ID暗号化)</option>
                        <option value="aggressive">アグレッシブモード (Aggressive Mode - 高速・ID露出)</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" id="btnRunIke" style="width: 200px; margin-top: 10px;">IKEシーケンス実行</button>
                
                <!-- Visualizer Container -->
                <div id="ikeVisualContainer" style="margin-top: 20px; padding: 20px; background: #0c0c10; border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; position: relative; min-height: 280px; overflow: hidden;">
                    <!-- Node Info Row -->
                    <div style="display: flex; justify-content: space-between; width: 100%; z-index: 10;">
                        <!-- Client -->
                        <div id="ikeNodeClient" style="text-align: center; width: 140px; padding: 12px; background: rgba(99, 102, 241, 0.1); border: 2px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-md); transition: all 0.3s ease;">
                            <div style="font-size: 28px;">💻</div>
                            <div style="font-weight: bold; font-size: 13px; margin-top: 4px; color: var(--text-primary);">Initiator (Client)</div>
                            <div id="ikeStateClient" style="font-size: 10px; color: var(--text-secondary); margin-top: 4px; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px;">OFFLINE</div>
                        </div>
                        
                        <!-- Mid details -->
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 0 10px;">
                            <span id="ikePhaseLabel" style="background: rgba(245, 158, 11, 0.1); color: var(--color-warning); border: 1px solid rgba(245, 158, 11, 0.3); padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; transition: all 0.3s ease;">準備完了</span>
                            <div id="ikeStatusText" style="color: var(--text-secondary); font-size: 11px; margin-top: 8px; text-align: center; max-width: 280px; min-height: 32px;">ボタンを押してシミュレーションを開始してください</div>
                        </div>
                        
                        <!-- Gateway -->
                        <div id="ikeNodeGateway" style="text-align: center; width: 140px; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); transition: all 0.3s ease;">
                            <div style="font-size: 28px;">🛡️</div>
                            <div style="font-weight: bold; font-size: 13px; margin-top: 4px; color: var(--text-primary);">Responder (GW)</div>
                            <div id="ikeStateGateway" style="font-size: 10px; color: var(--text-secondary); margin-top: 4px; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px;">OFFLINE</div>
                        </div>
                    </div>
                    
                    <!-- Diagram Space (where lines/arrows live) -->
                    <div style="position: relative; width: 100%; min-height: 270px; margin-top: 15px; border-radius: var(--radius-sm); background: rgba(0, 0, 0, 0.25); overflow: visible; border: 1px dashed rgba(255,255,255,0.05);">
                        <!-- Vertical Lifelines -->
                        <div style="position: absolute; left: 70px; top: 0; bottom: 0; width: 1px; border-left: 1px dashed rgba(99, 102, 241, 0.3); z-index: 1;"></div>
                        <div style="position: absolute; right: 70px; top: 0; bottom: 0; width: 1px; border-left: 1px dashed rgba(16, 185, 129, 0.3); z-index: 1;"></div>
                        
                        <!-- Arrow container -->
                        <div id="ikeArrowSpace" style="position: absolute; left: 70px; right: 70px; top: 0; bottom: 0; z-index: 2;">
                            <!-- Dynamically generated arrows and animated packets will fly here -->
                        </div>
                    </div>
                </div>
                
                <!-- IKE Packet Flow steps visualizer -->
                <div class="lab-grid-2" style="margin-top: 20px; gap: 20px;">
                    <div>
                        <label>IKE シーケンスログ:</label>
                        <div class="response-box" style="height: 240px; overflow-y: auto; background-color: #08080a;">
                            <code id="ikeSeqLog" style="font-size: 11px; color: #fbbf24;">「鍵交換シーケンス実行」を押すと通信ログが表示されます。</code>
                        </div>
                    </div>
                    
                    <div id="ikeExplanationCard" style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px; background: rgba(24, 24, 32, 0.4); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md);">
                        <span style="font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">💡 IKE (Internet Key Exchange) 試験攻略知識</span>
                        <p>
                            IPsecでは、通信を行う2者間でセキュリティ属性の合意（暗号方式や鍵など）である **SA (Security Association)** を結びます。この SA を動的に確立するためのプロトコルが **IKE** です。
                        </p>
                        <p>
                            <b>・IKE Phase 1</b>: 鍵交換に必要な安全な通信路自体を確立します。
                            <br>&nbsp;&nbsp;- *メインモード*: **6パケット**で交渉。対話が多く時間がかかりますが、接続元のID情報を暗号化して送信するため安全です。
                            <br>&nbsp;&nbsp;- *アグレッシブモード*: **3パケット**で交渉。パケット数が少なく高速ですが、ID情報を暗号化せず（平文で）送るため盗聴されるリスクがあります。
                        </p>
                        <p>
                            <b>・IKE Phase 2 (クイックモード)</b>: Phase 1で構築した安全な通信路の中で、実際のIPsec通信（データ送受用）に用いる SA を交渉します（**3パケット**）。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Reference Documents Links (Required by AGENTS.md) -->
            <div class="card" style="margin-top: 24px;">
                <h3>📚 参照元・公式仕様リファレンス</h3>
                <p class="card-subtitle">本モジュールの解説およびシミュレーションは、以下の信頼できる仕様書・情報源を参考に構築されています。</p>
                <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.6; font-size: 13px;">
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc4301" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 4301: Security Architecture for the Internet Protocol</a> - IPsecセキュリティアーキテクチャの基本仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc4302" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 4302: IP Authentication Header (AH)</a> - AH（送信元認証・完全性）の仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc4303" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 4303: IP Encapsulating Security Payload (ESP)</a> - ESP（暗号化＋完全性）の仕様。</li>
                    <li><a href="https://datatracker.ietf.org/doc/html/rfc7296" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); text-decoration: underline;">RFC 7296: Internet Key Exchange Protocol Version 2 (IKEv2)</a> - 鍵交換プロトコル IKEv2 の仕様。</li>
                </ul>
            </div>
        </div>
    `,

    init: function (app) {
        // Inject CSS for IKE animations
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes ikePulse {
                0% { box-shadow: 0 0 4px rgba(99, 102, 241, 0.4); transform: scale(1); }
                50% { box-shadow: 0 0 16px rgba(99, 102, 241, 0.8); transform: scale(1.03); }
                100% { box-shadow: 0 0 4px rgba(99, 102, 241, 0.4); transform: scale(1); }
            }
            @keyframes ikePulseGw {
                0% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); transform: scale(1); }
                50% { box-shadow: 0 0 16px rgba(16, 185, 129, 0.8); transform: scale(1.03); }
                100% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); transform: scale(1); }
            }
            .ike-node-active-client {
                animation: ikePulse 1.2s infinite;
                border-color: rgba(99, 102, 241, 1) !important;
                background: rgba(99, 102, 241, 0.25) !important;
            }
            .ike-node-active-gw {
                animation: ikePulseGw 1.2s infinite;
                border-color: rgba(16, 185, 129, 1) !important;
                background: rgba(16, 185, 129, 0.25) !important;
            }
            .ike-packet-dot {
                position: absolute;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                color: #fff;
                z-index: 10;
                margin-left: -12px; /* Center dot on lifeline */
                transition: left 0.8s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .ike-arrow-line {
                position: absolute;
                height: 1px;
                z-index: 5;
                transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .ike-system-event-card {
                position: absolute;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 4px 10px;
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid rgba(245, 158, 11, 0.5);
                border-radius: var(--radius-sm);
                font-size: 11px;
                font-weight: bold;
                color: #f59e0b;
                box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                z-index: 8;
                opacity: 0;
                animation: ikeFadeInUp 0.4s forwards;
            }
            @keyframes ikeFadeInUp {
                from { opacity: 0; transform: translate(-50%, -10%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
        `;
        document.head.appendChild(style);

        const ipsecMode = document.getElementById("ipsecMode");
        const ipsecProtocol = document.getElementById("ipsecProtocol");
        const ipsecPayload = document.getElementById("ipsecPayload");
        const ipsecPacketLayoutContainer = document.getElementById("ipsecPacketLayoutContainer");
        const ipsecHeaderDescText = document.getElementById("ipsecHeaderDescText");

        const ikeMode = document.getElementById("ikeMode");
        const btnRunIke = document.getElementById("btnRunIke");
        const ikeSeqLog = document.getElementById("ikeSeqLog");

        // --- 1. Packet visualizer handlers ---
        async function updatePacketVisual() {
            const mode = ipsecMode.value;
            const proto = ipsecProtocol.value;
            const payload = ipsecPayload.value.trim() || "GET /secret_data HTTP/1.1";

            try {
                const res = await app.apiCall("/api/ipsec/build", "POST", {
                    mode: mode,
                    protocol: proto,
                    payload: payload
                });

                // Render packet layout segments
                ipsecPacketLayoutContainer.innerHTML = "";

                res.new_packet.layout.forEach((segment, idx) => {
                    const block = document.createElement("div");

                    // Style depending on encryption/auth state
                    let bg = "var(--bg-card)";
                    let border = "var(--border-color)";
                    let color = "var(--text-primary)";
                    let shadow = "none";
                    let prefix = "";

                    if (segment.state.includes("ENCRYPTED")) {
                        bg = "rgba(239, 68, 68, 0.15)";
                        border = "rgba(239, 68, 68, 0.5)";
                        color = "#f87171";
                        prefix = "🔒 [暗号化] ";
                    } else if (segment.state.includes("AUTHENTICATED")) {
                        bg = "rgba(16, 185, 129, 0.15)";
                        border = "rgba(16, 185, 129, 0.5)";
                        color = "#34d399";
                        prefix = "🛡️ [認証保証] ";
                    } else { // Cleartext
                        bg = "rgba(99, 102, 241, 0.15)";
                        border = "rgba(99, 102, 241, 0.5)";
                        color = "#818cf8";
                        prefix = "📖 [平文] ";
                    }

                    block.style.backgroundColor = bg;
                    block.style.border = `1px solid ${border}`;
                    block.style.color = color;
                    block.style.padding = "10px 14px";
                    block.style.borderRadius = "var(--radius-sm)";
                    block.style.cursor = "pointer";
                    block.style.fontSize = "12px";
                    block.style.fontWeight = "bold";
                    block.style.flex = "1";
                    block.style.textAlign = "center";
                    block.style.minWidth = "110px";
                    block.style.transition = "var(--transition-fast)";

                    block.innerHTML = `
                        <div>${segment.name}</div>
                        <div style="font-size: 9px; font-weight: normal; margin-top: 4px; opacity: 0.8;">${segment.size}</div>
                    `;

                    block.addEventListener("click", () => {
                        // Highlight selection
                        ipsecPacketLayoutContainer.querySelectorAll("div").forEach(el => {
                            if (el.style) el.style.boxShadow = "none";
                        });
                        block.style.boxShadow = `0 0 10px ${border}`;

                        // Show description
                        ipsecHeaderDescText.innerHTML = `
                            <span style="color: ${color}; font-weight: bold;">${prefix}${segment.name} (${segment.size})</span>
                            <br><br>構造の特性: <b>${segment.state}</b>
                            <br>説明: ${segment.desc}
                        `;
                    });

                    ipsecPacketLayoutContainer.appendChild(block);
                });

                // Select first block by default
                if (ipsecPacketLayoutContainer.children.length > 0) {
                    ipsecPacketLayoutContainer.children[0].click();
                }

            } catch (err) {
                console.error(err);
            }
        }

        ipsecMode.addEventListener("change", updatePacketVisual);
        ipsecProtocol.addEventListener("change", updatePacketVisual);
        ipsecPayload.addEventListener("input", updatePacketVisual);

        // Initial build
        updatePacketVisual();

        // --- 2. IKE Simulator Handlers ---
        btnRunIke.addEventListener("click", () => {
            const mode = ikeMode.value;
            btnRunIke.disabled = true;
            ikeSeqLog.innerText = "IKE鍵ネゴシエーション中...";

            const timestamp = new Date().toLocaleTimeString();

            // Clear visual container
            const ikeArrowSpace = document.getElementById("ikeArrowSpace");
            ikeArrowSpace.innerHTML = "";

            // Reset Node States
            document.getElementById("ikeStateClient").innerText = "SA交渉開始";
            document.getElementById("ikeStateClient").style.color = "var(--text-primary)";
            document.getElementById("ikeStateGateway").innerText = "SA交渉開始";
            document.getElementById("ikeStateGateway").style.color = "var(--text-primary)";

            const ikePhaseLabel = document.getElementById("ikePhaseLabel");
            const ikeStatusText = document.getElementById("ikeStatusText");

            ikePhaseLabel.innerText = "Phase 1 開始";
            ikePhaseLabel.style.background = "rgba(245, 158, 11, 0.15)";
            ikePhaseLabel.style.color = "var(--color-warning)";
            ikePhaseLabel.style.borderColor = "rgba(245, 158, 11, 0.4)";
            ikeStatusText.innerText = "IKEネゴシエーションが開始されました...";

            let steps = [];

            if (mode === "main") {
                steps = [
                    {
                        type: "log",
                        text: `[${timestamp}] --- IKE Phase 1: メインモード開始 (計6パケット) ---`,
                        phase: "Phase 1: 交渉開始"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: false,
                        name: "Packet 1: SA提案",
                        desc: "暗号化ポリシー提示 (暗号規格、ハッシュ、DH群)",
                        log: `Packet 1: [Client -> Host] 暗号化ポリシー提示 (暗号規格、ハッシュ、DH群)`,
                        clientState: "ポリシー送信完了",
                        gwState: "ポリシー評価中"
                    },
                    {
                        type: "packet",
                        fromClient: false,
                        encrypted: false,
                        name: "Packet 2: SA提案合意",
                        desc: "ポリシー合意の返却",
                        log: `Packet 2: [Host -> Client] ポリシー合意の返却`,
                        clientState: "ポリシー合意済",
                        gwState: "ポリシー合意送信"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: false,
                        name: "Packet 3: 鍵交換値(Ke)",
                        desc: "DH公開値送信 + 一時値Nonce (鍵交換に必要な値を送付)",
                        log: `Packet 3: [Client -> Host] DH公開値送信 + 一時値Nonce (鍵交換に必要な値を送付)`,
                        clientState: "DH公開値送信完了",
                        gwState: "DH計算開始"
                    },
                    {
                        type: "packet",
                        fromClient: false,
                        encrypted: false,
                        name: "Packet 4: 鍵交換値(Ke)",
                        desc: "DH公開値送信 + 一時値Nonce (共有秘密の算出が可能に)",
                        log: `Packet 4: [Host -> Client] DH公開値送信 + 一時値Nonce (共有秘密の算出が可能に)`,
                        clientState: "DH公開値受信",
                        gwState: "DH公開値送信完了"
                    },
                    {
                        type: "system",
                        icon: "🔒",
                        desc: "DH鍵交換計算 & 共通鍵生成",
                        log: `🔒 [System] 両者でDH計算を行い、共通の「暗号化キー」を生成しました（以降のパケットは暗号化されます）`,
                        clientState: "🔒 共通鍵生成完了",
                        gwState: "🔒 共通鍵生成完了",
                        phase: "Phase 1: 暗号化開始"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: true,
                        name: "Packet 5: ID/認証情報 (🔒)",
                        desc: "自身のID (証明書やPSK) + 署名 (暗号化されて送信)",
                        log: `Packet 5 (Encrypted): [Client -> Host] 自身のID (証明書やPSK) + 署名`,
                        clientState: "ID送信(暗号化)",
                        gwState: "対向ID認証中"
                    },
                    {
                        type: "packet",
                        fromClient: false,
                        encrypted: true,
                        name: "Packet 6: ID/認証情報 (🔒)",
                        desc: "自身のID + 署名 (相互認証の完了)",
                        log: `Packet 6 (Encrypted): [Host -> Client] 自身のID + 署名 (相互認証の完了)`,
                        clientState: "相互認証成功",
                        gwState: "ID送信(暗号化)"
                    },
                    {
                        type: "system",
                        icon: "🟢",
                        desc: "ISAKMP SA 確立 (Phase 1 完了)",
                        log: `🟢 --- IKE Phase 1 完了: ISAKMP SA 確立 ---`,
                        clientState: "ISAKMP SA 確立",
                        gwState: "ISAKMP SA 確立",
                        phase: "Phase 1: 完了"
                    },
                    {
                        type: "log",
                        text: `\n[${timestamp}] --- IKE Phase 2: クイックモード開始 (計3パケット) ---`,
                        phase: "Phase 2: 交渉開始"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: true,
                        name: "Packet 7: IPsec SA提案 (🔒)",
                        desc: "IPsec SA用のポリシー提示 + 新しいNonce",
                        log: `Packet 1 (Encrypted): [Client -> Host] IPsec SA用のポリシー提示 + 新しいNonce`,
                        clientState: "IPsec SA 提案中",
                        gwState: "IPsecポリシー検証"
                    },
                    {
                        type: "packet",
                        fromClient: false,
                        encrypted: true,
                        name: "Packet 8: IPsec SA合意 (🔒)",
                        desc: "IPsec SA用ポリシー合意",
                        log: `Packet 2 (Encrypted): [Host -> Client] IPsec SA用ポリシー合意`,
                        clientState: "IPsec SA 合意受信",
                        gwState: "IPsec SA 合意送信"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: true,
                        name: "Packet 9: ACK応答 (🔒)",
                        desc: "応答確認 (ACK) の送信",
                        log: `Packet 3 (Encrypted): [Client -> Host] 応答確認 (ACK)`,
                        clientState: "通信確立 (IPsec SA)",
                        gwState: "通信確立 (IPsec SA)"
                    },
                    {
                        type: "system",
                        icon: "🟢",
                        desc: "ESP/AH SA 確立 (Phase 2 完了)",
                        log: `🟢 --- IKE Phase 2 完了: ESP/AH SA 確立 (データ通信路の準備完了) ---`,
                        clientState: "ESP/AH SA 確立",
                        gwState: "ESP/AH SA 確立",
                        phase: "Phase 2: 完了"
                    }
                ];
            } else {
                steps = [
                    {
                        type: "log",
                        text: `[${timestamp}] --- IKE Phase 1: アグレッシブモード開始 (計3パケット) ---`,
                        phase: "Phase 1: 交渉開始"
                    },
                    {
                        type: "log",
                        text: `⚠️ 警告: IDが暗号化されないまま送信されます！`,
                        phase: "⚠️ ID漏洩リスクあり"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: false,
                        warning: true,
                        name: "Packet 1: 提案+鍵公開値+ID",
                        desc: "暗号ポリシー提示 + DH公開値 + Nonce + ユーザーID (IDが平文で露出！)",
                        log: `Packet 1: [Client -> Host] 暗号ポリシー提示 + DH公開値 + 一時値Nonce + ユーザーID (ID露出！)`,
                        clientState: "提案・ID送信(平文)",
                        gwState: "ID受信・解析中"
                    },
                    {
                        type: "packet",
                        fromClient: false,
                        encrypted: false,
                        name: "Packet 2: 合意+鍵公開値+ID+認証",
                        desc: "ポリシー合意 + DH公開値 + Nonce + ホストID + 認証証明 (平文送信)",
                        log: `Packet 2: [Host -> Client] ポリシー合意 + DH公開値 + 一時値Nonce + ホストID + 認証証明`,
                        clientState: "DH値・認証受信",
                        gwState: "ポリシー・認証送信"
                    },
                    {
                        type: "system",
                        icon: "🔒",
                        desc: "DH鍵交換計算 & 共通鍵生成",
                        log: `🔒 [System] 両者で暗号化キーを生成しました`,
                        clientState: "🔒 共通鍵生成完了",
                        gwState: "🔒 共通鍵生成完了",
                        phase: "Phase 1: 暗号化開始"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: true,
                        name: "Packet 3: 認証情報 (🔒)",
                        desc: "クライアントの認証情報を暗号化して送信",
                        log: `Packet 3 (Encrypted): [Client -> Host] クライアントの認証証明`,
                        clientState: "相互認証成功",
                        gwState: "相互認証成功"
                    },
                    {
                        type: "system",
                        icon: "🟢",
                        desc: "ISAKMP SA 確立 (Phase 1 完了)",
                        log: `🟢 --- IKE Phase 1 完了: ISAKMP SA 確立 (高速完了) ---`,
                        clientState: "ISAKMP SA 確立",
                        gwState: "ISAKMP SA 確立",
                        phase: "Phase 1: 完了"
                    },
                    {
                        type: "log",
                        text: `\n[${timestamp}] --- IKE Phase 2: クイックモード開始 (計3パケット) ---`,
                        phase: "Phase 2: 交渉開始"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: true,
                        name: "Packet 4: IPsec SA提案 (🔒)",
                        desc: "IPsec SA用のポリシー提示 + 新しいNonce",
                        log: `Packet 1 (Encrypted): [Client -> Host] IPsec SA用のポリシー提示 + 新しいNonce`,
                        clientState: "IPsec SA 提案中",
                        gwState: "IPsecポリシー検証"
                    },
                    {
                        type: "packet",
                        fromClient: false,
                        encrypted: true,
                        name: "Packet 5: IPsec SA合意 (🔒)",
                        desc: "IPsec SA用ポリシー合意",
                        log: `Packet 2 (Encrypted): [Host -> Client] IPsec SA用ポリシー合意`,
                        clientState: "IPsec SA 合意受信",
                        gwState: "IPsec SA 合意送信"
                    },
                    {
                        type: "packet",
                        fromClient: true,
                        encrypted: true,
                        name: "Packet 6: ACK応答 (🔒)",
                        desc: "応答確認 (ACK) の送信",
                        log: `Packet 3 (Encrypted): [Client -> Host] 応答確認 (ACK)`,
                        clientState: "通信確立 (IPsec SA)",
                        gwState: "通信確立 (IPsec SA)"
                    },
                    {
                        type: "system",
                        icon: "🟢",
                        desc: "ESP/AH SA 確立 (Phase 2 完了)",
                        log: `🟢 --- IKE Phase 2 完了: ESP/AH SA 確立 (データ通信路の準備完了) ---`,
                        clientState: "ESP/AH SA 確立",
                        gwState: "ESP/AH SA 確立",
                        phase: "Phase 2: 完了"
                    }
                ];
            }

            // Render logs step-by-step
            ikeSeqLog.innerText = "";
            let logIdx = 0;
            let visibleStepIndex = 0;

            const printLog = () => {
                if (logIdx >= steps.length) {
                    btnRunIke.disabled = false;
                    app.log('system', `IKE Phase 1 & 2 鍵交換シミュレーション完了 (${mode === "main" ? "メインモード" : "アグレッシブモード"})`);

                    // Update header final style
                    ikePhaseLabel.innerText = "接続完了 (IPsec SA確立)";
                    ikePhaseLabel.style.background = "rgba(16, 185, 129, 0.15)";
                    ikePhaseLabel.style.color = "var(--color-success)";
                    ikePhaseLabel.style.borderColor = "rgba(16, 185, 129, 0.4)";

                    // Mark states as green
                    document.getElementById("ikeStateClient").style.color = "var(--color-success)";
                    document.getElementById("ikeStateGateway").style.color = "var(--color-success)";
                    return;
                }

                const step = steps[logIdx];

                if (step.type === "log") {
                    ikeSeqLog.innerText += step.text + "\n";
                    if (step.phase) {
                        ikePhaseLabel.innerText = step.phase;
                        if (step.phase.includes("Phase 1")) {
                            ikePhaseLabel.style.background = "rgba(245, 158, 11, 0.15)";
                            ikePhaseLabel.style.color = "var(--color-warning)";
                            ikePhaseLabel.style.borderColor = "rgba(245, 158, 11, 0.4)";
                        } else if (step.phase.includes("Phase 2")) {
                            ikePhaseLabel.style.background = "rgba(99, 102, 241, 0.15)";
                            ikePhaseLabel.style.color = "var(--color-primary-hover)";
                            ikePhaseLabel.style.borderColor = "rgba(99, 102, 241, 0.4)";
                        } else {
                            // Warning
                            ikePhaseLabel.style.background = "rgba(239, 68, 68, 0.15)";
                            ikePhaseLabel.style.color = "var(--color-danger)";
                            ikePhaseLabel.style.borderColor = "rgba(239, 68, 68, 0.4)";
                        }
                    }

                    const box = ikeSeqLog.parentElement;
                    box.scrollTop = box.scrollHeight;

                    logIdx++;
                    // Immediately process the next step for log-only lines
                    printLog();
                } else if (step.type === "packet") {
                    // Line Row (increased spacing for visibility)
                    const topOffset = 12 + visibleStepIndex * 26;
                    visibleStepIndex++;

                    const row = document.createElement("div");
                    row.style.position = "absolute";
                    row.style.left = "0";
                    row.style.right = "0";
                    row.style.top = `${topOffset}px`;
                    row.style.height = "20px";

                    // Line
                    const line = document.createElement("div");
                    line.className = "ike-arrow-line";
                    line.style.top = "9px";
                    line.style.borderTop = step.encrypted
                        ? "1px dashed rgba(239, 68, 68, 0.4)"
                        : step.warning
                            ? "1px dashed rgba(245, 158, 11, 0.5)"
                            : "1px dashed rgba(99, 102, 241, 0.4)";
                    line.style.width = "0%";

                    // Label (increased font size for readability)
                    const label = document.createElement("div");
                    label.innerText = step.name;
                    label.style.position = "absolute";
                    label.style.top = "-14px";
                    if (step.fromClient) {
                        label.style.left = "15px";
                        label.style.textAlign = "left";
                    } else {
                        label.style.right = "15px";
                        label.style.textAlign = "right";
                    }
                    label.style.fontSize = "12px";
                    label.style.fontWeight = "bold";
                    label.style.color = step.encrypted ? "#f87171" : step.warning ? "#fbbf24" : "#818cf8";
                    label.style.opacity = "0";
                    label.style.transition = "opacity 0.3s ease";

                    // Arrowhead
                    const head = document.createElement("div");
                    head.style.position = "absolute";
                    head.style.top = "-7px";
                    head.style.fontSize = "12px";
                    head.style.color = step.encrypted ? "#f87171" : step.warning ? "#fbbf24" : "#818cf8";
                    head.style.opacity = "0";

                    if (step.fromClient) {
                        line.style.left = "0";
                        head.innerText = "▶";
                        head.style.right = "-4px";
                    } else {
                        line.style.right = "0";
                        head.innerText = "◀";
                        head.style.left = "-4px";
                    }

                    line.appendChild(head);
                    row.appendChild(line);
                    row.appendChild(label);
                    ikeArrowSpace.appendChild(row);

                    // Packet Dot
                    const dot = document.createElement("div");
                    dot.className = "ike-packet-dot";
                    dot.style.top = "-3px";

                    if (step.encrypted) {
                        dot.style.background = "linear-gradient(90deg, #ef4444, #f97316)";
                        dot.style.boxShadow = "0 0 8px rgba(239, 68, 68, 0.6)";
                        dot.innerHTML = "🔒";
                    } else if (step.warning) {
                        dot.style.background = "linear-gradient(90deg, #f59e0b, #eab308)";
                        dot.style.boxShadow = "0 0 8px rgba(245, 158, 11, 0.7)";
                        dot.innerHTML = "⚠️";
                    } else {
                        dot.style.background = "linear-gradient(90deg, #6366f1, #a855f7)";
                        dot.style.boxShadow = "0 0 8px rgba(99, 102, 241, 0.6)";
                        dot.innerHTML = "✉️";
                    }

                    if (step.fromClient) {
                        dot.style.left = "0%";
                    } else {
                        dot.style.left = "100%";
                    }

                    row.appendChild(dot);

                    // Animate packet and line
                    requestAnimationFrame(() => {
                        label.style.opacity = "0.75";
                        line.style.width = "100%";
                        if (step.fromClient) {
                            dot.style.left = "100%";
                        } else {
                            dot.style.left = "0%";
                        }
                    });

                    // Active sender highlight
                    if (step.fromClient) {
                        document.getElementById("ikeNodeClient").classList.add("ike-node-active-client");
                    } else {
                        document.getElementById("ikeNodeGateway").classList.add("ike-node-active-gw");
                    }

                    // Status text update
                    ikeStatusText.innerHTML = `<span style="font-weight:bold; color:${step.encrypted ? '#f87171' : step.warning ? '#fbbf24' : '#818cf8'}">${step.name}:</span> ${step.desc}`;

                    setTimeout(() => {
                        // Packet arrived
                        dot.remove();
                        head.style.opacity = "1";

                        // Clear active sender
                        document.getElementById("ikeNodeClient").classList.remove("ike-node-active-client");
                        document.getElementById("ikeNodeGateway").classList.remove("ike-node-active-gw");

                        // Active receiver pulse
                        const recNodeId = step.fromClient ? "ikeNodeGateway" : "ikeNodeClient";
                        const recClass = step.fromClient ? "ike-node-active-gw" : "ike-node-active-client";
                        const recNode = document.getElementById(recNodeId);
                        recNode.classList.add(recClass);

                        // State updates
                        if (step.clientState) {
                            document.getElementById("ikeStateClient").innerText = step.clientState;
                        }
                        if (step.gwState) {
                            document.getElementById("ikeStateGateway").innerText = step.gwState;
                        }

                        // Log output
                        ikeSeqLog.innerText += step.log + "\n";
                        const box = ikeSeqLog.parentElement;
                        box.scrollTop = box.scrollHeight;

                        setTimeout(() => {
                            recNode.classList.remove(recClass);
                            logIdx++;
                            printLog();
                        }, 300);

                    }, 800);

                } else if (step.type === "system") {
                    const topOffset = 12 + visibleStepIndex * 26;
                    visibleStepIndex++;

                    const card = document.createElement("div");
                    card.className = "ike-system-event-card";
                    card.style.top = `${topOffset + 10}px`;
                    card.innerHTML = `${step.icon} ${step.desc}`;

                    ikeArrowSpace.appendChild(card);

                    // Update States
                    if (step.clientState) {
                        document.getElementById("ikeStateClient").innerText = step.clientState;
                    }
                    if (step.gwState) {
                        document.getElementById("ikeStateGateway").innerText = step.gwState;
                    }

                    if (step.phase) {
                        ikePhaseLabel.innerText = step.phase;
                    }

                    // Pulse both nodes
                    document.getElementById("ikeNodeClient").style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
                    document.getElementById("ikeNodeGateway").style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";

                    ikeSeqLog.innerText += step.log + "\n";
                    const box = ikeSeqLog.parentElement;
                    box.scrollTop = box.scrollHeight;

                    setTimeout(() => {
                        document.getElementById("ikeNodeClient").style.boxShadow = "none";
                        document.getElementById("ikeNodeGateway").style.boxShadow = "none";
                        logIdx++;
                        printLog();
                    }, 1000);
                }
            };

            printLog();
        });
    }
};
