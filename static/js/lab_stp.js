/**
 * Module 18: Spanning Tree Protocol (STP / IEEE 802.1D & RSTP) Simulator
 * IPA 情報処理安全確保支援士 (セキスペ) 令和5年春期 午前II 問19 題材
 */
window.SecurityLabModules["stp"] = {
    html: `
        <div class="lab-container">
            <!-- Header Banner -->
            <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(15, 23, 42, 0.8)); border-left: 4px solid #6366f1;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 1.3rem; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                            <span>🌲</span> スパニングツリープロトコル (STP / IEEE 802.1D)
                            <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4);">令和5年春 AM2 問19 出題題材</span>
                        </h2>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">
                            スイッチドネットワークにおけるL2ループ（ブロードキャストストーム）を防ぐ構造、ルートブリッジ選出、ポート役割（RP, DP, BP）決定アルゴリズムをインタラクティブにマスターします。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Main Tab Navigation -->
            <div class="card-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; overflow-x: auto;">
                <button id="stpTabBtn-topo" class="btn-tab active" onclick="window.stpLab.switchTab('topo')" style="padding: 9px 16px; font-size: 13px; font-weight: 600;">
                    🌐 1. トポロジ & STP選出シミュレータ
                </button>
                <button id="stpTabBtn-storm" class="btn-tab" onclick="window.stpLab.switchTab('storm')" style="padding: 9px 16px; font-size: 13px; font-weight: 600;">
                    ⚡ 2. パケットループ & ストーム検証
                </button>
                <button id="stpTabBtn-bpdu" class="btn-tab" onclick="window.stpLab.switchTab('bpdu')" style="padding: 9px 16px; font-size: 13px; font-weight: 600;">
                    📦 3. BPDU構造 & STP vs RSTP
                </button>
                <button id="stpTabBtn-exam" class="btn-tab" onclick="window.stpLab.switchTab('exam')" style="padding: 9px 16px; font-size: 13px; font-weight: 600;">
                    📝 4. 過去問演習 (令和5年春 AM2 問19)
                </button>
            </div>

            <!-- TAB 1: Topology & Calculation -->
            <div id="stpTab-topo" class="tab-content" style="display: block;">
                <div class="lab-grid-2" style="grid-template-columns: 1.2fr 0.8fr; gap: 20px;">
                    <!-- Left: SVG Topology & Interactive Map -->
                    <div class="card" style="display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1rem;">📡 ネットワークトポロジ (L2 スイッチ構成)</h3>
                            <div style="display: flex; gap: 8px;">
                                <label style="font-size: 0.8rem; color: var(--text-secondary);">プリセット:</label>
                                <select id="stpPresetSelect" onchange="window.stpLab.changePreset(this.value)" style="padding: 4px 8px; background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm); font-size: 0.8rem;">
                                    <option value="3_switch" selected>3台三角形構成 (標準3L2SW)</option>
                                    <option value="4_switch">4台ダイヤモンド構成 (多重冗長化)</option>
                                </select>
                            </div>
                        </div>

                        <!-- SVG Network Canvas -->
                        <div style="position: relative; width: 100%; height: 360px; background: #0f1015; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden;">
                            <svg id="stpSvgCanvas" width="100%" height="100%" viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg">
                                <!-- Dynamic Link lines & Switch Nodes rendered via JS -->
                            </svg>

                            <!-- Legend Overlay -->
                            <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.75); padding: 8px 12px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #2d2d35; display: flex; gap: 12px; flex-wrap: wrap;">
                                <div><span style="display: inline-block; width: 10px; height: 10px; background: #10b981; border-radius: 50%; margin-right: 4px;"></span> Forwarding (転送可能)</div>
                                <div><span style="display: inline-block; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; margin-right: 4px;"></span> Blocking (遮断)</div>
                                <div><span style="display: inline-block; width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; margin-right: 4px;"></span> Root Bridge (頂点)</div>
                            </div>
                        </div>

                        <!-- Control Actions -->
                        <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button class="btn btn-primary" onclick="window.stpLab.runSTPCalculation()" style="padding: 8px 16px; font-size: 0.85rem;">
                                ⚙️ STP選出アルゴリズムを再計算
                            </button>
                        </div>
                    </div>

                    <!-- Right: Switch & Link Parameters Controls -->
                    <div class="card" style="display: flex; flex-direction: column;">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">🎛️ ブリッジ & リンク設定</h3>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px;">
                            各スイッチのプライオリティ（小さ数値がルート選出で優位）およびリンク速度・コストを変更して選出結果の変化を実験できます。
                        </p>

                        <div id="stpBridgeControlsContainer" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px;">
                            <!-- Rendered by JS -->
                        </div>
                    </div>
                </div>

                <!-- STP Calculation Execution Logs -->
                <div class="card" style="margin-top: 20px;">
                    <h3 style="font-size: 1rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <span>📋</span> STP選出ロジック・詳細トレースログ
                    </h3>
                    <div id="stpCalcLogBox" style="background: #09090b; border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; font-family: var(--font-mono); font-size: 0.8rem; color: #a1a1aa; max-height: 250px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;">
                        ボタンを押すとSTP選出アルゴリズムが実行されます。
                    </div>
                </div>
            </div>

            <!-- TAB 2: Storm & Loop Simulation -->
            <div id="stpTab-storm" class="tab-content" style="display: none;">
                <div class="lab-grid-2" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">⚡ L2ループ・ブロードキャストストームの実験</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
                            スイッチ間にループ経路がある環境で、STPを有効（ポートの一部をブロック）した場合と無効（全ポート転送）にした場合でのブロードキャストフレーム（例: ARP Request）の挙動を比較します。
                        </p>

                        <div style="background: var(--bg-app); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 16px;">
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label style="font-size: 0.85rem; font-weight: 600;">STPの動作状態:</label>
                                <div style="display: flex; gap: 16px; margin-top: 6px;">
                                    <label style="cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                                        <input type="radio" name="stpEnableRadio" value="true" checked onchange="window.stpLab.setStpState(true)">
                                        <span style="color: #10b981; font-weight: 600;">✅ STP 有効 (ブロックポートあり)</span>
                                    </label>
                                    <label style="cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                                        <input type="radio" name="stpEnableRadio" value="false" onchange="window.stpLab.setStpState(false)">
                                        <span style="color: #ef4444; font-weight: 600;">❌ STP 無効 (ループ放置)</span>
                                    </label>
                                </div>
                            </div>

                            <button class="btn btn-primary" onclick="window.stpLab.triggerFrameSimulation()" style="width: 100%; margin-top: 8px;">
                                🚀 送信元 Switch A から ARP ブロードキャスト送信
                            </button>
                        </div>

                        <!-- Status Alert Box -->
                        <div id="stpStormStatusBox" style="padding: 12px; border-radius: 6px; font-size: 0.85rem; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #34d399;">
                            STP有効: ループ経路のポートが遮断されているため、ブロードキャストストームは発生しません。
                        </div>
                    </div>

                    <!-- Simulation Log Display -->
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">📡 パケット転送トレース</h3>
                        <div id="stpSimLogBox" style="background: #09090b; border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; font-family: var(--font-mono); font-size: 0.8rem; color: #e4e4e7; height: 320px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6;">
                            「ARPブロードキャスト送信」を押すと、フレームがネットワーク内をどのように移動するか出力されます。
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 3: BPDU & STP vs RSTP -->
            <div id="stpTab-bpdu" class="tab-content" style="display: none;">
                <div class="lab-grid-2" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- BPDU Packet Structure -->
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">📦 BPDU (Bridge Protocol Data Unit) フレーム構造</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">
                            STP対応スイッチは互いに <strong>BPDU</strong> と呼ばれる制御フレームをマルチキャスト送信 (01-80-C2-00-00-00) し合い、情報を交換します。
                        </p>

                        <div style="background: #09090b; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; font-size: 0.8rem; line-height: 1.6;">
                            <div style="border-bottom: 1px solid #27272a; padding-bottom: 6px; margin-bottom: 8px; color: #818cf8; font-weight: 600;">
                                Configuration BPDU Header / Data
                            </div>
                            <table style="width: 100%; text-align: left; border-collapse: collapse;">
                                <tbody>
                                    <tr style="border-bottom: 1px solid #18181b;">
                                        <td style="color: var(--text-secondary); padding: 4px;">Protocol ID</td>
                                        <td style="color: #a1a1aa;">0x0000 (IEEE 802.1D STP)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #18181b;">
                                        <td style="color: var(--text-secondary); padding: 4px;">Version ID</td>
                                        <td style="color: #a1a1aa;">0x00 (STP) / 0x02 (RSTP)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #18181b;">
                                        <td style="color: var(--text-secondary); padding: 4px;">BPDU Type</td>
                                        <td style="color: #a1a1aa;">0x00 (Configuration) / 0x80 (TCN)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #18181b; background: rgba(99, 102, 241, 0.1);">
                                        <td style="color: #d97706; font-weight: 600; padding: 4px;">Root ID (Root BID)</td>
                                        <td style="color: #d97706;">Priority (4096) + Root MAC (00:11:22...)</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #18181b; background: rgba(16, 185, 129, 0.1);">
                                        <td style="color: #34d399; font-weight: 600; padding: 4px;">Root Path Cost</td>
                                        <td style="color: #34d399;">送信元SWからルートまでの合計コスト</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #18181b;">
                                        <td style="color: var(--text-secondary); padding: 4px;">Sender Bridge ID</td>
                                        <td style="color: #a1a1aa;">送信元SWの Priority + MAC</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #18181b;">
                                        <td style="color: var(--text-secondary); padding: 4px;">Port ID</td>
                                        <td style="color: #a1a1aa;">Port Priority + Port Number</td>
                                    </tr>
                                    <tr>
                                        <td style="color: var(--text-secondary); padding: 4px;">Timers</td>
                                        <td style="color: #a1a1aa;">Hello: 2s, Max Age: 20s, Fwd Delay: 15s</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- STP vs RSTP Comparison -->
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">⚖️ STP (802.1D) と RSTP (802.1w) の比較</h3>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.82rem;">
                            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                                <div style="font-weight: 600; color: #d97706; margin-bottom: 6px;">1. 収束時間 (Convergence Speed)</div>
                                <ul style="padding-left: 18px; color: var(--text-secondary); line-height: 1.5;">
                                    <li><strong>STP (802.1D):</strong> 約 30 〜 50 秒（Listening: 15s → Learning: 15s タイマー経過後にForwarding化）</li>
                                    <li><strong>RSTP (802.1w):</strong> 数秒以内（Proposal / Agreement ハンドシェイクにより即座に状態遷移）</li>
                                </ul>
                            </div>

                            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                                <div style="font-weight: 600; color: #818cf8; margin-bottom: 6px;">2. ポート役割 (Port Roles) の拡張</div>
                                <ul style="padding-left: 18px; color: var(--text-secondary); line-height: 1.5;">
                                    <li><strong>STP:</strong> Root Port, Designated Port, Non-Designated (Blocked) Port</li>
                                    <li><strong>RSTP:</strong> 追加として <strong>Alternate Port</strong>（RPの代替バックアップ）, <strong>Backup Port</strong>（DPの代替）を明確化</li>
                                </ul>
                            </div>

                            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                                <div style="font-weight: 600; color: #34d399; margin-bottom: 6px;">3. ポート状態 (Port States) の簡略化</div>
                                <p style="color: var(--text-secondary); line-height: 1.4;">
                                    RSTPでは、Disabled / Blocking / Listening の3つを <strong>Discarding (破棄)</strong> 状態へ統合。
                                    <br>「Discarding → Learning → Forwarding」のシンプル3状態モデルへ進化。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 4: Exam Practice (R5 Spring AM2 Q19) -->
            <div id="stpTab-exam" class="tab-content" style="display: none;">
                <div class="card">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">過去問題</span>
                        <h3 style="font-size: 1.1rem;">情報処理安全確保支援士 令和5年春期 午前II 問19</h3>
                    </div>

                    <div style="background: #09090b; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.7; color: var(--text-primary);">
                        <strong>【問題】</strong><br>
                        スパニングツリープロトコルが適用されている複数のブリッジから成るネットワークにおいて，任意の一つのリンクの両端のブリッジのうち，ルートブリッジまでの経路コストが小さいブリッジの側にあるポートを何と呼ぶか。
                    </div>

                    <!-- Choices Buttons -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                        <button id="stpChoice-a" onclick="window.stpLab.checkExamAnswer('a')" style="padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); text-align: left; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                            ア. アクセスポート (Access Port)
                        </button>
                        <button id="stpChoice-i" onclick="window.stpLab.checkExamAnswer('i')" style="padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); text-align: left; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                            イ. 代表ポート (Designated Port)
                        </button>
                        <button id="stpChoice-u" onclick="window.stpLab.checkExamAnswer('u')" style="padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); text-align: left; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                            ウ. トランクポート (Trunk Port)
                        </button>
                        <button id="stpChoice-e" onclick="window.stpLab.checkExamAnswer('e')" style="padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); text-align: left; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                            エ. ルートポート (Root Port)
                        </button>
                    </div>

                    <!-- Explanation Result Box -->
                    <div id="stpExamResultBox" style="display: none; padding: 16px; border-radius: 8px; font-size: 0.9rem; line-height: 1.6;">
                        <!-- Rendered by JS -->
                    </div>
                </div>
            </div>
        </div>
    `,

    references: [
        { source: "IPA 独立行政法人 情報処理推進機構", title: "情報処理安全確保支援士試験 シラバス（試験範囲）", url: "https://www.ipa.go.jp/shiken/syllabus/gaiyou.html" },
        { source: "情報処理安全確保支援士ドットコム", title: "令和5年春期 午前II 問19 過去問解説", url: "https://www.sc-siken.com/kakomon/05_haru/am2_19.html" },
        { source: "IEEE Standards Association", title: "IEEE 802.1D Media Access Control (MAC) Bridges & IEEE 802.1w Rapid Reconfiguration", url: "https://standards.ieee.org/" },
        { source: "Cisco Systems", title: "スパニングツリー プロトコル（STP）のテクノロジーに関するガイドラインと概念", url: "https://www.cisco.com/c/ja_jp/support/docs/lan-switching/spanning-tree-protocol/10556-16.html" }
    ],

    init: function () {
        const self = this;
        window.stpLab = {
            activeTab: "topo",
            preset: "3_switch",
            stpEnabled: true,
            
            bridges: [],
            links: [],
            portRoles: {},
            
            switchTab: function (tabId) {
                self.switchTab(tabId);
            },
            changePreset: function (presetKey) {
                this.preset = presetKey;
                self.loadPreset(presetKey);
            },
            runSTPCalculation: function () {
                self.calculateSTP();
            },
            setStpState: function (enabled) {
                this.stpEnabled = enabled;
                const statusBox = document.getElementById("stpStormStatusBox");
                if (enabled) {
                    statusBox.style.background = "rgba(16, 185, 129, 0.1)";
                    statusBox.style.border = "1px solid #10b981";
                    statusBox.style.color = "#34d399";
                    statusBox.innerHTML = "✅ STP有効: ループ経路のポートが遮断されているため、ブロードキャストストームは発生しません。";
                } else {
                    statusBox.style.background = "rgba(239, 68, 68, 0.1)";
                    statusBox.style.border = "1px solid #ef4444";
                    statusBox.style.color = "#f87171";
                    statusBox.innerHTML = "❌ STP無効: リンクがすべて転送状態となり、ブロードキャストが無限ループしてネットワークを麻痺させます。";
                }
            },
            triggerFrameSimulation: function () {
                self.runFrameSimulation();
            },
            checkExamAnswer: function (choice) {
                self.checkExamAnswer(choice);
            }
        };

        self.loadPreset("3_switch");
    },

    switchTab: function (tabId) {
        window.stpLab.activeTab = tabId;
        const tabs = ["topo", "storm", "bpdu", "exam"];
        tabs.forEach(t => {
            const btn = document.getElementById(`stpTabBtn-${t}`);
            const content = document.getElementById(`stpTab-${t}`);
            if (btn && content) {
                if (t === tabId) {
                    btn.classList.add("active");
                    content.style.display = "block";
                } else {
                    btn.classList.remove("active");
                    content.style.display = "none";
                }
            }
        });
    },

    loadPreset: function (presetKey) {
        if (presetKey === "3_switch") {
            window.stpLab.bridges = [
                { id: "SW-A", name: "Switch A (ルート候補)", priority: 4096, mac: "00:11:22:33:44:AA", x: 300, y: 70 },
                { id: "SW-B", name: "Switch B", priority: 8192, mac: "00:11:22:33:44:BB", x: 120, y: 260 },
                { id: "SW-C", name: "Switch C", priority: 32768, mac: "00:11:22:33:44:CC", x: 480, y: 260 }
            ];
            window.stpLab.links = [
                { id: "link-AB", bridge_a: "SW-A", port_a: "Gi0/1", bridge_b: "SW-B", port_b: "Gi0/1", speed: "1Gbps", cost: 4 },
                { id: "link-BC", bridge_a: "SW-B", port_a: "Gi0/2", bridge_b: "SW-C", port_b: "Gi0/2", speed: "1Gbps", cost: 4 },
                { id: "link-CA", bridge_a: "SW-C", port_a: "Gi0/1", bridge_b: "SW-A", port_b: "Gi0/2", speed: "1Gbps", cost: 4 }
            ];
        } else if (presetKey === "4_switch") {
            window.stpLab.bridges = [
                { id: "SW-A", name: "Switch A (Root)", priority: 4096, mac: "00:11:22:33:44:AA", x: 300, y: 60 },
                { id: "SW-B", name: "Switch B", priority: 8192, mac: "00:11:22:33:44:BB", x: 140, y: 180 },
                { id: "SW-C", name: "Switch C", priority: 16384, mac: "00:11:22:33:44:CC", x: 460, y: 180 },
                { id: "SW-D", name: "Switch D", priority: 32768, mac: "00:11:22:33:44:DD", x: 300, y: 290 }
            ];
            window.stpLab.links = [
                { id: "link-AB", bridge_a: "SW-A", port_a: "Gi0/1", bridge_b: "SW-B", port_b: "Gi0/1", speed: "1Gbps", cost: 4 },
                { id: "link-AC", bridge_a: "SW-A", port_a: "Gi0/2", bridge_b: "SW-C", port_b: "Gi0/1", speed: "1Gbps", cost: 4 },
                { id: "link-BD", bridge_a: "SW-B", port_a: "Gi0/2", bridge_b: "SW-D", port_b: "Gi0/1", speed: "1Gbps", cost: 4 },
                { id: "link-CD", bridge_a: "SW-C", port_a: "Gi0/2", bridge_b: "SW-D", port_b: "Gi0/2", speed: "1Gbps", cost: 4 },
                { id: "link-BC", bridge_a: "SW-B", port_a: "Gi0/3", bridge_b: "SW-C", port_b: "Gi0/3", speed: "100Mbps", cost: 19 }
            ];
        }

        this.renderControls();
        this.calculateSTP();
    },

    renderControls: function () {
        const container = document.getElementById("stpBridgeControlsContainer");
        if (!container) return;

        let html = "";
        window.stpLab.bridges.forEach((b, idx) => {
            html += `
                <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px;">
                    <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 6px; display: flex; justify-content: space-between;">
                        <span>🏢 ${b.name} (${b.id})</span>
                        <span style="color: var(--text-muted); font-size: 0.75rem;">MAC: ${b.mac}</span>
                    </div>
                    <div class="form-group" style="margin-bottom: 4px;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary);">ブリッジ優先度 (Priority):</label>
                        <select onchange="window.stpLab.bridges[${idx}].priority = parseInt(this.value); window.stpLab.runSTPCalculation();" style="width: 100%; padding: 4px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; font-size: 0.8rem;">
                            <option value="4096" ${b.priority === 4096 ? 'selected' : ''}>4096 (最高優先度)</option>
                            <option value="8192" ${b.priority === 8192 ? 'selected' : ''}>8192</option>
                            <option value="16384" ${b.priority === 16384 ? 'selected' : ''}>16384</option>
                            <option value="32768" ${b.priority === 32768 ? 'selected' : ''}>32768 (デフォルト)</option>
                            <option value="61440" ${b.priority === 61440 ? 'selected' : ''}>61440 (最低優先度)</option>
                        </select>
                    </div>
                </div>
            `;
        });

        html += `<div style="margin-top: 8px; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">🔗 リンク速度・コスト設定</div>`;
        window.stpLab.links.forEach((l, idx) => {
            html += `
                <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.78rem; color: var(--text-primary);">${l.bridge_a}:${l.port_a} ↔ ${l.bridge_b}:${l.port_b}</span>
                    <select onchange="const c = parseInt(this.value); window.stpLab.links[${idx}].cost = c; window.stpLab.runSTPCalculation();" style="padding: 2px 6px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; font-size: 0.75rem;">
                        <option value="4" ${l.cost === 4 ? 'selected' : ''}>1Gbps (Cost 4)</option>
                        <option value="19" ${l.cost === 19 ? 'selected' : ''}>100Mbps (Cost 19)</option>
                        <option value="100" ${l.cost === 100 ? 'selected' : ''}>10Mbps (Cost 100)</option>
                    </select>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    calculateSTP: async function () {
        const logBox = document.getElementById("stpCalcLogBox");
        if (logBox) logBox.innerHTML = "⌛ STPトポロジ選出を計算中...";

        try {
            const res = await fetch("/api/stp/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bridges: window.stpLab.bridges,
                    links: window.stpLab.links
                })
            });

            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            window.stpLab.portRoles = data.port_roles;
            window.stpLab.rootBridgeId = data.root_bridge_id;

            if (logBox) {
                logBox.innerHTML = data.calculation_steps.join("\n");
            }

            this.renderSvgTopology(data);
        } catch (err) {
            if (logBox) logBox.innerHTML = `❌ STP計算エラー: ${err.message}`;
        }
    },

    renderSvgTopology: function (calcData) {
        const svg = document.getElementById("stpSvgCanvas");
        if (!svg) return;

        let innerSvg = "";
        const portRoles = calcData.port_roles;
        const rootId = calcData.root_bridge_id;

        window.stpLab.links.forEach(l => {
            const bA = window.stpLab.bridges.find(b => b.id === l.bridge_a);
            const bB = window.stpLab.bridges.find(b => b.id === l.bridge_b);
            if (!bA || !bB) return;

            const roleA = portRoles[`${l.bridge_a}:${l.port_a}`] || {};
            const roleB = portRoles[`${l.bridge_b}:${l.port_b}`] || {};

            const isBlocked = (roleA.state === "Blocking" || roleB.state === "Blocking");
            const strokeColor = isBlocked ? "#ef4444" : "#10b981";
            const strokeDash = isBlocked ? "6 4" : "none";

            innerSvg += `
                <line x1="${bA.x}" y1="${bA.y}" x2="${bB.x}" y2="${bB.y}" 
                      stroke="${strokeColor}" stroke-width="3" stroke-dasharray="${strokeDash}" />
                
                <rect x="${(bA.x + bB.x) / 2 - 24}" y="${(bA.y + bB.y) / 2 - 10}" width="48" height="18" rx="4" fill="#18181b" stroke="#3f3f46" />
                <text x="${(bA.x + bB.x) / 2}" y="${(bA.y + bB.y) / 2 + 3}" fill="#a1a1aa" font-size="10" text-anchor="middle" font-family="sans-serif">Cost ${l.cost}</text>
            `;

            const dx = bB.x - bA.x;
            const dy = bB.y - bA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const offset = 40;

            const pxA = bA.x + (dx / dist) * offset;
            const pyA = bA.y + (dy / dist) * offset;
            const pxB = bB.x - (dx / dist) * offset;
            const pyB = bB.y - (dy / dist) * offset;

            const getRoleTag = (rObj) => {
                if (rObj.role && rObj.role.includes("ルートポート")) return { text: "RP", bg: "#3b82f6" };
                if (rObj.role && rObj.role.includes("代表ポート")) return { text: "DP", bg: "#10b981" };
                return { text: "BP", bg: "#ef4444" };
            };

            const tagA = getRoleTag(roleA);
            const tagB = getRoleTag(roleB);

            innerSvg += `
                <circle cx="${pxA}" cy="${pyA}" r="11" fill="${tagA.bg}" />
                <text x="${pxA}" y="${pyA + 4}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">${tagA.text}</text>
                
                <circle cx="${pxB}" cy="${pyB}" r="11" fill="${tagB.bg}" />
                <text x="${pxB}" y="${pyB + 4}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">${tagB.text}</text>
            `;
        });

        window.stpLab.bridges.forEach(b => {
            const isRoot = (b.id === rootId);
            const rectFill = isRoot ? "#1e1b4b" : "#18181b";
            const strokeColor = isRoot ? "#fbbf24" : "#3f3f46";
            const strokeWidth = isRoot ? "2" : "1";

            innerSvg += `
                <g transform="translate(${b.x - 65}, ${b.y - 25})">
                    <rect width="130" height="50" rx="8" fill="${rectFill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                    ${isRoot ? '<polygon points="65,2 72,12 58,12" fill="#fbbf24" />' : ''}
                    <text x="65" y="20" fill="#fafafa" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">${b.id} ${isRoot ? '👑' : ''}</text>
                    <text x="65" y="36" fill="#a1a1aa" font-size="9" text-anchor="middle" font-family="sans-serif">Prio: ${b.priority}</text>
                </g>
            `;
        });

        svg.innerHTML = innerSvg;
    },

    runFrameSimulation: async function () {
        const logBox = document.getElementById("stpSimLogBox");
        if (logBox) logBox.innerHTML = "🚀 フレーム送出シミュレーション中...";

        try {
            const res = await fetch("/api/stp/simulate_frame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stp_enabled: window.stpLab.stpEnabled,
                    bridges: window.stpLab.bridges,
                    links: window.stpLab.links,
                    source_bridge_id: "SW-A"
                })
            });

            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            if (logBox) {
                logBox.innerHTML = data.events.join("\n");
            }
        } catch (err) {
            if (logBox) logBox.innerHTML = `❌ シミュレーションエラー: ${err.message}`;
        }
    },

    checkExamAnswer: function (choice) {
        const resultBox = document.getElementById("stpExamResultBox");
        if (!resultBox) return;

        const isCorrect = (choice === "i");

        const buttons = ["a", "i", "u", "e"];
        buttons.forEach(bKey => {
            const btn = document.getElementById(`stpChoice-${bKey}`);
            if (btn) {
                btn.style.border = "1px solid var(--border-color)";
                btn.style.background = "var(--bg-card)";
            }
        });

        const selectedBtn = document.getElementById(`stpChoice-${choice}`);

        if (isCorrect) {
            if (selectedBtn) {
                selectedBtn.style.border = "2px solid #10b981";
                selectedBtn.style.background = "rgba(16, 185, 129, 0.15)";
            }
            resultBox.style.display = "block";
            resultBox.style.background = "rgba(16, 185, 129, 0.1)";
            resultBox.style.border = "1px solid #10b981";
            resultBox.style.color = "#34d399";
            resultBox.innerHTML = `
                <div style="font-weight: bold; font-size: 1.05rem; margin-bottom: 8px;">🎉 正解です！ 【イ. 代表ポート (Designated Port)】</div>
                <p style="color: var(--text-primary); margin-bottom: 8px;">
                    <strong>【解説】</strong><br>
                    スパニングツリープロトコル (STP) では、各リンク（セグメント）ごとに1つ、フレームの転送を担う <strong>「代表ポート (Designated Port / DP)」</strong> が選出されます。
                </p>
                <ul style="padding-left: 18px; color: var(--text-secondary); line-height: 1.6;">
                    <li><strong>選出基準:</strong> 任意の一つのリンクの両端にあるブリッジのうち、<strong>ルートブリッジまでの経路コスト（Root Path Cost）が小さい方のブリッジのポート</strong> が代表ポートとなります。（ルートブリッジの全ポートはルートパスコストが0のためすべて代表ポートになります）。</li>
                    <li><strong>ア. アクセスポート:</strong> VLANにおける単一端末接続ポート。STPの選出用語ではありません。</li>
                    <li><strong>ウ. トランクポート:</strong> 複数VLANのタグフレームを透過するポート。STPの選出用語ではありません。</li>
                    <li><strong>エ. ルートポート (Root Port / RP):</strong> 各<u>非ルートブリッジ</u>において、ルートブリッジへ到達するための経路コストが最小のポートです。</li>
                </ul>
            `;
        } else {
            if (selectedBtn) {
                selectedBtn.style.border = "2px solid #ef4444";
                selectedBtn.style.background = "rgba(239, 68, 68, 0.15)";
            }
            resultBox.style.display = "block";
            resultBox.style.background = "rgba(239, 68, 68, 0.1)";
            resultBox.style.border = "1px solid #ef4444";
            resultBox.style.color = "#f87171";
            resultBox.innerHTML = `
                <div style="font-weight: bold; font-size: 1.05rem; margin-bottom: 8px;">❌ 不正解です。もう一度考えてみましょう！</div>
                <p style="color: var(--text-primary);">
                    ヒント: 各リンク（セグメント）の両端スイッチのうち、ルートブリッジにより近い（経路コストが小さい）スイッチ側のポートが選出されます。
                </p>
            `;
        }
    }
};
