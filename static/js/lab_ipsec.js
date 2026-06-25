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
                
                <button class="btn btn-primary" id="btnRunIke" style="width: 200px; margin-top: 10px;">IKE鍵交換シーケンス実行</button>
                
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
        </div>
    `,
    
    init: function(app) {
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
                        prefix = "📖 [明文] ";
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
            let logs = [];
            
            if (mode === "main") {
                logs = [
                    `[${timestamp}] --- IKE Phase 1: メインモード開始 (計6パケット) ---`,
                    `Packet 1: [Client -> Host] 暗号化ポリシー提示 (暗号規格、ハッシュ、DH群)`,
                    `Packet 2: [Host -> Client] ポリシー合意の返却`,
                    `Packet 3: [Client -> Host] DH公開値送信 + 一時値Nonce (鍵交換に必要な値を送付)`,
                    `Packet 4: [Host -> Client] DH公開値送信 + 一時値Nonce (共有秘密の算出が可能に)`,
                    `🔒 [System] 両者でDH計算を行い、共通の「暗号化キー」を生成しました（以降のパケットは暗号化されます）`,
                    `Packet 5 (Encrypted): [Client -> Host] 自身のID (証明書やPSK) + 署名`,
                    `Packet 6 (Encrypted): [Host -> Client] 自身のID + 署名 (相互認証の完了)`,
                    `🟢 --- IKE Phase 1 完了: ISAKMP SA 確立 ---`,
                    `\n[${timestamp}] --- IKE Phase 2: クイックモード開始 (計3パケット) ---`,
                    `Packet 1 (Encrypted): [Client -> Host] IPsec SA用のポリシー提示 + 新しいNonce`,
                    `Packet 2 (Encrypted): [Host -> Client] IPsec SA用ポリシー合意`,
                    `Packet 3 (Encrypted): [Client -> Host] 応答確認 (ACK)`,
                    `🟢 --- IKE Phase 2 完了: ESP/AH SA 確立 (データ通信路の準備完了) ---`
                ];
            } else {
                logs = [
                    `[${timestamp}] --- IKE Phase 1: アグレッシブモード開始 (計3パケット) ---`,
                    `⚠️ 警告: IDが暗号化されないまま送信されます！`,
                    `Packet 1: [Client -> Host] 暗号ポリシー提示 + DH公開値 + 一時値Nonce + ユーザーID (ID露出！)`,
                    `Packet 2: [Host -> Client] ポリシー合意 + DH公開値 + 一時値Nonce + ホストID + 認証証明`,
                    `🔒 [System] 両者で暗号化キーを生成しました`,
                    `Packet 3 (Encrypted): [Client -> Host] クライアントの認証証明`,
                    `🟢 --- IKE Phase 1 完了: ISAKMP SA 確立 (高速完了) ---`,
                    `\n[${timestamp}] --- IKE Phase 2: クイックモード開始 (計3パケット) ---`,
                    `Packet 1 (Encrypted): [Client -> Host] IPsec SA用のポリシー提示 + 新しいNonce`,
                    `Packet 2 (Encrypted): [Host -> Client] IPsec SA用ポリシー合意`,
                    `Packet 3 (Encrypted): [Client -> Host] 応答確認 (ACK)`,
                    `🟢 --- IKE Phase 2 完了: ESP/AH SA 確立 (データ通信路の準備完了) ---`
                ];
            }
            
            // Render logs step-by-step
            ikeSeqLog.innerText = "";
            let logIdx = 0;
            
            const printLog = () => {
                if (logIdx >= logs.length) {
                    btnRunIke.disabled = false;
                    app.log('system', `IKE Phase 1 & 2 鍵交換シミュレーション完了 (${mode === "main" ? "メインモード": "アグレッシブモード"})`);
                    return;
                }
                
                ikeSeqLog.innerText += logs[logIdx] + "\n";
                // Auto scroll
                const box = document.getElementById("ikeSeqLog").parentElement;
                box.scrollTop = box.scrollHeight;
                
                logIdx++;
                setTimeout(printLog, mode === "main" ? 300 : 500);
            };
            
            printLog();
        });
    }
};
