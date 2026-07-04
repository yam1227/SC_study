/**
 * Module 10: IPsec SA & Wide-Area VPNs Lab
 */
window.SecurityLabModules["vpn_types"] = {
    html: `
        <div class="lab-container">
            <!-- Part 1: IPsec SA (Security Association) Simulator -->
            <div class="card">
                <h3>🔑 IPsec SA (Security Association) 確立・転送シミュレーター</h3>
                <p class="card-subtitle">IPsec VPNの核となる「SA（セキュリティアソシエーション）」の確立プロセスと、送信・受信で独立するSAの方向性、およびSPI（Security Parameter Index）によるパケット識前の仕組みを体験学習します。</p>
                
                <div class="lab-grid-3" style="grid-template-columns: 1.2fr 1fr 1fr; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; gap: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 10px; justify-content: flex-end;">
                        <label style="font-weight: bold; color: var(--text-primary);">🔌 VPNトンネル構築ステップ:</label>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary" id="btnIkePhase1" style="flex: 1; font-size: 11px; padding: 8px;">1. IKE Phase 1 (IKE SA)</button>
                            <button class="btn btn-primary" id="btnIkePhase2" style="flex: 1; font-size: 11px; padding: 8px;" disabled>2. IKE Phase 2 (IPsec SA)</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="saPayloadText">送信データ:</label>
                        <input type="text" id="saPayloadText" value="CONFIDENTIAL_SALES_REPORT" placeholder="暗号化するデータ" style="width: 100%;">
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <button class="btn btn-secondary" id="btnSendSaPacket" style="width: 100%; border-color: rgba(16, 185, 129, 0.4);" disabled>🔒 暗号パケット送信テスト</button>
                    </div>
                </div>

                <div class="lab-grid-2" style="margin-top: 20px; gap: 20px;">
                    <!-- Left: SA Table & Diagram -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-weight: bold; color: var(--text-primary);">📊 確立された SA テーブル</label>
                            <button class="btn" id="btnClearSa" style="font-size: 10px; padding: 2px 8px; background: transparent; border: 1px solid var(--border-color);">SAのクリア</button>
                        </div>
                        <table class="sa-table">
                            <thead>
                                <tr>
                                    <th>SA名 (プロトコル)</th>
                                    <th>方向</th>
                                    <th>SPI値 (識別子)</th>
                                    <th>状態</th>
                                </tr>
                            </thead>
                            <tbody id="saTableBody">
                                <tr>
                                    <td>IKE SA (ISAKMP)</td>
                                    <td>双方向 (1本)</td>
                                    <td id="ikeSaSpi">-</td>
                                    <td id="ikeSaStatus" class="sa-status-inactive">未確立</td>
                                </tr>
                                <tr>
                                    <td>IPsec SA (ESP - 送信)</td>
                                    <td>拠点A → 拠点B</td>
                                    <td id="ipsecOutSpi">-</td>
                                    <td id="ipsecOutStatus" class="sa-status-inactive">未確立</td>
                                </tr>
                                <tr>
                                    <td>IPsec SA (ESP - 受信)</td>
                                    <td>拠点B → 拠点A</td>
                                    <td id="ipsecInSpi">-</td>
                                    <td id="ipsecInStatus" class="sa-status-inactive">未確立</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="sa-diagram-container">
                            <span style="font-weight: bold; font-size: 11px; color: var(--text-secondary);">🌐 拠点A・B間の SA トンネル構成図</span>
                            <div class="sa-box" id="ikeSaBox" style="opacity: 0.3;">
                                <span>IKE SA (制御用チャネル)</span>
                                <span id="ikeSaBoxLabel">未確立</span>
                            </div>
                            <div class="sa-box" id="ipsecOutSaBox" style="opacity: 0.3;">
                                <span>IPsec SA (送信チャネル: 拠点A → B)</span>
                                <span id="ipsecOutSaBoxLabel">未確立</span>
                            </div>
                            <div class="sa-box" id="ipsecInSaBox" style="opacity: 0.3;">
                                <span>IPsec SA (受信チャネル: 拠点B → A)</span>
                                <span id="ipsecInSaBoxLabel">未確立</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Theoretical points & Console -->
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div style="background: rgba(99,102,241,0.03); border: 1px dashed rgba(99,102,241,0.25); padding: 14px; border-radius: var(--radius-md); font-size: 12px; line-height: 1.5; color: var(--text-secondary);">
                            <span style="font-weight: bold; color: var(--color-primary-hover); font-size: 13px; display: block; margin-bottom: 6px;">💡 セキスペ試験対策知識 (SAの性質)</span>
                            <ul style="margin: 0; padding-left: 16px;">
                                <li><b>IKE SA</b>: 鍵交換など制御用の安全な通り道。<b>双方向で1本</b>確立されます。</li>
                                <li><b>IPsec SA</b>: 実際のデータを暗号化して通す道。<b>片方向で1本</b>（送信用・受信用で独立）となるため、双方向でデータを送受信するには<b>最低2本</b>必要です。</li>
                                <li><b>SPI (Security Parameter Index)</b>: 暗号パケットのESPヘッダー等に含まれる32bitの値。受信側ルーターが「どのSAを適用して復号すればいいか」を一意に特定するために使われます。</li>
                            </ul>
                        </div>

                        <div class="form-group" style="margin: 0; flex: 1; display: flex; flex-direction: column;">
                            <label>SA 制御・転送プロセスログ:</label>
                            <div class="response-box" style="flex: 1; min-height: 160px; max-height: 220px; overflow-y: auto; background-color: #0c0a09; border-color: rgba(99,102,241,0.3);">
                                <code id="saSimLogText" style="font-size: 11px; color: #fbbf24; white-space: pre-wrap;">「IKE Phase 1」ボタンを押して、SAの確立シーケンスを開始してください。</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Part 2: Wide-Area Network VPN Comparison -->
            <div class="card" style="margin-top: 24px;">
                <h3>🌐 広域ネットワークVPN（キャリア網 vs インターネット）比較ツール</h3>
                <p class="card-subtitle">本拠地と拠点を結ぶ広域ネットワーク構築において、セキスペで最重要となる「インターネットVPN」「IP-VPN」「広域イーサネット」の仕組みと特徴を比較します。</p>
                
                <div style="display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button class="btn btn-secondary vpn-arch-btn active" data-arch="internet_vpn">💻 インターネットVPN</button>
                    <button class="btn btn-secondary vpn-arch-btn" data-arch="ip_vpn">🛢️ IP-VPN (MPLS閉域網)</button>
                    <button class="btn btn-secondary vpn-arch-btn" data-arch="wide_ether">🔗 広域イーサネット (L2閉域網)</button>
                </div>
                
                <!-- Dynamic Network Diagram -->
                <div style="background-color: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; position: relative; overflow: hidden; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; max-width: 600px; margin: 0 auto; z-index: 2; position: relative;">
                        <!-- Tokyo Office -->
                        <div style="text-align: center; width: 100px;">
                            <div style="font-size: 32px;">🏢</div>
                            <div style="font-size: 11px; font-weight: bold; margin-top: 4px; color: var(--text-primary);">東京本社</div>
                            <div style="font-size: 10px; color: var(--text-secondary);">192.168.1.0/24</div>
                        </div>
                        
                        <!-- Connecting Network Cloud -->
                        <div style="flex-grow: 1; text-align: center; position: relative; margin: 0 20px; min-height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                            <!-- Connection Line -->
                            <div style="position: absolute; top: 50%; left: 0; right: 0; height: 3px; background-color: var(--border-color); z-index: -1;" id="vpnDiagramLine"></div>
                            <!-- Encapsulated Packet Indicator -->
                            <div style="position: absolute; top: 38%; left: 20%; font-size: 11px; padding: 3px 8px; border-radius: 20px; background-color: var(--primary-color); color: white; display: none;" id="vpnPacketIndicator">IPsec ESP Packet</div>
                            
                            <!-- Network Cloud Graphic -->
                            <div style="font-size: 40px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" id="vpnCloudIcon">🌐</div>
                            <div style="font-size: 12px; font-weight: bold; margin-top: 4px; color: var(--primary-light);" id="vpnCloudLabel">公衆インターネット</div>
                        </div>
                        
                        <!-- Osaka Branch -->
                        <div style="text-align: center; width: 100px;">
                            <div style="font-size: 32px;">🏬</div>
                            <div style="font-size: 11px; font-weight: bold; margin-top: 4px; color: var(--text-primary);">大阪支店</div>
                            <div style="font-size: 10px; color: var(--text-secondary);">192.168.2.0/24</div>
                        </div>
                    </div>
                </div>
                
                <!-- Detailed Table / Features -->
                <div class="lab-grid-2" style="gap: 20px;">
                    <div>
                        <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-primary);">📊 技術的仕様・比較結果</h4>
                        <table class="lab-table" style="width: 100%; font-size: 12px; border-collapse: collapse; text-align: left;">
                            <tbody>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 8px 0; color: var(--text-secondary); width: 35%;">使用回線・網</th>
                                    <td style="padding: 8px 0;" id="tdVpnNetType">-</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 8px 0; color: var(--text-secondary);">カプセル化階層 (L2/L3)</th>
                                    <td style="padding: 8px 0;" id="tdVpnLayer">-</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 8px 0; color: var(--text-secondary);">セキュリティ方式</th>
                                    <td style="padding: 8px 0;" id="tdVpnSec">-</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 8px 0; color: var(--text-secondary);">拠点側暗号化の要否</th>
                                    <td style="padding: 8px 0;" id="tdVpnEncryptReq">-</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 8px 0; color: var(--text-secondary);">コスト ＆ 帯域保証</th>
                                    <td style="padding: 8px 0;" id="tdVpnCost">-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Exam Key Points -->
                    <div id="vpnArchExplainBox" style="background: rgba(24, 24, 32, 0.4); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                        <span style="font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 6px; display: block; margin-bottom: 8px;">💡 広域ネットワークVPN 試験攻略の鍵</span>
                        <div id="vpnArchExplainText">
                            上記ボタンをクリックすると、それぞれのVPN規格における試験対策上の必須知識と暗記ポイントがここに表示されます。
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        // --- Part 1: IPsec SA Simulator Logic ---
        const btnIkePhase1 = document.getElementById("btnIkePhase1");
        const btnIkePhase2 = document.getElementById("btnIkePhase2");
        const btnSendSaPacket = document.getElementById("btnSendSaPacket");
        const btnClearSa = document.getElementById("btnClearSa");
        
        const ikeSaSpi = document.getElementById("ikeSaSpi");
        const ikeSaStatus = document.getElementById("ikeSaStatus");
        const ipsecOutSpi = document.getElementById("ipsecOutSpi");
        const ipsecOutStatus = document.getElementById("ipsecOutStatus");
        const ipsecInSpi = document.getElementById("ipsecInSpi");
        const ipsecInStatus = document.getElementById("ipsecInStatus");
        
        const ikeSaBox = document.getElementById("ikeSaBox");
        const ikeSaBoxLabel = document.getElementById("ikeSaBoxLabel");
        const ipsecOutSaBox = document.getElementById("ipsecOutSaBox");
        const ipsecOutSaBoxLabel = document.getElementById("ipsecOutSaBoxLabel");
        const ipsecInSaBox = document.getElementById("ipsecInSaBox");
        const ipsecInSaBoxLabel = document.getElementById("ipsecInSaBoxLabel");
        
        const saPayloadText = document.getElementById("saPayloadText");
        const saSimLogText = document.getElementById("saSimLogText");
        
        let hasIkeSa = false;
        let hasIpsecSa = false;
        
        let spiIke = "";
        let spiOut = "";
        let spiIn = "";

        function logToSaConsole(message, type = "normal") {
            let color = "#fbbf24"; // default warning-ish yellow
            if (type === "system") color = "#a78bfa"; // purple
            if (type === "success") color = "#34d399"; // green
            if (type === "info") color = "#60a5fa"; // blue
            if (type === "error") color = "#f87171"; // red
            
            saSimLogText.innerHTML += `<span style="color: ${color};">${message}</span>\n`;
            saSimLogText.parentElement.scrollTop = saSimLogText.parentElement.scrollHeight;
        }

        // IKE Phase 1 button click
        btnIkePhase1.addEventListener("click", () => {
            logToSaConsole(">> IKE Phase 1 ネゴシエーションを開始します...", "info");
            btnIkePhase1.disabled = true;
            
            setTimeout(() => {
                // Generate a random SPI for IKE SA
                spiIke = "0x" + Math.floor(Math.random() * 0xFFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
                hasIkeSa = true;
                
                // Update Table
                ikeSaSpi.innerText = spiIke;
                ikeSaStatus.innerText = "確立 (Active)";
                ikeSaStatus.className = "sa-status-active";
                
                // Update Diagram
                ikeSaBox.style.opacity = "1";
                ikeSaBox.classList.add("ike");
                ikeSaBoxLabel.innerText = `Active (SPI: ${spiIke})`;
                
                logToSaConsole(`[IKE] Phase 1 鍵交換に成功し、制御用トンネル（IKE SA）を構築しました。`, "success");
                logToSaConsole(`[IKE SA] 双方向で1本を共有。SPI: ${spiIke}`, "system");
                logToSaConsole(`>> 次に「2. IKE Phase 2 (IPsec SA)」を実行してください。`, "info");
                
                btnIkePhase2.disabled = false;
            }, 800);
        });

        // IKE Phase 2 button click
        btnIkePhase2.addEventListener("click", () => {
            logToSaConsole(">> IKE Phase 2 (クイックモード) ネゴシエーションを開始します...", "info");
            btnIkePhase2.disabled = true;
            
            setTimeout(() => {
                // Generate random SPIs for send/receive IPsec SAs
                spiOut = "0x" + Math.floor(Math.random() * 0xFFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
                spiIn = "0x" + Math.floor(Math.random() * 0xFFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
                while (spiIn === spiOut) {
                    spiIn = "0x" + Math.floor(Math.random() * 0xFFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
                }
                hasIpsecSa = true;
                
                // Update Table
                ipsecOutSpi.innerText = spiOut;
                ipsecOutStatus.innerText = "確立 (Active)";
                ipsecOutStatus.className = "sa-status-active";
                
                ipsecInSpi.innerText = spiIn;
                ipsecInStatus.innerText = "確立 (Active)";
                ipsecInStatus.className = "sa-status-active";
                
                // Update Diagram
                ipsecOutSaBox.style.opacity = "1";
                ipsecOutSaBox.classList.add("ipsec-out");
                ipsecOutSaBoxLabel.innerText = `Active (SPI: ${spiOut})`;
                
                ipsecInSaBox.style.opacity = "1";
                ipsecInSaBox.classList.add("ipsec-in");
                ipsecInSaBoxLabel.innerText = `Active (SPI: ${spiIn})`;
                
                logToSaConsole(`[IKE] Phase 2 ネゴシエーション成功。データ送受用の暗号化SAを生成しました。`, "success");
                logToSaConsole(`[IPsec SA 送信方向] SPI: ${spiOut} (拠点A → B)`, "system");
                logToSaConsole(`[IPsec SA 受信方向] SPI: ${spiIn} (拠点B → A)`, "system");
                logToSaConsole(`💡 注意: 送信と受信で別々の独立した鍵（SA）が2本生成されています。`, "normal");
                logToSaConsole(`>> これでデータ通信の準備が整いました。「暗号パケット送信テスト」を実行可能です。`, "info");
                
                btnSendSaPacket.disabled = false;
            }, 800);
        });

        // Send encrypted data test button click
        btnSendSaPacket.addEventListener("click", () => {
            const data = saPayloadText.value.trim() || "CONFIDENTIAL_DATA";
            logToSaConsole(`\n--- 暗号パケット送信開始 (データ: "${data}") ---`, "info");
            
            setTimeout(() => {
                logToSaConsole(`[拠点A] 送信キューにデータ "${data}" を受信。`, "normal");
                logToSaConsole(`[拠点A] IPsecエンジンが宛先 (拠点B) に対応する「送信用 IPsec SA」を検索中...`, "normal");
                logToSaConsole(`[拠点A] 送信用 SA (SPI: ${spiOut}) を特定。共通鍵暗号アルゴリズム（AES-GCM）をロード。`, "system");
                logToSaConsole(`🔒 [拠点A] データを暗号化し、改ざん防止MAC（整合性検証子）を生成。`, "success");
                
                // Construct a mock ESP packet representation
                const espHeader = `ESP Header [SPI: ${spiOut}, Seq: 1]`;
                logToSaConsole(`[拠点A] パケットのカプセル化完了。新IPヘッダー、${espHeader}、暗号化データ、ESP認証ICVを結合して送信。`, "normal");
                logToSaConsole(`📡 [インターネット] 暗号化されたESPパケットがキャリア/インターネット回線を通過中... (平文データは一切見えません)`, "info");
                
                setTimeout(() => {
                    logToSaConsole(`[拠点B] ゲートウェイにてESPパケットを受信。`, "normal");
                    logToSaConsole(`[拠点B] 受信パケットのESPヘッダーから SPI: ${spiOut} を抽出。`, "normal");
                    logToSaConsole(`[拠点B] 自ルーターの「受信用 IPsec SA テーブル」を検索...`, "normal");
                    logToSaConsole(`[拠点B] SPI: ${spiOut} に対応する SA (拠点Aからの受信用) を特定。復号キーとハッシュアルゴリズムを入手。`, "system");
                    logToSaConsole(`🔓 [拠点B] 整合性チェックに合格（改ざんなし）。暗号化パケットの復号に成功！`, "success");
                    logToSaConsole(`[拠点B] 復号されたデータ "${data}" を、宛先の社内サーバーへルーティング完了。`, "success");
                    logToSaConsole(`🟢 送信・復号テスト完了。正常に暗号通信が行われました。`, "success");
                    app.log("success", `[IPsec SA] SPI ${spiOut} を用いたデータ転送に成功しました。`);
                }, 800);
                
            }, 500);
        });

        // Clear SA button click
        btnClearSa.addEventListener("click", () => {
            hasIkeSa = false;
            hasIpsecSa = false;
            spiIke = "";
            spiOut = "";
            spiIn = "";
            
            // Reset table
            ikeSaSpi.innerText = "-";
            ikeSaStatus.innerText = "未確立";
            ikeSaStatus.className = "sa-status-inactive";
            
            ipsecOutSpi.innerText = "-";
            ipsecOutStatus.innerText = "未確立";
            ipsecOutStatus.className = "sa-status-inactive";
            
            ipsecInSpi.innerText = "-";
            ipsecInStatus.innerText = "未確立";
            ipsecInStatus.className = "sa-status-inactive";
            
            // Reset Diagram
            ikeSaBox.style.opacity = "0.3";
            ikeSaBox.className = "sa-box";
            ikeSaBoxLabel.innerText = "未確立";
            
            ipsecOutSaBox.style.opacity = "0.3";
            ipsecOutSaBox.className = "sa-box";
            ipsecOutSaBoxLabel.innerText = "未確立";
            
            ipsecInSaBox.style.opacity = "0.3";
            ipsecInSaBox.className = "sa-box";
            ipsecInSaBoxLabel.innerText = "未確立";
            
            // Reset buttons
            btnIkePhase1.disabled = false;
            btnIkePhase2.disabled = true;
            btnSendSaPacket.disabled = true;
            
            saSimLogText.innerText = "SAが初期化されました。「IKE Phase 1」から再実行してください。";
            logToSaConsole("SAテーブルをクリアしました。", "info");
        });


        // --- Part 2: Wide-Area Network VPN Comparison Logic ---
        const vpnArchBtns = document.querySelectorAll(".vpn-arch-btn");
        const tdVpnNetType = document.getElementById("tdVpnNetType");
        const tdVpnLayer = document.getElementById("tdVpnLayer");
        const tdVpnSec = document.getElementById("tdVpnSec");
        const tdVpnEncryptReq = document.getElementById("tdVpnEncryptReq");
        const tdVpnCost = document.getElementById("tdVpnCost");
        const vpnArchExplainText = document.getElementById("vpnArchExplainText");
        
        const vpnDiagramLine = document.getElementById("vpnDiagramLine");
        const vpnPacketIndicator = document.getElementById("vpnPacketIndicator");
        const vpnCloudIcon = document.getElementById("vpnCloudIcon");
        const vpnCloudLabel = document.getElementById("vpnCloudLabel");
        
        const archData = {
            internet_vpn: {
                netType: "一般の公衆インターネット回線",
                layer: "L3 (ネットワーク層) / IPsecカプセル化",
                security: "IPsec (暗号化 ＋ デジタル署名による改ざん検知)",
                encryptReq: "<b>必須</b>（オープンな公衆回線を通るため暗号化しないと盗聴されます）",
                cost: "低コスト ＆ ベストエフォート（速度保証なし）",
                cloudIcon: "🌐",
                cloudLabel: "公衆インターネット",
                lineColor: "var(--border-color)",
                packetText: "IPsec ESP Packet (暗号化)",
                packetColor: "#ef4444",
                explain: `
                    <b>📌 インターネットVPN の試験重要ポイント:</b><br>
                    - 一般の公衆インターネット上に **IPsecやSSL/TLS** で暗号トンネルを掘って通信する方式です。<br>
                    - 利用コストが圧倒的に安い反面、帯域（通信速度）の保証はありません。<br>
                    - インターネットを通過するため、盗聴・改ざんの危険が常にあります。そのため、**パケット全体の暗号化（IPsec ESPなど）が必須**となります。<br>
                    - 送信端末やVPNゲートウェイが暗号化・復号の処理（オーバーヘッド）を行うため、ルーターのCPU負荷が高くなります。
                `
            },
            ip_vpn: {
                netType: "通信キャリアが保有する閉域IP網 (MPLS)",
                layer: "L3 (ネットワーク層) / MPLSラベル識別",
                security: "MPLS (Multi-Protocol Label Switching) によるトラフィック分離",
                encryptReq: "<b>任意 / 不要</b>（インターネットから物理的・論理的に隔離された閉域網のため）",
                cost: "高コスト ＆ 帯域優先・保証型",
                cloudIcon: "☁️",
                cloudLabel: "キャリア閉域IP網 (MPLS)",
                lineColor: "rgba(99, 102, 241, 0.6)",
                packetText: "MPLS Label Packet",
                packetColor: "#3b82f6",
                explain: `
                    <b>📌 IP-VPN (MPLS) の試験重要ポイント:</b><br>
                    - 電気通信事業者が独自に提供する **閉域IPネットワーク（MPLS網）** を利用したVPNです。<br>
                    - 一般のインターネットからは完全に分離されている閉域網のため、途中でデータが盗まれる心配がありません。したがって、**拠点間での暗号化処理は通常「不要」**です。<br>
                    - ルーターで暗号化・復号を行わないため、インターネットVPNと比べて転送遅延が小さく、高速な通信が可能です。<br>
                    - L3（ネットワーク層）での通信となるため、IPプロトコル以外の通信はカプセル化・転送できません。
                `
            },
            wide_ether: {
                netType: "通信キャリアが保有する閉域イーサネット網",
                layer: "L2 (データリンク層) / VLANタギング・MACカプセル化",
                security: "VLANタグ（IEEE 802.1Q）やMACアドレスのグループ化による分離",
                encryptReq: "<b>任意 / 不要</b>（キャリア網内は完全に保護されたL2専用線として機能するため）",
                cost: "非常に高コスト ＆ 帯域保証・高品質",
                cloudIcon: "🔌",
                cloudLabel: "広域イーサネット (L2専用網)",
                lineColor: "rgba(16, 185, 129, 0.6)",
                packetText: "VLAN Tagged Frame",
                packetColor: "#10b981",
                explain: `
                    <b>📌 広域イーサネット の試験重要ポイント:</b><br>
                    - 拠点を直結する技術です。拠点間は1つの巨大なL2スイッチ（ハブ）に繋がっている状態になります。<br>
                    - IP-VPNと同様にインターネットから分離された閉域網のため、**暗号化は不要**です。<br>
                    - **L2接続のため、IPプロトコル以外の様々なプロトコル（Non-IP）をそのまま流すことができます。**<br>
                    - また、OSPFやRIPなどのルーティング設定、VLANトランクの設定を企業側で自由に設計できる高いカスタマイズ性が特徴です。
                `
            }
        };
        
        function selectArchitecture(arch) {
            // Update buttons active class
            vpnArchBtns.forEach(btn => {
                if (btn.dataset.arch === arch) btn.classList.add("active");
                else btn.classList.remove("active");
            });
            
            const data = archData[arch];
            if (!data) return;
            
            // Update Table
            tdVpnNetType.innerText = data.netType;
            tdVpnLayer.innerText = data.layer;
            tdVpnSec.innerText = data.security;
            tdVpnEncryptReq.innerHTML = data.encryptReq;
            tdVpnCost.innerText = data.cost;
            
            // Update Explanation box
            vpnArchExplainText.innerHTML = data.explain;
            
            // Update Diagram
            vpnCloudIcon.innerText = data.cloudIcon;
            vpnCloudLabel.innerText = data.cloudLabel;
            vpnDiagramLine.style.backgroundColor = data.lineColor;
            
            // Trigger Packet flow animation in diagram
            vpnPacketIndicator.style.display = "block";
            vpnPacketIndicator.innerText = data.packetText;
            vpnPacketIndicator.style.backgroundColor = data.packetColor;
            vpnPacketIndicator.style.transition = "none";
            vpnPacketIndicator.style.left = "20%";
            
            // Force reflow and run animation
            setTimeout(() => {
                vpnPacketIndicator.style.transition = "left 1.2s ease-in-out";
                vpnPacketIndicator.style.left = "65%";
            }, 50);
        }
        
        // Setup button click handlers
        vpnArchBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                selectArchitecture(btn.dataset.arch);
            });
        });
        
        // Select default architecture on load
        selectArchitecture("internet_vpn");
    }
};
