/**
 * Module 11: OSI Reference Model & Encapsulation Lab
 */
window.SecurityLabModules["osi_model"] = {
    html: `
        <div class="lab-container">
            <div class="card">
                <h3>📦 OSI参照モデル・カプセル化ビジュアライザー</h3>
                <p class="card-subtitle">PCからWebサーバーへHTTPS (HTTP over TLS/TCP/IP) でメッセージを送信する際の、各層におけるヘッダー付与（カプセル化）と剥離（デカプセル化）のプロセスを視覚的に理解します。</p>
                
                <div class="lab-grid-3" style="grid-template-columns: 1.2fr 1fr 1.2fr; gap: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                    <div class="form-group">
                        <label for="osiPayloadInput">送信メッセージ (HTTP data):</label>
                        <input type="text" id="osiPayloadInput" value="POST /login HTTP/1.1\\r\\nHost: internal.portal" style="width: 100%;">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; justify-content: flex-end;">
                        <label style="font-weight: bold; color: var(--text-primary);">🚀 シミュレーション制御:</label>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary" id="btnStartOsiSend" style="flex: 1; font-size: 11px;">1. 送信 (カプセル化)</button>
                            <button class="btn btn-secondary" id="btnStartOsiRecv" style="flex: 1; font-size: 11px;" disabled>2. 受信 (非カプセル化)</button>
                        </div>
                    </div>
                    <div style="display: flex; align-items: flex-end; justify-content: flex-end; gap: 8px;">
                        <button class="btn" id="btnResetOsi" style="width: 100px; font-size: 11px; border: 1px solid var(--border-color); background: transparent;">リセット</button>
                    </div>
                </div>

                <div class="lab-grid-3" style="grid-template-columns: 1.2fr 1fr 1.2fr; gap: 20px; margin-top: 20px;">
                    <!-- Left: OSI Layer Stack -->
                    <div>
                        <label style="font-weight: bold; color: var(--text-primary);">🥞 OSI 7階層スタック (送信側 PC)</label>
                        <div class="osi-stack" id="osiStackContainer">
                            <!-- Filled dynamically -->
                        </div>
                    </div>

                    <!-- Middle: Packet Packet Preview & Physical Transmission -->
                    <div style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <label style="font-weight: bold; color: var(--text-primary);">📦 カプセル化パケット (PDU)</label>
                            <div class="osi-packet-preview-container">
                                <span style="font-weight: bold; color: var(--text-secondary); display: block; margin-bottom: 6px;">現在のパケット配置:</span>
                                <div id="osiPacketTypeLabel" style="font-size: 10px; color: var(--color-primary-hover); font-weight: bold; margin-bottom: 8px;">PDU: N/A</div>
                                <div class="osi-packet-block" id="osiPacketSegmentsBlock">
                                    <div class="osi-packet-segment osi-segment-data" id="osiSegData">HTTP DATA</div>
                                </div>
                                <div id="osiPhysicalBits" style="font-size: 9px; color: #10b981; font-family: monospace; word-break: break-all; margin-top: 10px; display: none;"></div>
                            </div>
                        </div>

                        <!-- Physical Cable Flow Animation -->
                        <div>
                            <label style="font-weight: bold; color: var(--text-primary);">📡 物理回線伝送 (L1 物理層)</label>
                            <div class="osi-flow-animation-container">
                                <span class="osi-flow-node" title="送信元 PC">💻</span>
                                <div class="osi-flow-line"></div>
                                <div class="osi-flow-packet" id="osiFlowPacket"></div>
                                <span class="osi-flow-node" title="宛先 Webサーバー">🛢️</span>
                            </div>
                            <div style="text-align: center; font-size: 9px; color: var(--text-secondary); margin-top: 6px;" id="osiFlowLabel">通信待機中</div>
                        </div>
                    </div>

                    <!-- Right: console logs & details -->
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <!-- Dynamic details box -->
                        <div id="osiDetailBox" style="background: rgba(99,102,241,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; min-height: 180px; font-size: 12px; line-height: 1.5; color: var(--text-secondary);">
                            <span style="font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; display: block; margin-bottom: 8px;" id="osiDetailTitle">💡 階層をクリックして解説を表示</span>
                            <div id="osiDetailContent">
                                左のOSI階層スタックのいずれかの層をクリックすると、その階層のプロトコル動作やカプセル化ヘッダーの内容、セキスペ頻出の知識がここに表示されます。
                            </div>
                        </div>

                        <div class="form-group" style="margin: 0; flex: 1; display: flex; flex-direction: column;">
                            <label>カプセル化通信ログ:</label>
                            <div class="response-box" style="flex: 1; min-height: 130px; max-height: 180px; overflow-y: auto; background-color: #0c0a09; border-color: rgba(99,102,241,0.3);">
                                <code id="osiSimLogText" style="font-size: 11px; color: #fbbf24; white-space: pre-wrap;">「1. 送信 (カプセル化)」ボタンを押すと、各階層でのヘッダー付加プロセスが開始されます。</code>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Part 3: Packet Decoder Table -->
                <div class="osi-decoder-container">
                    <div class="osi-decoder-title">
                        <span>🔍</span> カプセル化パケット詳細デコーダー (パケット内部のフィールド構造)
                    </div>
                    <table class="osi-decoder-table">
                        <thead>
                            <tr>
                                <th style="width: 15%;">階層</th>
                                <th style="width: 25%;">フィールド名</th>
                                <th style="width: 30%;">値 (具体的な設定データ)</th>
                                <th style="width: 30%;">セキスペ技術解説</th>
                            </tr>
                        </thead>
                        <tbody id="osiDecoderTableBody">
                            <tr>
                                <td colspan="4" style="text-align: center; color: var(--text-secondary);">「1. 送信 (カプセル化)」を実行するか、左のOSIスタックの階層をクリックすると、デコードされたヘッダー情報がここに展開されます。</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        const osiStackContainer = document.getElementById("osiStackContainer");
        const osiPayloadInput = document.getElementById("osiPayloadInput");
        const btnStartOsiSend = document.getElementById("btnStartOsiSend");
        const btnStartOsiRecv = document.getElementById("btnStartOsiRecv");
        const btnResetOsi = document.getElementById("btnResetOsi");
        const osiPacketTypeLabel = document.getElementById("osiPacketTypeLabel");
        const osiPacketSegmentsBlock = document.getElementById("osiPacketSegmentsBlock");
        const osiPhysicalBits = document.getElementById("osiPhysicalBits");
        const osiFlowPacket = document.getElementById("osiFlowPacket");
        const osiFlowLabel = document.getElementById("osiFlowLabel");
        const osiDetailTitle = document.getElementById("osiDetailTitle");
        const osiDetailContent = document.getElementById("osiDetailContent");
        const osiSimLogText = document.getElementById("osiSimLogText");
        const osiDecoderTableBody = document.getElementById("osiDecoderTableBody");

        // OSI Layers static data
        const layers = [
            { num: 7, name: "アプリケーション層", pdu: "データ/メッセージ", protocol: "HTTP/HTTPS", desc: "ユーザーが直接触れるアプリケーション用のインターフェースを提供。今回のケースではHTTP要求本体(HTTPヘッダー+データ)が生成されます。" },
            { num: 6, name: "プレゼンテーション層", pdu: "データ", protocol: "SSL/TLS 暗号化", desc: "文字コードの変換や暗号化、データ圧縮など、データ表現の規格を管理。今回のHTTPS通信では、メッセージ本体がTLSによって暗号化されます。" },
            { num: 5, name: "セッション層", pdu: "データ", protocol: "TLS セッション", desc: "通信プログラム間の会話（コネクション）の開始、維持、終了を管理。TLSセッション情報を保持して、安全な対話関係の枠組みを作ります。" },
            { num: 4, name: "トランスポート層", pdu: "セグメント", protocol: "TCP", desc: "データの信頼性高い到達を保証する層。送信元/宛先ポート番号(TCP 443)やシーケンス番号等を含む『TCPヘッダー』を付加し、『セグメント』化します。" },
            { num: 3, name: "ネットワーク層", pdu: "パケット", protocol: "IP / ARP", desc: "宛先までデータをルーティングする層。送信元/宛先IPアドレスを含む『IPヘッダー』を付加し、『IPパケット』とします。L3スイッチ/ルーターはこの層で動作します。" },
            { num: 2, name: "データリンク層", pdu: "フレーム", protocol: "イーサネット", desc: "隣接する通信機器同士の物理的な通信を制御。送信元/宛先の『MACアドレスヘッダー』と、エラー検出用の『FCS (Frame Check Sequence)』を付加して『イーサネットフレーム』を形成します。L2スイッチはこの層で動作します。" },
            { num: 1, name: "物理層", pdu: "ビット列", protocol: "電気信号 (PHY)", desc: "電気信号、光信号、無線などの物理媒体を通したデータ伝送。イーサネットフレームを0と1のビット列に変換し、LANケーブルへ電気信号（パルス）として送り出します。リピータハブはこの層で動作します。" }
        ];

        // Specific details displayed when a layer card is clicked
        const layerDetails = {
            7: {
                title: "Layer 7: アプリケーション層 (Application Layer)",
                content: `
                    <b>■ 役割:</b> ユーザーが利用するWebブラウザやサーバーアプリケーションのインターフェース。<br>
                    <b>■ 今回の動作:</b> 入力されたHTTPデータ <code>POST /login HTTP/1.1</code> にHTTPヘッダーが付与されます。<br>
                    <b>■ 主なプロトコル:</b> HTTP, HTTPS, DNS, SMTP, DHCP, FTP, SNMP<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        DNSプロトコルの動作（再帰的な問い合わせやポート53）や、アプリケーション層を検査・遮断する <b>WAF (Web Application Firewall)</b> の動作はこの第7層に属します。
                    </div>
                `
            },
            6: {
                title: "Layer 6: プレゼンテーション層 (Presentation Layer)",
                content: `
                    <b>■ 役割:</b> データの表現形式（文字コード、暗号化、データ圧縮など）を定義。<br>
                    <b>■ 今回の動作:</b> Webサーバーとの安全な通信のために、HTTPメッセージが <b>TLSによって暗号化</b> されます。<br>
                    <b>■ 代表的な技術:</b> SSL/TLS (暗号), ASCII, Unicode (UTF-8), JPEG, MPEG, ZIP<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        「文字化け」や、SSL/TLSによる「共通鍵暗号/公開鍵暗号の適用」による暗号処理の定義はこのレイヤーに位置します。
                    </div>
                `
            },
            5: {
                title: "Layer 5: セッション層 (Session Layer)",
                content: `
                    <b>■ 役割:</b> データを送信するプログラム間の「セッション」の開始、維持、終了の同期を行う。<br>
                    <b>■ 今回の動作:</b> TLSのネゴシエーションが成功し、安全なセッションが確立された通信の論理的関係を管理します。<br>
                    <b>■ 主なプロトコル:</b> TLSセッション管理, NetBIOS, RPC<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        トランスポート層がTCP接続といった「回線の道」を作るのに対し、セッション層は「会話の手順やログイン状態の管理」といった論理接続を行います。
                    </div>
                `
            },
            4: {
                title: "Layer 4: トランスポート層 (Transport Layer)",
                content: `
                    <b>■ 役割:</b> 2つの端末プログラム間の、信頼性のある（または高速な）データ転送の保証。<br>
                    <b>■ 今回の動作:</b> 暗号化されたデータに対して、送信元ポート番号（例: <code>54321</code>）と宛先ポート番号（HTTPS: <code>443</code>）を含む <b>TCPヘッダー</b> を付与し、<b>「TCPセグメント」</b> に分割します。<br>
                    <b>■ 主なプロトコル:</b> TCP, UDP<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        信頼性を重視する <b>TCP (スリーウェイハンドシェイク、ウィンドウ制御)</b> と、速度重視の <b>UDP</b> の比較、およびポート番号（L4）のみをチェックして遮断するパケットフィルタリング型ファイアウォールの動作が重要です。
                    </div>
                `
            },
            3: {
                title: "Layer 3: ネットワーク層 (Network Layer)",
                content: `
                    <b>■ 役割:</b> 異なるネットワーク間のルーティング（経路決定）と、宛先へのパケット配送。<br>
                    <b>■ 今回の動作:</b> TCPセグメントに対して、送信元IP（例: <code>192.168.1.50</code>）と宛先IP（例: <code>10.0.0.100</code>）を含む <b>IPヘッダー</b> を付与し、<b>「IPパケット」</b> とします。<br>
                    <b>■ 主なプロトコル:</b> IP, ICMP, ARP, IPsec, OSPF<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        IPアドレスに基づいて最適経路を決定する <b>ルーター</b> や <b>L3スイッチ</b> の動作層です。IPアドレスをMACアドレスに変換する <b>ARP</b> の動作もこの層を跨ぎます。
                    </div>
                `
            },
            2: {
                title: "Layer 2: データリンク層 (Data Link Layer)",
                content: `
                    <b>■ 役割:</b> 同一ネットワーク（リンク）内の隣接機器間での信頼性の高いデータ通信。<br>
                    <b>■ 今回の動作:</b> IPパケットに対して、送信元MACとネクストホップのMACを含む <b>イーサネットヘッダー</b> と、エラー検出用トレーラである <b>FCS (Frame Check Sequence)</b> を付与し、<b>「イーサネットフレーム」</b> を構成します。<br>
                    <b>■ 代表的な技術:</b> イーサネット (IEEE 802.3), PPP, MACアドレス, VLAN (802.1Q)<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        MACアドレステーブルを学習し、パケットを適切なポートに中継する <b>レイヤー2スイッチ（L2スイッチ） / ブリッジ</b> や、セグメント分離を行う <b>VLAN</b> がこの層に属します。
                    </div>
                `
            },
            1: {
                title: "Layer 1: 物理層 (Physical Layer)",
                content: `
                    <b>■ 役割:</b> データを電気信号や光信号、電波などの物理的な信号に変換し、物理媒体で伝送する。<br>
                    <b>■ 今回の動作:</b> イーサネットフレームを <b>0と1のビット列</b> にシリアル変換し、電気パルスや光パルスとして物理メディア（UTPケーブルや光ファイバー）に送り出します。<br>
                    <b>■ 代表的な技術:</b> UTP/LANケーブル, 光ファイバー, コネクタ形状(RJ-45), 電気的仕様(電圧など)<br>
                    <div style="background-color:rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 8px; margin-top: 8px; border-radius: 4px;">
                        <b>💡 セキスペ出題の鍵:</b><br>
                        物理的な回線接続や、単に受信信号を増幅して全ポートに垂れ流すだけの <b>リピータハブ（シェアードハブ）</b> はこの物理層で動作するため、盗聴のリスクが生じる性質が出題されます。
                    </div>
                `
            }
        };

        // Specific fields details for the detailed packet decoder table
        const getHeaderFields = (payload) => {
            const lines = payload.split('\\r\\n');
            const methodLine = lines[0] || "POST /login HTTP/1.1";
            const parts = methodLine.split(' ');
            const method = parts[0] || "POST";
            const uri = parts[1] || "/login";
            const proto = parts[2] || "HTTP/1.1";
            const hostLine = lines.find(l => l.toLowerCase().startsWith("host:"));
            const host = hostLine ? hostLine.split(':')[1].trim() : "internal.portal";

            return {
                7: [
                    { name: "HTTP Request Method", val: method, desc: "リクエストの種類（データ送信は主にPOST）。" },
                    { name: "HTTP URI", val: uri, desc: "宛先Webサーバー内の受信エンドポイント。" },
                    { name: "HTTP Version", val: proto, desc: "HTTP通信の仕様バージョン。" },
                    { name: "Host Header", val: host, desc: "宛先のサーバー名。同一IP上で複数Webサーバーを動かす際に必須。" }
                ],
                6: [
                    { name: "TLS Record Type", val: "0x17 (Application Data)", desc: "暗号化されたユーザーデータを運ぶレコード型。" },
                    { name: "TLS Version", val: "0x0303 (TLS 1.2 / 1.3)", desc: "セキュリティ接続バージョン。" },
                    { name: "TLS Length", val: "92 bytes", desc: "暗号化されたデータのバイト長。" },
                    { name: "Encrypted Data Block", val: "4A E3 8C 1F B2 9A 40 D2 E1 ... [密文]", desc: "共通鍵で暗号化されたHTTPメッセージ本体。" }
                ],
                5: [
                    { name: "TLS Session ID", val: "0xE74D8C21... (32bytes)", desc: "サーバーと合意したセッション状態のインデックス。" }
                ],
                4: [
                    { name: "Source Port", val: "54321", desc: "クライアント側が動的に割り当てた一時ポート番号。" },
                    { name: "Destination Port", val: "443 (HTTPS)", desc: "Webサーバー側のHTTPS接続受け口ポート。" },
                    { name: "Sequence Number", val: "1001", desc: "パケットの順序番号。欠落検知と順序入れ替えに必須。" },
                    { name: "Data Offset (Header Length)", val: "20 bytes", desc: "標準的なTCPヘッダーサイズを示す。" },
                    { name: "Control Flags", val: "0x018 (PSH, ACK)", desc: "応答確認(ACK)と即時転送(PSH)フラグ。" }
                ],
                3: [
                    { name: "IP Version", val: "4 (IPv4)", desc: "インターネットプロトコルのバージョン。" },
                    { name: "Protocol Number", val: "6 (TCP)", desc: "IPデータ部にTCPセグメントが含まれることを示す。" },
                    { name: "Source IP Address", val: "192.168.1.50", desc: "送信元クライアントPCのプライベートIPアドレス。" },
                    { name: "Destination IP Address", val: "10.0.0.100", desc: "宛先WebサーバーのIPアドレス。" }
                ],
                2: [
                    { name: "Destination MAC Address", val: "00:0F:53:21:8A:BC", desc: "同一セグメントのデフォルトゲートウェイ（ルーター）の物理アドレス。" },
                    { name: "Source MAC Address", val: "70:85:C2:A1:3B:4E", desc: "PC側のNICが持つ固有の物理アドレス。" },
                    { name: "EtherType", val: "0x0800 (IPv4)", desc: "イーサネットフレームの中身がIPv4パケットであることを通知。" },
                    { name: "FCS (Frame Check Sequence)", val: "0x5D4A3E21", desc: "通信路上でのビット破損を検出する32ビットのCRC値。" }
                ],
                1: [
                    { name: "Line Coding Scheme", val: "PAM5 (Pulse Amplitude Modulation 5)", desc: "電圧パルスによるビット符号化。" },
                    { name: "Physical Media Type", val: "Category 5e/6 UTP Cable", desc: "1Gbps伝送対応の銅線LANケーブル。" },
                    { name: "Transmission Speed", val: "1000 Mbps (Full Duplex)", desc: "物理リンク速度。全二重通信。" }
                ]
            };
        };

        function logOsi(message, type = "normal") {
            let color = "#fbbf24"; // default
            if (type === "system") color = "#a78bfa";
            else if (type === "success") color = "#34d399";
            else if (type === "info") color = "#60a5fa";
            
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            osiSimLogText.innerHTML += `<div style="margin-bottom: 2px; color: ${color};">[${timeStr}] ${message}</div>`;
            
            const box = osiSimLogText.parentElement;
            if (box) {
                box.scrollTop = box.scrollHeight;
            }
        }

        // Render Stack DOM dynamically
        function renderStack() {
            osiStackContainer.innerHTML = "";
            layers.forEach(layer => {
                const el = document.createElement("div");
                el.className = "osi-layer-card";
                el.id = `osiLayerCard-${layer.num}`;
                
                el.innerHTML = `
                    <span class="osi-layer-num">L${layer.num}</span>
                    <span class="osi-layer-name">${layer.name}</span>
                    <span class="osi-pdu-badge">${layer.pdu}</span>
                    <span id="osiHeaderTag-${layer.num}" class="osi-header-tag" style="display: none;">Header</span>
                `;
                
                el.addEventListener("click", () => {
                    showDetails(layer.num);
                    selectOrAddDecoderRow(layer.num);
                });
                osiStackContainer.appendChild(el);
            });
        }

        function showDetails(num) {
            document.querySelectorAll(".osi-layer-card").forEach(c => c.classList.remove("active"));
            const el = document.getElementById(`osiLayerCard-${num}`);
            if (el) el.classList.add("active");
            
            const detail = layerDetails[num];
            if (detail) {
                osiDetailTitle.innerText = detail.title;
                osiDetailContent.innerHTML = detail.content;
            }
        }

        // When a user clicks a layer card, select existing row, or add if empty
        function selectOrAddDecoderRow(num) {
            const isTableEmpty = osiDecoderTableBody.querySelector("td[colspan]") !== null || osiDecoderTableBody.innerHTML.trim() === "";
            
            if (isTableEmpty) {
                // If simulator hasn't run, clear default text and just display this layer's fields
                updateDecoderTable(num, true);
            } else {
                // If table is already populated (has fields), just highlight the corresponding rows
                let foundRow = false;
                document.querySelectorAll(`#osiDecoderTableBody tr`).forEach(row => {
                    if (row.id && row.id.startsWith(`decoderRow-L${num}-`)) {
                        row.classList.add("highlight");
                        foundRow = true;
                    } else {
                        row.classList.remove("highlight");
                    }
                });

                // If not found in current table (e.g. not reached yet in simulation), append it
                if (!foundRow) {
                    updateDecoderTable(num, false);
                }
            }
        }

        // Update the decoder table (Appends fields to bottom by default)
        function updateDecoderTable(num, clearFirst = false) {
            if (clearFirst) {
                osiDecoderTableBody.innerHTML = "";
            }
            
            const payload = osiPayloadInput.value.trim() || "POST /login HTTP/1.1";
            const fields = getHeaderFields(payload)[num];
            
            if (!fields) return;

            // Remove existing highlights from other rows
            document.querySelectorAll(`#osiDecoderTableBody tr`).forEach(row => {
                row.classList.remove("highlight");
            });

            const layerName = layers.find(l => l.num === num).name;
            const newRows = fields.map(f => {
                const uniqueId = `decoderRow-L${num}-${f.name.replace(/\s+/g, '-')}`;
                // Avoid duplicating the exact same field if it already exists
                if (document.getElementById(uniqueId)) return "";

                return `
                    <tr id="${uniqueId}" class="highlight">
                        <td style="font-weight: bold; color: var(--text-primary);">L${num} ${layerName}</td>
                        <td class="field-name">${f.name}</td>
                        <td class="field-value">${f.val}</td>
                        <td style="color: var(--text-secondary); font-size: 11px;">${f.desc}</td>
                    </tr>
                `;
            }).join("");
            
            osiDecoderTableBody.innerHTML += newRows;
        }

        // Mark corresponding layer fields as decapsulated (strike-through)
        function markDecapsulated(num) {
            document.querySelectorAll(`#osiDecoderTableBody tr`).forEach(row => {
                if (row.id && row.id.startsWith(`decoderRow-L${num}-`)) {
                    row.classList.add("decapsulated");
                    row.classList.remove("highlight");
                }
            });
        }

        // Reset the decapsulated state (remove strikethroughs)
        function resetDecapsulatedState() {
            document.querySelectorAll(`#osiDecoderTableBody tr`).forEach(row => {
                row.classList.remove("decapsulated");
            });
        }

        // Setup UI segments for the packet block representation
        function resetPacketPreview() {
            osiPacketSegmentsBlock.innerHTML = `
                <div class="osi-packet-segment osi-segment-data" id="osiSegData">HTTP DATA</div>
            `;
            osiPacketTypeLabel.innerText = "PDU: データ (L7 - アプリケーションデータ)";
            osiPhysicalBits.style.display = "none";
            osiPhysicalBits.innerText = "";
            
            // Hide all header tags in stack
            document.querySelectorAll(".osi-header-tag").forEach(tag => {
                tag.style.display = "none";
            });

            osiDecoderTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary);">「1. 送信 (カプセル化)」を実行するか、左のOSIスタックの階層をクリックすると、デコードされたヘッダー情報がここに展開されます。</td>
                </tr>
            `;
        }

        renderStack();
        showDetails(7); // Show L7 details by default
        resetPacketPreview();

        // 1. Send Simulation (Encapsulation: L7 -> L1)
        btnStartOsiSend.addEventListener("click", async () => {
            btnStartOsiSend.disabled = true;
            btnStartOsiRecv.disabled = true;
            
            // Clear decoder table for fresh simulation start
            resetPacketPreview();
            osiSimLogText.innerText = "";
            logOsi(">>> PC送信側: カプセル化プロセス (Encapsulation) を開始します...", "info");
            
            const payload = osiPayloadInput.value.trim() || "POST /login HTTP/1.1";
            
            // L7 -> L1 Step Loop
            for (let num = 7; num >= 1; num--) {
                showDetails(num);
                
                // Cumulative append to decoder table
                const isFirst = (num === 7);
                updateDecoderTable(num, isFirst);
                
                const tag = document.getElementById(`osiHeaderTag-${num}`);
                
                if (num === 7) {
                    logOsi(`[L7 アプリケーション層] HTTP要求メッセージを生成: "${payload.split('\\r\\n')[0]}"`, "normal");
                    osiPacketTypeLabel.innerText = "PDU: データ (L7 - HTTPメッセージ)";
                    tag.innerText = "HTTP";
                    tag.style.backgroundColor = "#ec4899";
                    tag.style.display = "inline-block";
                }
                else if (num === 6) {
                    logOsi(`[L6 プレゼンテーション層] データ暗号化処理を実行中 (TLS接続設定)...`, "normal");
                    logOsi(`[L6 プレゼンテーション層] メッセージ全体が暗号化されました。`, "success");
                    tag.innerText = "TLS Encrypted";
                    tag.style.backgroundColor = "#a78bfa";
                    tag.style.display = "inline-block";
                    
                    // Update PDU view
                    const dataBlock = document.getElementById("osiSegData");
                    dataBlock.innerText = "🔒 暗号化データ";
                    dataBlock.style.backgroundColor = "#a78bfa";
                    osiPacketTypeLabel.innerText = "PDU: データ (L6 - 暗号化メッセージ)";
                }
                else if (num === 5) {
                    logOsi(`[L5 セッション層] 安全な通信セッションIDをバインド。セッション状態を維持します。`, "normal");
                    tag.innerText = "Session ID";
                    tag.style.backgroundColor = "#818cf8";
                    tag.style.display = "inline-block";
                }
                else if (num === 4) {
                    logOsi(`[L4 トランスポート層] 確実な配送を保証するため、TCPを採用。`, "normal");
                    logOsi(`[L4 トランスポート層] 送信元ポート 54321、宛先ポート 443 (HTTPS) を割り当て。`, "normal");
                    logOsi(`[L4 トランスポート層] TCPヘッダーを追加して「セグメント」を作成。`, "system");
                    tag.innerText = "TCP Header";
                    tag.style.backgroundColor = "#f59e0b";
                    tag.style.display = "inline-block";
                    
                    // Add segment to preview
                    const tcpSeg = document.createElement("div");
                    tcpSeg.className = "osi-packet-segment osi-segment-tcp";
                    tcpSeg.id = "osiSegTcp";
                    tcpSeg.innerText = "TCPヘッダー [Port:443]";
                    osiPacketSegmentsBlock.insertBefore(tcpSeg, osiPacketSegmentsBlock.firstChild);
                    osiPacketTypeLabel.innerText = "PDU: セグメント (L4 - TCP Segment)";
                }
                else if (num === 3) {
                    logOsi(`[L3 ネットワーク層] 送信元IP 192.168.1.50、宛先IP 10.0.0.100 を設定。`, "normal");
                    logOsi(`[L3 ネットワーク層] IPヘッダーを追加して「パケット」を作成。`, "system");
                    tag.innerText = "IP Header";
                    tag.style.backgroundColor = "#10b981";
                    tag.style.display = "inline-block";
                    
                    // Add IP packet to preview
                    const ipSeg = document.createElement("div");
                    ipSeg.className = "osi-packet-segment osi-segment-ip";
                    ipSeg.id = "osiSegIp";
                    ipSeg.innerText = "IPヘッダー [IP:10.0.0.100]";
                    osiPacketSegmentsBlock.insertBefore(ipSeg, osiPacketSegmentsBlock.firstChild);
                    osiPacketTypeLabel.innerText = "PDU: パケット (L3 - IP Packet)";
                }
                else if (num === 2) {
                    logOsi(`[L2 データリンク層] 次ホップルーターのMACアドレスを検索。`, "normal");
                    logOsi(`[L2 データリンク層] イーサネットヘッダーおよびエラー検出用FCSを追加して「フレーム」を作成。`, "system");
                    tag.innerText = "Ethernet Header";
                    tag.style.backgroundColor = "#3b82f6";
                    tag.style.display = "inline-block";
                    
                    // Add Ethernet header and FCS to preview
                    const ethSeg = document.createElement("div");
                    ethSeg.className = "osi-packet-segment osi-segment-eth";
                    ethSeg.id = "osiSegEth";
                    ethSeg.innerText = "イーサネットヘッダー";
                    osiPacketSegmentsBlock.insertBefore(ethSeg, osiPacketSegmentsBlock.firstChild);
                    
                    const fcsSeg = document.createElement("div");
                    fcsSeg.className = "osi-packet-segment osi-segment-fcs";
                    fcsSeg.id = "osiSegFcs";
                    fcsSeg.innerText = "FCS (エラー検知)";
                    osiPacketSegmentsBlock.appendChild(fcsSeg);
                    
                    osiPacketTypeLabel.innerText = "PDU: フレーム (L2 - Ethernet Frame)";
                }
                else if (num === 1) {
                    logOsi(`[L1 物理層] イーサネットフレーム全体をビットストリーム(0/1)にシリアライズ中...`, "normal");
                    logOsi(`[L1 物理層] 物理層でビット列を電気パルス信号に変換。LAN回線へ送信を開始します。`, "system");
                    tag.innerText = "PHY bit stream";
                    tag.style.backgroundColor = "#6b7280";
                    tag.style.display = "inline-block";
                    
                    // Render physical bits in preview
                    osiPhysicalBits.style.display = "block";
                    let binaryStr = "";
                    for(let i=0; i<8; i++) {
                        binaryStr += Math.floor(Math.random()*2).toString() + Math.floor(Math.random()*2).toString() + Math.floor(Math.random()*2).toString() + Math.floor(Math.random()*2).toString() + " ";
                    }
                    osiPhysicalBits.innerText = "ビット変換出力: " + binaryStr + "...";
                    osiPacketTypeLabel.innerText = "PDU: ビット列 (L1 - Bit stream)";
                }
                
                // Delay between layer steps
                await new Promise(r => setTimeout(r, 600));
            }
            
            logOsi("🟢 送信側のカプセル化が完了しました。物理回線を通って宛先サーバーへ送ります。", "success");
            
            // Run cable flow animation
            osiFlowLabel.innerText = "物理信号がケーブルを流れています...";
            osiFlowPacket.style.display = "block";
            osiFlowPacket.style.transition = "none";
            osiFlowPacket.style.left = "40px";
            
            // Force reflow and slide right
            setTimeout(() => {
                osiFlowPacket.style.transition = "left 1.5s linear";
                osiFlowPacket.style.left = "calc(100% - 54px)";
            }, 50);
            
            await new Promise(r => setTimeout(r, 1600));
            
            osiFlowLabel.innerText = "パケットが宛先Webサーバーの物理NICに到達しました！";
            logOsi(">> パケットがサーバーに到達しました。受信側で非カプセル化を実行可能です。", "info");
            
            btnStartOsiRecv.disabled = false;
        });

        // 2. Receive Simulation (Decapsulation: L1 -> L7)
        btnStartOsiRecv.addEventListener("click", async () => {
            btnStartOsiRecv.disabled = true;
            resetDecapsulatedState(); // Reset strikethroughs
            logOsi(`\n<<< サーバー受信側: 非カプセル化プロセス (Decapsulation) を開始します...`, "info");
            
            // L1 -> L7 Step Loop
            for (let num = 1; num <= 7; num++) {
                showDetails(num);
                markDecapsulated(num); // Add strike-through to the decapsulated layer rows
                
                if (num === 1) {
                    logOsi(`[L1 物理層] 物理NICにて電気パルスを受信し、デジタルデータに変換中...`, "normal");
                    logOsi(`[L1 物理層] ビットストリームをフレームとして組み立ててL2に引き渡します。`, "normal");
                    osiPacketTypeLabel.innerText = "PDU: イーサネットフレーム";
                    osiPhysicalBits.style.display = "none";
                }
                else if (num === 2) {
                    logOsi(`[L2 データリンク層] 受信したイーサネットフレームの宛先MACアドレスを検証。`, "normal");
                    logOsi(`[L2 データリンク層] FCS整合性チェックに合格（通信エラーなし）。`, "normal");
                    logOsi(`[L2 データリンク層] イーサネットヘッダーとFCSを剥離（デカプセル化）し、IP層へ転送。`, "system");
                    
                    // Remove Ethernet seg and FCS
                    const eth = document.getElementById("osiSegEth");
                    if (eth) eth.remove();
                    const fcs = document.getElementById("osiSegFcs");
                    if (fcs) fcs.remove();
                    
                    osiPacketTypeLabel.innerText = "PDU: IPパケット";
                }
                else if (num === 3) {
                    logOsi(`[L3 ネットワーク層] IPパケットの宛先IPを検証。自ホスト宛であることを確認。`, "normal");
                    logOsi(`[L3 ネットワーク層] IPヘッダーを剥離（デカプセル化）し、トランスポート層（TCP）に引き渡します。`, "system");
                    
                    // Remove IP header segment
                    const ip = document.getElementById("osiSegIp");
                    if (ip) ip.remove();
                    
                    osiPacketTypeLabel.innerText = "PDU: TCPセグメント";
                }
                else if (num === 4) {
                    logOsi(`[L4 トランスポート層] TCPヘッダーを解析。シーケンス番号を確認し順序保証。`, "normal");
                    logOsi(`[L4 トランスポート層] 宛先ポート 443（HTTPSサーバープロセス）へデータを引き渡し。`, "normal");
                    logOsi(`[L4 トランスポート層] TCPヘッダーを剥離（デカプセル化）してセッション層に転送します。`, "system");
                    
                    // Remove TCP header segment
                    const tcp = document.getElementById("osiSegTcp");
                    if (tcp) tcp.remove();
                    
                    osiPacketTypeLabel.innerText = "PDU: 暗号化メッセージデータ";
                }
                else if (num === 5) {
                    logOsi(`[L5 セッション層] 該当する接続セッションが存在し、アクティブであることを確認。`, "normal");
                    logOsi(`[L5 セッション層] セッション維持情報を処理し、プレゼンテーション層へ。`, "normal");
                }
                else if (num === 6) {
                    logOsi(`[L6 プレゼンテーション層] TLSエンジンをロード。共通鍵を用いて暗号パケットの復号を開始。`, "normal");
                    logOsi(`[L6 プレゼンテーション層] データの復号に成功！明文データを読み取り。`, "success");
                    
                    // Update PDU view to show text again
                    const dataBlock = document.getElementById("osiSegData");
                    dataBlock.innerText = "HTTP DATA";
                    dataBlock.style.backgroundColor = "#ec4899";
                    
                    osiPacketTypeLabel.innerText = "PDU: HTTPメッセージデータ (明文)";
                }
                else if (num === 7) {
                    const payload = osiPayloadInput.value.trim() || "POST /login HTTP/1.1";
                    logOsi(`[L7 アプリケーション層] HTTPメッセージを受信。Webサーバープロセスがリクエストをパース。`, "normal");
                    logOsi(`[L7 アプリケーション層] 解析成功: ${payload.split('\\r\\n')[0]}`, "normal");
                    logOsi(`🟢 サーバー受信側での非カプセル化・パケット復元が完全に完了しました！`, "success");
                    app.log("success", `[OSI参照モデル] アプリケーション層にてデータの受信に成功しました。`);
                }
                
                // Delay between layer steps
                await new Promise(r => setTimeout(r, 600));
            }
            
            osiFlowLabel.innerText = "通信処理成功";
            btnStartOsiSend.disabled = false;
        });

        // Reset button
        btnResetOsi.addEventListener("click", () => {
            btnStartOsiSend.disabled = false;
            btnStartOsiRecv.disabled = true;
            
            osiFlowLabel.innerText = "通信待機中";
            osiFlowPacket.style.display = "none";
            
            resetPacketPreview();
            osiSimLogText.innerText = "「1. 送信 (カプセル化)」ボタンを押すと、各階層でのヘッダー付加プロセスが開始されます。";
            
            showDetails(7);
            logOsi("シミュレーターの状態を初期化しました。", "info");
        });
    }
};
