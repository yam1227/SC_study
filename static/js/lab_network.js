/**
 * Module 6: Firewall / IDS-IPS / WAF Lab
 */
window.SecurityLabModules["network"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2" style="grid-template-columns: 1.2fr 0.8fr;">
                <!-- Left: Network topology and simulator -->
                <div class="card">
                    <h3>🛡️ 境界防衛ネットワーク・シミュレーター</h3>
                    <p class="card-subtitle">入力したパケットデータがどのセキュリティ防御デバイスで検知・遮断されるかをビジュアルで確認します。</p>
                    
                    <!-- Predefined attack selection -->
                    <div class="form-group">
                        <label for="netPredefined">学習用プリセット（攻撃シナリオ）の選択:</label>
                        <select id="netPredefined">
                            <option value="normal" selected>正常リクエスト (GET /index.html)</option>
                            <option value="portscan">ポートスキャン攻撃 (L4 探索)</option>
                            <option value="ssh_block">SSH接続要求 (L4 不許可ポート)</option>
                            <option value="os_cmd">OSコマンドインジェクション (L7 シグネチャ)</option>
                            <option value="sqli">SQLインジェクション (L7 アプリ層 - WAF)</option>
                            <option value="xss">クロスサイトスクリプティング (L7 アプリ層 - WAF)</option>
                            <option value="scanner">脆弱性スキャナ (User-Agent 検知 - WAF)</option>
                        </select>
                    </div>
                    
                    <div class="lab-grid-2" style="gap: 16px;">
                        <div class="form-group">
                            <label for="netDestPort">送信先ポート番号 (L4):</label>
                            <input type="number" id="netDestPort" value="80" placeholder="例: 80">
                        </div>
                        <div class="form-group">
                            <label for="netUserAgent">User-Agent ヘッダー (L7):</label>
                            <input type="text" id="netUserAgent" value="Mozilla/5.0 (Windows NT 10.0)" placeholder="User-Agent">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="netPayload">データ部 (Payload - L7):</label>
                        <textarea id="netPayload" class="jwt-editor" style="height: 80px;" placeholder="パケットのデータ部を入力してください..."></textarea>
                    </div>
                    
                    <button class="btn btn-primary" id="btnSimulatePacket">パケットを送信 (シミュレート)</button>
                    
                    <!-- Visual Network Topology Diagram -->
                    <div style="background-color: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 20px; align-items: center; justify-content: center; position: relative; margin-top: 10px;">
                        <div style="font-size: 11px; color: var(--text-secondary); text-align: center; width: 100%; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                            🔗 ネットワーク防衛インフラ（OSI基本参照モデルの対応レイヤー）
                        </div>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 500px; position: relative;">
                            
                            <!-- Client -->
                            <div id="node-client" style="text-align: center; z-index: 2;">
                                <div style="font-size: 24px; background: var(--bg-panel); border: 2px solid var(--text-secondary); border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">💻</div>
                                <span style="font-size: 11px; font-weight: 500;">送信元</span>
                            </div>
                            
                            <!-- Line 1 -->
                            <div style="flex: 1; height: 2px; background-color: var(--border-color); margin: 0 -5px; position: relative;">
                                <div id="dot-1" class="net-dot" style="display: none; position: absolute; top: -4px; width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-primary-hover);"></div>
                            </div>
                            
                            <!-- Firewall -->
                            <div id="node-firewall" style="text-align: center; z-index: 2; transition: var(--transition-normal);">
                                <div style="font-size: 24px; background: var(--bg-panel); border: 2px solid var(--text-secondary); border-radius: var(--radius-sm); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">🧱</div>
                                <span style="font-size: 11px; font-weight: bold; color: #fb7185;">FW</span><br>
                                <span style="font-size: 9px; color: var(--text-secondary);">L3/L4</span>
                            </div>
                            
                            <!-- Line 2 -->
                            <div style="flex: 1; height: 2px; background-color: var(--border-color); margin: 0 -5px; position: relative;">
                                <div id="dot-2" class="net-dot" style="display: none; position: absolute; top: -4px; width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-primary-hover);"></div>
                            </div>
                            
                            <!-- IDS/IPS -->
                            <div id="node-idsips" style="text-align: center; z-index: 2; transition: var(--transition-normal);">
                                <div style="font-size: 24px; background: var(--bg-panel); border: 2px solid var(--text-secondary); border-radius: var(--radius-sm); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">👁️</div>
                                <span style="font-size: 11px; font-weight: bold; color: #fbbf24;">IDS/IPS</span><br>
                                <span style="font-size: 9px; color: var(--text-secondary);">L4〜L7</span>
                            </div>
                            
                            <!-- Line 3 -->
                            <div style="flex: 1; height: 2px; background-color: var(--border-color); margin: 0 -5px; position: relative;">
                                <div id="dot-3" class="net-dot" style="display: none; position: absolute; top: -4px; width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-primary-hover);"></div>
                            </div>
                            
                            <!-- WAF -->
                            <div id="node-waf" style="text-align: center; z-index: 2; transition: var(--transition-normal);">
                                <div style="font-size: 24px; background: var(--bg-panel); border: 2px solid var(--text-secondary); border-radius: var(--radius-sm); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">🛡️</div>
                                <span style="font-size: 11px; font-weight: bold; color: #38bdf8;">WAF</span><br>
                                <span style="font-size: 9px; color: var(--text-secondary);">L7</span>
                            </div>
                            
                            <!-- Line 4 -->
                            <div style="flex: 1; height: 2px; background-color: var(--border-color); margin: 0 -5px; position: relative;">
                                <div id="dot-4" class="net-dot" style="display: none; position: absolute; top: -4px; width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-primary-hover);"></div>
                            </div>
                            
                            <!-- Web Server -->
                            <div id="node-server" style="text-align: center; z-index: 2; transition: var(--transition-normal);">
                                <div style="font-size: 24px; background: var(--bg-panel); border: 2px solid var(--text-secondary); border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">🖥️</div>
                                <span style="font-size: 11px; font-weight: 500;">サーバー</span>
                            </div>
                            
                        </div>
                    </div>
                </div>
                
                <!-- Right: Analysis results and explanations -->
                <div class="card">
                    <h3>🔍 パケット検知結果分析</h3>
                    <p class="card-subtitle">送信されたパケットのセキュリティ審査レポートです。</p>
                    
                    <div class="form-group">
                        <label>判定結果:</label>
                        <div class="response-box" id="netResultBox" style="min-height: 120px;">
                            <code id="netResultText">パケットを送信してください。</code>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>セキスペ知識解説:</label>
                        <div id="netExplanation" style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                            <b>・ファイアウォール</b>: 主にIPアドレス（L3）やポート番号（L4）といったヘッダー情報に基づいて通信を制御します。データ部（L7）の中身までは検査しません。<br><br>
                            <b>・IDS/IPS</b>: L4からL7のデータをスキャンし、あらかじめ登録された悪意あるパターン（シグネチャ）と一致するパケットを検知（IDS）・遮断（IPS）します。OSの脆弱性攻撃やワーム等に効果的です。<br><br>
                            <b>・WAF</b>: L7（アプリケーション層）のHTTPプロトコルに特化し、SQLiやXSS、Cookie改ざんなどWeb特有の攻撃を高精度に検知・防御します。
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        const netPredefined = document.getElementById("netPredefined");
        const netDestPort = document.getElementById("netDestPort");
        const netUserAgent = document.getElementById("netUserAgent");
        const netPayload = document.getElementById("netPayload");
        const btnSimulatePacket = document.getElementById("btnSimulatePacket");
        const netResultBox = document.getElementById("netResultBox");
        const netResultText = document.getElementById("netResultText");
        
        // Node DOM references
        const nodeFw = document.getElementById("node-firewall");
        const nodeIds = document.getElementById("node-idsips");
        const nodeWaf = document.getElementById("node-waf");
        const nodeServer = document.getElementById("node-server");
        
        const dots = [
            document.getElementById("dot-1"),
            document.getElementById("dot-2"),
            document.getElementById("dot-3"),
            document.getElementById("dot-4")
        ];
        
        // Predefined attacks configuration map
        const presets = {
            "normal": { port: 80, ua: "Mozilla/5.0 (Macintosh)", payload: "GET /index.html HTTP/1.1\nHost: example.com" },
            "portscan": { port: 80, ua: "Mozilla/5.0", payload: "PORTSCAN: Probe all ports from 1 to 65535" },
            "ssh_block": { port: 22, ua: "SSH-2.0-OpenSSH_9.0", payload: "SSH initialization packet" },
            "os_cmd": { port: 80, ua: "curl/7.88.1", payload: "GET /query?ip=127.0.0.1; rm -rf / HTTP/1.1" },
            "sqli": { port: 80, ua: "Mozilla/5.0", payload: "username=admin' or 1=1 --&password=invalid" },
            "xss": { port: 80, ua: "Mozilla/5.0", payload: "search_query=<script>alert('XSS')</script>" },
            "scanner": { port: 80, ua: "sqlmap/1.7.5#stable", payload: "GET /product?id=5 HTTP/1.1" }
        };
        
        // Preset select handler
        netPredefined.addEventListener("change", () => {
            const pre = presets[netPredefined.value];
            if (pre) {
                netDestPort.value = pre.port;
                netUserAgent.value = pre.ua;
                netPayload.value = pre.payload;
            }
        });
        
        // Trigger initial select values
        netPredefined.dispatchEvent(new Event("change"));
        
        // Simulate handler
        btnSimulatePacket.addEventListener("click", async () => {
            btnSimulatePacket.disabled = true;
            netResultText.innerText = "パケット解析中...";
            netResultBox.style.borderColor = "var(--border-color)";
            
            // Reset node highlights
            nodeFw.style.borderColor = "var(--text-secondary)";
            nodeIds.style.borderColor = "var(--text-secondary)";
            nodeWaf.style.borderColor = "var(--text-secondary)";
            nodeServer.style.borderColor = "var(--text-secondary)";
            dots.forEach(d => { d.style.display = "none"; d.style.left = "0%"; });
            
            const reqData = {
                src_ip: "192.168.1.50",
                dest_port: parseInt(netDestPort.value) || 80,
                headers: { "User-Agent": netUserAgent.value },
                payload: netPayload.value
            };
            
            try {
                const res = await app.apiCall("/api/network/simulate", "POST", reqData);
                
                // Animation steps
                let step = 0;
                
                const animateStep = () => {
                    if (step === 0) {
                        // 1. Move Client -> FW
                        dots[0].style.display = "block";
                        animateDot(dots[0], () => {
                            if (res.blocked && res.device.includes("Firewall")) {
                                nodeFw.style.borderColor = "var(--color-danger)";
                                showResult(res);
                                btnSimulatePacket.disabled = false;
                            } else {
                                nodeFw.style.borderColor = "var(--color-success)";
                                step = 1;
                                animateStep();
                            }
                        });
                    } else if (step === 1) {
                        // 2. Move FW -> IDS/IPS
                        dots[1].style.display = "block";
                        animateDot(dots[1], () => {
                            if (res.blocked && res.device.includes("IDS/IPS")) {
                                nodeIds.style.borderColor = "var(--color-danger)";
                                showResult(res);
                                btnSimulatePacket.disabled = false;
                            } else {
                                nodeIds.style.borderColor = "var(--color-success)";
                                step = 2;
                                animateStep();
                            }
                        });
                    } else if (step === 2) {
                        // 3. Move IDS/IPS -> WAF
                        dots[2].style.display = "block";
                        animateDot(dots[2], () => {
                            if (res.blocked && res.device.includes("WAF")) {
                                nodeWaf.style.borderColor = "var(--color-danger)";
                                showResult(res);
                                btnSimulatePacket.disabled = false;
                            } else {
                                nodeWaf.style.borderColor = "var(--color-success)";
                                step = 3;
                                animateStep();
                            }
                        });
                    } else if (step === 3) {
                        // 4. Move WAF -> Server
                        dots[3].style.display = "block";
                        animateDot(dots[3], () => {
                            nodeServer.style.borderColor = "var(--color-success)";
                            showResult(res);
                            btnSimulatePacket.disabled = false;
                        });
                    }
                };
                
                animateStep();
                
            } catch (e) {
                netResultText.innerText = "エラー: " + e.message;
                btnSimulatePacket.disabled = false;
            }
        });
        
        // Dot animation helper
        function animateDot(dotEl, callback) {
            let pos = 0;
            const interval = setInterval(() => {
                if (pos >= 90) {
                    clearInterval(interval);
                    callback();
                } else {
                    pos += 10;
                    dotEl.style.left = pos + "%";
                }
            }, 50);
        }
        
        function showResult(res) {
            if (res.blocked) {
                netResultBox.style.borderColor = "var(--color-danger)";
                netResultText.innerHTML = `
                    <span style="color: var(--color-danger); font-weight: bold;">❌ 遮断 (BLOCKED)</span>
                    <br>・検知デバイス: <b>${res.device}</b>
                    <br>・処理レイヤー: <b>${res.layer}</b>
                    <br>・検知理由: <span style="color: #fb7185;">${res.reason}</span>
                    <br>・処理動作: <b style="color: var(--color-danger);">${res.action}</b>
                `;
            } else {
                netResultBox.style.borderColor = "var(--color-success)";
                netResultText.innerHTML = `
                    <span style="color: var(--color-success); font-weight: bold;">🟢 通過 (ALLOWED)</span>
                    <br>・宛先: <b>${res.device}</b>
                    <br>・処理内容: <span style="color: var(--color-primary-hover);">${res.reason}</span>
                    <br>・レスポンス: <b>${res.action}</b>
                `;
            }
        }
    }
};
