/**
 * Module: Message Authentication Code (MAC) & Digital Signature Lab
 * 情報処理安全確保支援士対策: メッセージ認証符号 (MAC) の仕組み、改ざん検知、およびデジタル署名（否認防止・第三者検証）との対比学習
 */

window.SecurityLabModules = window.SecurityLabModules || {};

window.SecurityLabModules["mac"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="btn btn-tab active" id="btnTabMacSim" style="font-size: 13px; padding: 8px 16px;">① MAC 仕組み ＆ 改ざん検知実験</button>
                <button class="btn btn-tab" id="btnTabMacVSsig" style="font-size: 13px; padding: 8px 16px;">② MAC vs デジタル署名 vs 単純ハッシュ 比較</button>
                <button class="btn btn-tab" id="btnTabMacQuiz" style="font-size: 13px; padding: 8px 16px;">③ セキスペ過去問 ＆ 演習問題</button>
            </div>

            <!-- TAB 1: MAC Mechanics & Tampering Simulator -->
            <div id="panelMacSim" class="tab-panel active">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>🛡️ メッセージ認証符号 (MAC) 改ざん検知シミュレーター</h3>
                    <p class="card-subtitle">
                        送信者（Alice）と受信者（Bob）が共通鍵を事前共有し、通信メッセージの **「完全性（Integrity: 改ざんされていないこと）」** と **「送信元認証（Authenticity: 鍵を知る相手から届いたこと）」** をHMAC-SHA256により確認するメカニズムを体験します。
                    </p>

                    <!-- Simulation Controls -->
                    <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-top: 16px;">
                        <h4 style="margin-top: 0; color: var(--color-primary-hover); font-size: 14px;">✉️ 通信メッセージ ＆ 共有鍵の設定</h4>

                        <div class="lab-grid-2" style="gap: 16px; margin-top: 12px;">
                            <div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="font-size: 13px; font-weight: bold; color: #93c5fd;">🔑 共有鍵 (Shared Secret Key):</label>
                                    <input type="text" id="macSharedKey" value="SharedKeySecret123" style="width: 100%; padding: 8px; background: #09090b; color: #38bdf8; border: 1px solid #0284c7; border-radius: 4px; font-family: monospace; font-weight: bold;">
                                    <span style="font-size: 12px; color: var(--text-secondary);">※AliceとBobのみが知る事前共有鍵です。</span>
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="font-size: 12px; font-weight: bold; color: var(--text-primary);">送信メッセージ (送信者 Alice 入力):</label>
                                    <textarea id="macMessageInput" style="width: 100%; height: 70px; padding: 8px; background: #09090b; color: #fff; border: 1px solid #475569; border-radius: 4px; font-size: 13px;">Transfer 100,000 JPY to Charlie (Account: 12345)</textarea>
                                </div>
                            </div>

                            <div>
                                <!-- Mallory Tampering Option -->
                                <div style="background: rgba(239, 68, 68, 0.08); border: 1px dashed #ef4444; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                    <label for="macTamperToggle" style="cursor: pointer; font-size: 12px; color: #fca5a5; font-weight: bold;">
                                        <input type="checkbox" id="macTamperToggle"> 😈 中間者 (Mallory) によるデータ改ざんを実行
                                    </label>
                                    <div class="form-group" style="margin-top: 8px; margin-bottom: 0;">
                                        <label style="font-size: 12px; color: #f87171;">改ざん後のメッセージ (Bobが受信):</label>
                                        <textarea id="macTamperedMessageInput" style="width: 100%; height: 55px; padding: 6px; background: #18181b; color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; font-size: 12px;">Transfer 900,000 JPY to Mallory (Account: 99999)</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-primary" id="btnExecuteMacSim" style="width: 100%; font-size: 14px; font-weight: bold; margin-top: 10px; cursor: pointer;">
                            🚀 メッセージとMAC（メッセージ認証符号）を送信 ＆ 受信者側で検証
                        </button>
                    </div>

                    <!-- Visual Communication Pipeline & Logs -->
                    <div style="margin-top: 20px;">
                        <h4 style="font-size: 13px; margin-bottom: 8px;">📡 送受信フロー ＆ 検証ログ</h4>
                        <div class="lab-grid-2" style="gap: 16px;">
                            <!-- Alice Node -->
                            <div style="background: #18181b; border: 1px solid #0284c7; border-radius: 6px; padding: 12px;">
                                <div style="font-weight: bold; color: #38bdf8; font-size: 13px; margin-bottom: 6px;">👩 送信者 (Alice)</div>
                                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                                    計算式: <code>HMAC-SHA256(Key, Message)</code><br>
                                    生成されたMAC:<br>
                                    <div style="font-family: monospace; font-size: 12px; color: #38bdf8; background: #09090b; padding: 6px; border-radius: 4px; margin-top: 4px; word-break: break-all;" id="outAliceMac">
                                        (未送信)
                                    </div>
                                </div>
                            </div>

                            <!-- Bob Node -->
                            <div style="background: #18181b; border: 1px solid #10b981; border-radius: 6px; padding: 12px;">
                                <div style="font-weight: bold; color: #34d399; font-size: 13px; margin-bottom: 6px;">👨 受信者 (Bob)</div>
                                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                                    受信用共通鍵で再計算したMAC:<br>
                                    <div style="font-family: monospace; font-size: 12px; color: #34d399; background: #09090b; padding: 6px; border-radius: 4px; margin-top: 4px; word-break: break-all;" id="outBobMac">
                                        (未送信)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Verification Result -->
                        <div class="response-box" id="macResultBox" style="background-color: #0c0a09; min-height: 80px; margin-top: 14px; padding: 12px;">
                            <div id="macResultStatus" style="font-size: 13px; color: #94a3b8;">
                                上記ボタンを押すと、MACの生成・伝送・検証プロセスが表示されます。
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: MAC vs Digital Signature vs Hash -->
            <div id="panelMacVSsig" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>📊 MAC vs デジタル署名 vs 単純ハッシュ関数の決定的な違い</h3>
                    <p class="card-subtitle">
                        情報処理安全確保支援士（セキスペ）試験で超頻出する「MAC」と「デジタル署名」の本質的違いです。<br>
                        なぜMACは **「第三者への真正性証明（否認防止）」** ができないのかを対比表と実演デモでマスターします。
                    </p>

                    <!-- Comparison Table -->
                    <div style="overflow-x: auto; margin-top: 16px;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.05); border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">比較項目</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color); color: #9ca3af;">1. 単純ハッシュ関数 (SHA-256)</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color); color: #60a5fa;">2. メッセージ認証符号 (MAC)</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color); color: #a7f3d0;">3. デジタル署名 (RSA/ECDSA)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">使用する鍵</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">なし (鍵不要)</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #60a5fa; font-weight: bold;">共有鍵 (共通鍵)</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #a7f3d0; font-weight: bold;">送信者の秘密鍵 / 公開鍵</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">メッセージの改ざん検知<br>(完全性 Integrity)</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        ❌ 不可能<br>(攻撃者もハッシュを容易に再計算・偽造可能)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ 可能<br>(鍵を知らない攻撃者は正しいMACを作れない)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ 可能<br>(公開鍵でハッシュを照合)
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">送信者の認証<br>(真正性 Authenticity)</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">❌ 不可能</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ 可能<br>(※共通鍵を保持する送受信者間のみ)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ 可能<br>(送信者の秘密鍵でしか作成不能)
                                    </td>
                                </tr>
                                <tr style="background: rgba(239, 68, 68, 0.08);">
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold; color: #f87171;">
                                        ★ 第三者への証明 ＆ 否認防止<br>(Non-repudiation)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">❌ 不可能</td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171; font-weight: bold;">
                                        ❌ <strong>不可能！（令和6年春問2核心）</strong><br>
                                        受信者も共通鍵を持つため自らMACを作れる。第三者に「Aliceが作った」と証明できない。
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ <strong>唯一可能！</strong><br>
                                        秘密鍵はAliceしか持たないため、第三者(Charlie)もAliceの公開鍵で検証可能。
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Visual Interactive Transfer Demo: R6 Spring Q2 Scene -->
                    <div style="margin-top: 24px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
                        <h4 style="margin-top: 0; color: #f59e0b; font-size: 14px;">🎬 第三者（Charlie）への転送シナリオ実験 (問2のビジュアル解説)</h4>
                        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                            AliceからMAC付きメッセージを受け取ったBobが、そのメッセージとMACを第三者（Charlie）にそのまま転送したシチュエーションを体験してみましょう。
                        </p>

                        <div class="lab-grid-3" style="gap: 12px; align-items: stretch; margin-top: 14px;">
                            <div style="background: #18181b; padding: 12px; border-radius: 6px; border: 1px solid #334155;">
                                <div style="font-weight: bold; color: #38bdf8; font-size: 12px;">👩 1. 送信者 (Alice)</div>
                                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                                    共通鍵 <code>SharedKey</code> を知っている。<br>
                                    メッセージ＋MACをBobへ送信。
                                </div>
                            </div>
                            <div style="background: #18181b; padding: 12px; border-radius: 6px; border: 1px solid #334155;">
                                <div style="font-weight: bold; color: #34d399; font-size: 12px;">👨 2. 受信者 (Bob)</div>
                                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                                    共通鍵 <code>SharedKey</code> を知っている。<br>
                                    完全性を確認後、第三者Charlieへ転送！
                                </div>
                            </div>
                            <div style="background: #18181b; padding: 12px; border-radius: 6px; border: 1px solid #ef4444;">
                                <div style="font-weight: bold; color: #fca5a5; font-size: 12px;">👤 3. 第三者 (Charlie)</div>
                                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                                    共通鍵を知らない！<br>
                                    公開鍵は知っているがMACには公開鍵が使われない。
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-secondary" id="btnTestThirdParty" style="margin-top: 14px; width: 100%; font-size: 12px; color: #f59e0b; border-color: #f59e0b;">
                            🔍 第三者 (Charlie) 視点でMACの検証を試みる
                        </button>

                        <div id="thirdPartyResultBox" style="margin-top: 12px; display: none; padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.6;"></div>
                    </div>
                </div>
            </div>

            <!-- TAB 3: Exam Questions & Practice Cards -->
            <div id="panelMacQuiz" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>📝 情報処理安全確保支援士 過去問 ＆ 演習カード</h3>
                    <p class="card-subtitle">
                        メッセージ認証符号 (MAC) に関するIPA本試験問題です。<br>
                        選択肢を選択して回答し、セキュリティエンジニア視点での解説を確認しましょう。
                    </p>

                    <!-- Question Container -->
                    <div style="display: flex; flex-direction: column; gap: 24px; margin-top: 20px;">
                        
                        <!-- Question 1: R6 Spring AM2 Q2 (Real Exam Question) -->
                        <div class="card" style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color); padding: 18px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-size: 12px; background: #1e3a8a; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: bold;">令和6年春期 午前Ⅱ 問2</span>
                                <span style="font-size: 12px; color: var(--text-secondary);">分類: メッセージ認証符号 (MAC) の性質</span>
                            </div>
                            <h4 style="font-size: 14px; line-height: 1.6; margin-top: 0; color: var(--text-primary);">
                                送信者から受信者にメッセージ認証符号(MAC:Message Authentication Code)を付与したメッセージを送り，次に受信者が第三者に転送した。そのときのMACに関する記述のうち，適切なものはどれか。ここで，共通鍵は送信者と受信者だけが知っており，送信者と受信者のそれぞれの公開鍵は第三者を含めた3名が知っているものとする。
                            </h4>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;" id="qR6SpringOptions">
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR6Spring" data-ans="A" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    ア. MACは，送信者がメッセージと共通鍵を用いて生成する。MACを用いると，受信者がメッセージの完全性を確認できる。
                                </button>
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR6Spring" data-ans="I" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    イ. MACは，送信者がメッセージと共通鍵を用いて生成する。MACを用いると，第三者が送信者の真正性を確認できる。
                                </button>
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR6Spring" data-ans="U" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    ウ. MACは，送信者がメッセージと受信者の公開鍵を用いて生成する。MACを用いると，第三者がメッセージの完全性を確認できる。
                                </button>
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR6Spring" data-ans="E" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    エ. MACは，送信者がメッセージと送信者の公開鍵を用いて生成する。MACを用いると，受信者が送信者の真正性を確認できる。
                                </button>
                            </div>

                            <!-- Feedback Box -->
                            <div id="qR6SpringFeedback" style="margin-top: 14px; display: none; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.6;"></div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- Footer References & Standards Section (Workflow Compliant) -->
            <div class="card" style="margin-top: 24px; border-top: 2px solid var(--border-color); padding-top: 16px;">
                <h4 style="margin-top: 0; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                    📚 参考文献 ＆ 標準規格仕様ドキュメント
                </h4>
                <ul style="font-size: 12px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 0; padding-left: 20px;">
                    <li>
                        <strong>IPA 情報処理安全確保支援士 試験問題・解答例（令和6年春期 午前Ⅱ 問2）</strong>: 
                        <a href="https://www.sc-siken.com/kakomon/06_haru/am2_2.html" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover);">https://www.sc-siken.com/kakomon/06_haru/am2_2.html</a>
                    </li>
                    <li>
                        <strong>RFC 2104 - HMAC: Keyed-Hashing for Message Authentication</strong>: 
                        <a href="https://datatracker.ietf.org/doc/html/rfc2104" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover);">https://datatracker.ietf.org/doc/html/rfc2104</a>
                    </li>
                    <li>
                        <strong>NIST SP 800-38B - Recommendation for Block Cipher Modes of Operation: The CMAC Mode for Authentication</strong>: 
                        <a href="https://csrc.nist.gov/publications/detail/sp/800-38b/final" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover);">NIST SP 800-38B Specification</a>
                    </li>
                </ul>
            </div>
        </div>
    `,

    init: function() {
        // --- Navigation Tab Switching ---
        const btnTabMacSim = document.getElementById("btnTabMacSim");
        const btnTabMacVSsig = document.getElementById("btnTabMacVSsig");
        const btnTabMacQuiz = document.getElementById("btnTabMacQuiz");

        const panelMacSim = document.getElementById("panelMacSim");
        const panelMacVSsig = document.getElementById("panelMacVSsig");
        const panelMacQuiz = document.getElementById("panelMacQuiz");

        function switchTab(activeBtn, activePanel) {
            [btnTabMacSim, btnTabMacVSsig, btnTabMacQuiz].forEach(btn => {
                if (btn) btn.classList.remove("active");
            });
            [panelMacSim, panelMacVSsig, panelMacQuiz].forEach(panel => {
                if (panel) panel.style.display = "none";
            });

            if (activeBtn) activeBtn.classList.add("active");
            if (activePanel) activePanel.style.display = "block";
        }

        if (btnTabMacSim) btnTabMacSim.addEventListener("click", () => switchTab(btnTabMacMacSim, panelMacSim));
        if (btnTabMacSim) btnTabMacSim.addEventListener("click", () => switchTab(btnTabMacSim, panelMacSim));
        if (btnTabMacVSsig) btnTabMacVSsig.addEventListener("click", () => switchTab(btnTabMacVSsig, panelMacVSsig));
        if (btnTabMacQuiz) btnTabMacQuiz.addEventListener("click", () => switchTab(btnTabMacQuiz, panelMacQuiz));

        // --- TAB 1: MAC Simulation Handler ---
        const btnExecuteMacSim = document.getElementById("btnExecuteMacSim");
        if (btnExecuteMacSim) {
            btnExecuteMacSim.addEventListener("click", async () => {
                const key = document.getElementById("macSharedKey").value || "SharedKeySecret123";
                const message = document.getElementById("macMessageInput").value || "Transfer 100,000 JPY to Charlie";
                const isTampered = document.getElementById("macTamperToggle").checked;
                const tamperedMessage = document.getElementById("macTamperedMessageInput").value || "Transfer 900,000 JPY to Mallory";

                try {
                    const response = await fetch("/api/mac/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: message,
                            key: key,
                            tampered_message: isTampered ? tamperedMessage : ""
                        })
                    });

                    const data = await response.json();

                    document.getElementById("outAliceMac").textContent = data.sender_mac;
                    document.getElementById("outBobMac").textContent = data.receiver_recalculated_mac;

                    const resultBox = document.getElementById("macResultStatus");
                    if (data.integrity_verified) {
                        resultBox.innerHTML = `
                            <div style="color: #34d399; font-weight: bold; font-size: 14px; margin-bottom: 4px;">${data.message}</div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                                受信メッセージ: "<b>${data.received_message}</b>"<br>
                                ・<strong>完全性 (Integrity)</strong>: OK (メッセージは改ざんされていません)<br>
                                ・<strong>送信元認証 (Authenticity)</strong>: OK (共有鍵を知る相手から届きました)
                            </div>
                        `;
                    } else {
                        resultBox.innerHTML = `
                            <div style="color: #f87171; font-weight: bold; font-size: 14px; margin-bottom: 4px;">${data.message}</div>
                            <div style="font-size: 12px; color: #fca5a5; line-height: 1.5;">
                                送信時データ: "${data.original_message}"<br>
                                受信時データ: "<b>${data.received_message}</b>"<br>
                                🚨 送信元が生成したMACと、Bobが計算したMACが一致しません。通信途中でデータが改ざんされたか、異なる鍵が使われています！
                            </div>
                        `;
                    }

                    if (window.app) {
                        window.app.log(data.integrity_verified ? "success" : "error", `[MAC検証] 完全性検証結果: ${data.integrity_verified ? "PASS" : "FAIL"}`);
                    }
                } catch (err) {
                    console.error("MAC simulation error:", err);
                }
            });
        }

        // --- TAB 2: Third Party Demo Handler ---
        const btnTestThirdParty = document.getElementById("btnTestThirdParty");
        const thirdPartyResultBox = document.getElementById("thirdPartyResultBox");

        if (btnTestThirdParty) {
            btnTestThirdParty.addEventListener("click", () => {
                thirdPartyResultBox.style.display = "block";
                thirdPartyResultBox.className = "alert alert-warning";
                thirdPartyResultBox.innerHTML = `
                    <div style="font-weight: bold; color: #f59e0b; font-size: 13px; margin-bottom: 4px;">
                        ⚠️ 第三者 (Charlie) はMACを検証できません！ (否認防止機能なし)
                    </div>
                    <div style="font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                        1. <strong>検証不能</strong>: Charlieは共通鍵 <code>SharedKey</code> を所有していないため、受信したMACの正当性を計算・確認できません。<br>
                        2. <strong>第三者への非証明</strong>: 仮に共通鍵を教えたとしても、Bob自身も同一の共通鍵を使って任意メッセージのMACを生成できるため、Charlieに対して「これはBobではなくAliceが作成したメッセージだ」と客観的に証明することは不可能です。<br>
                        👉 <strong>【結論】</strong> 第三者に対する送信元の証明（否認防止）を行うには、MACではなく「送信者の秘密鍵で署名するデジタル署名」が必要になります！
                    </div>
                `;
            });
        }

        // --- TAB 3: Quiz Handlers ---
        const quizButtons = document.querySelectorAll('#qR6SpringOptions .quiz-opt-btn');
        quizButtons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                const target = e.currentTarget || this;
                const ans = target.getAttribute("data-ans");
                const feedbackEl = document.getElementById("qR6SpringFeedback");
                const optionsContainer = document.getElementById("qR6SpringOptions");

                if (optionsContainer) {
                    optionsContainer.querySelectorAll(".quiz-opt-btn").forEach(b => {
                        b.style.borderColor = "var(--border-color)";
                        b.style.background = "var(--bg-card)";
                        b.style.color = "var(--text-primary)";
                    });
                }

                if (feedbackEl) feedbackEl.style.display = "block";

                if (ans === "A") {
                    target.style.borderColor = "var(--color-success)";
                    target.style.background = "rgba(16, 185, 129, 0.2)";
                    target.style.color = "#34d399";
                    if (feedbackEl) {
                        feedbackEl.className = "alert alert-success";
                        feedbackEl.innerHTML = `
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">🎉 正解です！（「ア」が正解）</div>
                            <div>
                                MACは送信者がメッセージと<strong>共通鍵</strong>を用いて生成し、共通鍵を持つ受信者がメッセージの<strong>完全性</strong>を確認できます。<br><br>
                                <strong>【各選択肢の誤り解説】</strong><br>
                                ・<strong>ア (正解)</strong>: MACは共通鍵で生成され、受信者が完全性と送信元を検証できます。<br>
                                ・<strong>イ (誤り)</strong>: 共通鍵を知らない「第三者」はMACを検証できず、送信者の真正性を確認できません。<br>
                                ・<strong>ウ (誤り)</strong>: MACの生成に「公開鍵」は使われません（共通鍵を使用します）。<br>
                                ・<strong>エ (誤り)</strong>: MACの生成に「公開鍵」は使われません。
                            </div>
                        `;
                    }
                    if (window.app) window.app.log("success", "[過去問演習] 令和6年春問2 (MAC) に正解しました！");
                } else {
                    target.style.borderColor = "var(--color-danger)";
                    target.style.background = "rgba(239, 68, 68, 0.2)";
                    target.style.color = "#f87171";
                    if (feedbackEl) {
                        feedbackEl.className = "alert alert-danger";
                        feedbackEl.innerHTML = `
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">❌ 不正解です。正解は「ア」です。</div>
                            <div>
                                MACは共通鍵で生成され、共通鍵を持つ受信者が「メッセージの完全性」を確認するために使用されます。共通鍵を知らない第三者は検証できません。
                            </div>
                        `;
                    }
                    if (window.app) window.app.log("error", "[過去問演習] 令和6年春問2 で誤った選択肢を選びました。");
                }
            });
        });
    }
};
