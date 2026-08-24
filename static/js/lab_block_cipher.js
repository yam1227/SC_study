/**
 * Module: Block Cipher & Operation Modes Lab (CTR, CBC, ECB, GCM)
 * 情報処理安全確保支援士対策: ブロック暗号の利用モード（CTRモードの鍵ストリーム・XOR処理・並列処理・パディング不要、CBCの誤り伝搬）
 */

window.SecurityLabModules = window.SecurityLabModules || {};

window.SecurityLabModules["block_cipher"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="btn btn-tab active" id="btnTabBcSim" style="font-size: 13px; padding: 8px 16px;">① 暗号利用モード 構造 ＆ 可視化実験</button>
                <button class="btn btn-tab" id="btnTabBcMatrix" style="font-size: 13px; padding: 8px 16px;">② 5大暗号利用モード 比較マトリックス</button>
                <button class="btn btn-tab" id="btnTabBcQuiz" style="font-size: 13px; padding: 8px 16px;">③ セキスペ過去問 ＆ 演習カード</button>
            </div>

            <!-- TAB 1: Mode Structure & Visual Simulator -->
            <div id="panelBcSim" class="tab-panel active">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>⚡ ブロック暗号 ＆ 暗号利用モード インタラクティブシミュレーター</h3>
                    <p class="card-subtitle">
                        情報処理安全確保支援士 <strong>令和5年春期 午前Ⅱ 問7</strong> の中心テーマです。<br>
                        一定のブロック長（128ビット等）でデータを暗号化する「CTR (Counter)」「CBC」「ECB」各モードの動作、鍵ストリーム、排他的論理和 (XOR)、パディングの要不要、並列処理の挙動を体感します。
                    </p>

                    <!-- Settings & Controls -->
                    <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-top: 16px;">
                        <h4 style="margin-top: 0; color: #60a5fa; font-size: 14px;">⚙️ 暗号化パラメータの設定</h4>

                        <div class="lab-grid-2" style="gap: 16px; margin-top: 12px;">
                            <div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="font-size: 12px; font-weight: bold; color: var(--text-primary);">暗号利用モードの選択:</label>
                                    <select id="bcModeSelect" style="width: 100%; padding: 8px; background: #09090b; color: #60a5fa; border: 1px solid #3b82f6; border-radius: 4px; font-weight: bold; font-size: 13px;">
                                        <option value="CTR" selected>⚡ CTR (Counter) モード【問7本命: 鍵ストリーム ⊕ 入力のXOR / 全並列可 / パディング不要】</option>
                                        <option value="CBC">🛡️ CBC (Cipher Block Chaining) モード【チェーニング / 復号並列可 / パディング要 / 誤り伝搬あり】</option>
                                        <option value="ECB">⚠️ ECB (Electronic Codebook) モード【単純分割 / パターン露出危険 / パディング要】</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="font-size: 12px; font-weight: bold; color: var(--text-primary);">暗号化する平文メッセージ (複数ブロックに分割):</label>
                                    <input type="text" id="bcPlaintextInput" value="PASS_ALL_EXAMS_2026_SC" style="width: 100%; padding: 8px; background: #09090b; color: #fff; border: 1px solid #475569; border-radius: 4px; font-size: 13px;">
                                </div>
                            </div>

                            <div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="font-size: 12px; font-weight: bold; color: #a7f3d0;">🔑 暗号化共通鍵 (Secret Key):</label>
                                    <input type="text" id="bcSecretKey" value="SecretKey128Bit!" style="width: 100%; padding: 8px; background: #09090b; color: #34d399; border: 1px solid #059669; border-radius: 4px; font-family: monospace; font-size: 13px;">
                                </div>

                                <!-- Dynamic Badges based on Selected Mode -->
                                <div id="bcFeatureBadges" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                                    <!-- Filled dynamically -->
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-primary" id="btnRunBcSim" style="width: 100%; font-size: 14px; font-weight: bold; margin-top: 14px; cursor: pointer;">
                            🚀 暗号化処理シミュレーションを実行 ＆ ブロック分割・鍵ストリーム計算過程を表示
                        </button>
                    </div>

                    <!-- Visual Execution Process Output -->
                    <div style="margin-top: 20px;">
                        <h4 style="font-size: 13px; margin-bottom: 8px; color: var(--text-primary);">📡 ブロック処理ステップ ＆ 鍵ストリーム計算結果</h4>
                        
                        <div id="bcBlockStepsContainer" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="font-size: 12px; color: var(--text-secondary); background: #0c0a09; padding: 14px; border-radius: 6px;">
                                上記の「暗号化処理シミュレーションを実行」ボタンを押すと、各ブロックの処理ステップが表示されます。
                            </div>
                        </div>

                        <!-- Mode Summary & Exam Match -->
                        <div class="response-box" id="bcSummaryBox" style="background-color: #0c0a09; min-height: 80px; margin-top: 14px; padding: 12px;">
                            <div id="bcSummaryStatus" style="font-size: 13px; color: #94a3b8;">
                                モードを選択して実行してください。
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Mode Comparison Matrix -->
            <div id="panelBcMatrix" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>📊 ブロック暗号 5大暗号利用モード 徹底比較マトリックス</h3>
                    <p class="card-subtitle">
                        暗号利用モード（ECB, CBC, CFB, OFB, CTR, GCM）の特徴と、試験で問われるポイントの決定版対比です。
                    </p>

                    <div style="overflow-x: auto; margin-top: 16px;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.05); border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">暗号利用モード</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">出力の計算方法</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">パディング</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">暗号化の並列実行</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">復号の並列実行</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">1bit暗号文誤りの影響（誤り伝搬）</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="background: rgba(59, 130, 246, 0.1);">
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold; color: #60a5fa;">
                                        ⚡ CTR<br>(Counter)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #93c5fd; font-weight: bold;">
                                        <b>入力 ⊕ 鍵ストリーム</b><br>(カウンタ暗号化出力とXOR)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        <b>不要</b><br>(ストリーム暗号化)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ <b>可能</b><br>(カウンタが独立)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ <b>可能</b><br>(カウンタが独立)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        復号後の対応する1ビットのみ誤る（他ブロック影響なし）
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold; color: #f59e0b;">
                                        🛡️ CBC<br>(Cipher Block Chaining)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        AES_Encrypt(Key, 平文 ⊕ 前暗号文)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        <b>必要</b>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        ❌ <b>不可</b><br>(前暗号文が必要)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ <b>可能</b><br>(前暗号文が既知)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        自ブロック全体 ＋ <b>次ブロックの対応1ビットが誤る</b>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold; color: #ef4444;">
                                        ⚠️ ECB<br>(Electronic Codebook)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        AES_Encrypt(Key, 平文)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        <b>必要</b>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399;">
                                        ✅ 可能
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399;">
                                        ✅ 可能
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        自ブロック全体が誤る
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold;">
                                        🔄 OFB<br>(Output Feedback)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        平文 ⊕ 鍵ストリーム(フィードバック)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399;">
                                        <b>不要</b>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        ❌ 不可
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #f87171;">
                                        ❌ 不可
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                                        復号後の対応する1ビットのみ誤る（伝搬なし）
                                    </td>
                                </tr>
                                <tr style="background: rgba(16, 185, 129, 0.08);">
                                    <td style="padding: 10px; border: 1px solid var(--border-color); font-weight: bold; color: #34d399;">
                                        🔒 GCM<br>(Galois/Counter Mode)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        CTRモード ＋ GHASH認証タグ(AEAD)
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399;">
                                        <b>不要</b>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ <b>可能</b>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399; font-weight: bold;">
                                        ✅ <b>可能</b>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid var(--border-color); color: #34d399;">
                                        改ざん検出タグにより改ざんを全体ブロック単位で検知・破棄
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB 3: Exam Questions & Practice Cards -->
            <div id="panelBcQuiz" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 20px;">
                    <h3>📝 情報処理安全確保支援士 過去問 ＆ 演習カード</h3>
                    <p class="card-subtitle">
                        ブロック暗号の利用モードに関する本試験問題です。<br>
                        選択肢を選択して回答し、セキュリティエンジニア視点での解説を確認しましょう。
                    </p>

                    <!-- Question Container -->
                    <div style="display: flex; flex-direction: column; gap: 24px; margin-top: 20px;">
                        
                        <!-- Question 1: R5 Spring AM2 Q7 (Target Exam Question) -->
                        <div class="card" style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color); padding: 18px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-size: 12px; background: #1e3a8a; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: bold;">令和5年春期 午前Ⅱ 問7</span>
                                <span style="font-size: 12px; color: var(--text-secondary);">分類: 暗号利用モード (CTRモード)</span>
                            </div>
                            <h4 style="font-size: 14px; line-height: 1.6; margin-top: 0; color: var(--text-primary);">
                                ブロック暗号の暗号利用モードの一つであるCTR(Counter)モードに関する記述のうち，適切なものはどれか。
                            </h4>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;" id="qR5Haru7Options">
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR5Haru7" data-ans="A" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    ア. 暗号化と復号の処理において，出力は，入力されたブロックと鍵ストリームとの排他的論理和である。
                                </button>
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR5Haru7" data-ans="I" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    イ. 暗号化の処理において，平文のデータ長がブロック長の倍数でないときにパディングが必要である。
                                </button>
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR5Haru7" data-ans="U" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    ウ. ビット誤りがある暗号文を復号すると，ビット誤りのあるブロック全体と次のブロックの対応するビットが平文ではビット誤りになる。
                                </button>
                                <button class="btn btn-secondary quiz-opt-btn" data-qid="qR5Haru7" data-ans="E" style="text-align: left; font-size: 13px; padding: 12px; width: 100%; cursor: pointer;">
                                    エ. 複数ブロックの暗号化の処理は並列に実行できないが，複数ブロックの復号の処理は並列に実行できる。
                                </button>
                            </div>

                            <!-- Feedback Box -->
                            <div id="qR5Haru7Feedback" style="margin-top: 14px; display: none; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.6;"></div>
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
                        <strong>IPA 情報処理安全確保支援士 試験問題・解答例（令和5年春期 午前Ⅱ 問7）</strong>: 
                        <a href="https://www.sc-siken.com/kakomon/05_haru/am2_7.html" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover);">https://www.sc-siken.com/kakomon/05_haru/am2_7.html</a>
                    </li>
                    <li>
                        <strong>NIST SP 800-38A - Recommendation for Block Cipher Modes of Operation: Methods and Techniques</strong>: 
                        <a href="https://csrc.nist.gov/publications/detail/sp/800-38a/final" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover);">NIST SP 800-38A Specification</a>
                    </li>
                    <li>
                        <strong>NIST SP 800-38D - Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)</strong>: 
                        <a href="https://csrc.nist.gov/publications/detail/sp/800-38d/final" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover);">NIST SP 800-38D GCM Specification</a>
                    </li>
                </ul>
            </div>
        </div>
    `,

    init: function() {
        // --- Navigation Tab Switching ---
        const btnTabBcSim = document.getElementById("btnTabBcSim");
        const btnTabBcMatrix = document.getElementById("btnTabBcMatrix");
        const btnTabBcQuiz = document.getElementById("btnTabBcQuiz");

        const panelBcSim = document.getElementById("panelBcSim");
        const panelBcMatrix = document.getElementById("panelBcMatrix");
        const panelBcQuiz = document.getElementById("panelBcQuiz");

        function switchTab(activeBtn, activePanel) {
            [btnTabBcSim, btnTabBcMatrix, btnTabBcQuiz].forEach(btn => {
                if (btn) btn.classList.remove("active");
            });
            [panelBcSim, panelBcMatrix, panelBcQuiz].forEach(panel => {
                if (panel) panel.style.display = "none";
            });

            if (activeBtn) activeBtn.classList.add("active");
            if (activePanel) activePanel.style.display = "block";
        }

        if (btnTabBcSim) btnTabBcSim.addEventListener("click", () => switchTab(btnTabBcSim, panelBcSim));
        if (btnTabBcMatrix) btnTabBcMatrix.addEventListener("click", () => switchTab(btnTabBcMatrix, panelBcMatrix));
        if (btnTabBcQuiz) btnTabBcQuiz.addEventListener("click", () => switchTab(btnTabBcQuiz, panelBcQuiz));

        // Update Badges on Mode Select Change
        const bcModeSelect = document.getElementById("bcModeSelect");
        const bcFeatureBadges = document.getElementById("bcFeatureBadges");

        function updateBadges() {
            if (!bcFeatureBadges || !bcModeSelect) return;
            const mode = bcModeSelect.value;
            if (mode === "CTR") {
                bcFeatureBadges.innerHTML = `
                    <span style="font-size: 12px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid #3b82f6; padding: 4px 10px; border-radius: 4px; font-weight: bold;">⚡ 鍵ストリーム ⊕ 入力のXOR</span>
                    <span style="font-size: 12px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; padding: 4px 10px; border-radius: 4px; font-weight: bold;">✅ パディング不要 (ストリーム化)</span>
                    <span style="font-size: 12px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; padding: 4px 10px; border-radius: 4px; font-weight: bold;">🚀 暗号化・復号 全並列処理化</span>
                `;
            } else if (mode === "CBC") {
                bcFeatureBadges.innerHTML = `
                    <span style="font-size: 12px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b; padding: 4px 10px; border-radius: 4px; font-weight: bold;">🛡️ 前暗号文とのチェーニング</span>
                    <span style="font-size: 12px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 4px; font-weight: bold;">⚠️ パディング必須</span>
                    <span style="font-size: 12px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid #3b82f6; padding: 4px 10px; border-radius: 4px; font-weight: bold;">復号のみ並列可 (暗号化並列不可)</span>
                `;
            } else {
                bcFeatureBadges.innerHTML = `
                    <span style="font-size: 12px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 4px; font-weight: bold;">⚠️ パターン露出危険 (単純分割)</span>
                    <span style="font-size: 12px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 4px; font-weight: bold;">⚠️ パディング必須</span>
                `;
            }
        }

        if (bcModeSelect) {
            bcModeSelect.addEventListener("change", updateBadges);
            updateBadges();
        }

        // --- Simulation Execution Button ---
        const btnRunBcSim = document.getElementById("btnRunBcSim");
        if (btnRunBcSim) {
            btnRunBcSim.addEventListener("click", async () => {
                const mode = bcModeSelect.value;
                const plain = document.getElementById("bcPlaintextInput").value || "PASS_ALL_EXAMS_2026_SC";
                const key = document.getElementById("bcSecretKey").value || "SecretKey128Bit!";

                try {
                    const response = await fetch("/api/block-cipher/simulate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mode: mode,
                            plaintext: plain,
                            key: key
                        })
                    });

                    const data = await response.json();

                    // Render Block Steps
                    const stepsContainer = document.getElementById("bcBlockStepsContainer");
                    if (stepsContainer && data.steps) {
                        let html = "";
                        data.steps.forEach(step => {
                            if (mode === "CTR") {
                                html += `
                                    <div style="background: #18181b; border: 1px solid #3b82f6; border-radius: 6px; padding: 12px; font-size: 12px;">
                                        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #60a5fa; margin-bottom: 6px;">
                                            <span>📦 ブロック #${step.block_index} (入力: "${step.input_plain}")</span>
                                            <span style="font-size: 12px; background: rgba(59, 130, 246, 0.2); padding: 2px 8px; border-radius: 4px;">カウンタ値: ${step.counter_val}</span>
                                        </div>
                                        <div style="font-family: monospace; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                                            1. AES_Encrypt(Key, ${step.counter_val}) ➔ <strong>鍵ストリーム(KeyStream)</strong>: <code style="color: #34d399;">${step.keystream}</code><br>
                                            2. <strong>XOR演算 (問7の核心)</strong>: ${step.xor_operation}<br>
                                            3. 最終暗号文出力: <code style="color: #fb7185;">${step.output_cipher}</code>
                                        </div>
                                    </div>
                                `;
                            } else if (mode === "CBC") {
                                html += `
                                    <div style="background: #18181b; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; font-size: 12px;">
                                        <div style="font-weight: bold; color: #f59e0b; margin-bottom: 6px;">
                                            📦 ブロック #${step.block_index} (平文: "${step.input_plain}")
                                        </div>
                                        <div style="font-family: monospace; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                                            前暗号文/IVとXOR (チェーニング): <code>${step.prev_chain}</code><br>
                                            暗号文出力: <code style="color: #fb7185;">${step.output_cipher}</code>
                                        </div>
                                    </div>
                                `;
                            } else {
                                html += `
                                    <div style="background: #18181b; border: 1px solid #ef4444; border-radius: 6px; padding: 12px; font-size: 12px;">
                                        <div style="font-weight: bold; color: #f87171; margin-bottom: 6px;">
                                            📦 ブロック #${step.block_index} (平文: "${step.input_plain}")
                                        </div>
                                        <div style="font-family: monospace; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                                            単純ブロック暗号化出力: <code style="color: #fb7185;">${step.output_cipher}</code>
                                        </div>
                                    </div>
                                `;
                            }
                        });
                        stepsContainer.innerHTML = html;
                    }

                    // Render Summary Status
                    const summaryBox = document.getElementById("bcSummaryStatus");
                    if (summaryBox) {
                        summaryBox.innerHTML = `
                            <div style="color: #60a5fa; font-weight: bold; font-size: 14px; margin-bottom: 6px;">${data.message}</div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                                ・<strong>出力の計算方法</strong>: ${data.output_formula}<br>
                                ・<strong>パディングの要否</strong>: ${data.padding_required ? "⚠️ 必要" : "✅ 不要"} (${data.padding_note})<br>
                                ・<strong>並列実行性</strong>: 暗号化: ${data.parallel_encryption ? "✅ 可" : "❌ 不可"} / 復号: ${data.parallel_decryption ? "✅ 可" : "❌ 不可"}<br>
                                ・<strong>暗号文1bit誤りの影響</strong>: ${data.error_propagation}
                            </div>
                        `;
                    }

                    if (window.app) {
                        window.app.log("success", `[暗号利用モード Sim] Mode: ${data.mode} | Padding: ${data.padding_required} | Parallel Enc: ${data.parallel_encryption}`);
                    }
                } catch (err) {
                    console.error("Block cipher simulation error:", err);
                }
            });
        }

        // --- TAB 3: Quiz Handlers ---
        const quizButtons = document.querySelectorAll('#qR5Haru7Options .quiz-opt-btn');
        quizButtons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                const target = e.currentTarget || this;
                const ans = target.getAttribute("data-ans");
                const feedbackEl = document.getElementById("qR5Haru7Feedback");
                const optionsContainer = document.getElementById("qR5Haru7Options");

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
                                CTRモードでは、カウンタ値を暗号化して得られる<strong>「鍵ストリーム」</strong>と入力データ（平文または暗号文）との<strong>「排他的論理和(XOR)」</strong>を出力とします。<br><br>
                                <strong>【各選択肢の誤り解説】</strong><br>
                                ・<strong>ア (正解)</strong>: CTRモードは入力ブロックと鍵ストリームのXORを出力します。<br>
                                ・<strong>イ (誤り)</strong>: CTRモードはストリーム暗号化として動作するため、ブロック長の倍数でなくても<strong>パディングは不要</strong>です。（ECB/CBC等では必要）<br>
                                ・<strong>ウ (誤り)</strong>: これは <strong>CBCモード</strong> 復号時の誤り伝搬の説明です。CTRモードでは暗号文の1ビット誤りは復号後の対応する1ビットのみに影響します。<br>
                                ・<strong>エ (誤り)</strong>: CTRモードはカウンタ値が独立しているため、<strong>暗号化・復号ともに複数ブロックの並列実行が可能</strong>です。（CBCモードは暗号化並列不可・復号並列可）
                            </div>
                        `;
                    }
                    if (window.app) window.app.log("success", "[過去問演習] 令和5年春問7 (CTRモード) に正解しました！");
                } else {
                    target.style.borderColor = "var(--color-danger)";
                    target.style.background = "rgba(239, 68, 68, 0.2)";
                    target.style.color = "#f87171";
                    if (feedbackEl) {
                        feedbackEl.className = "alert alert-danger";
                        feedbackEl.innerHTML = `
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">❌ 不正解です。正解は「ア」です。</div>
                            <div>
                                CTRモードの最大の特徴は、暗号化カウンタから生成された「鍵ストリーム」と入力ブロックの「排他的論理和(XOR)」を出力とすることです。
                            </div>
                        `;
                    }
                    if (window.app) window.app.log("error", "[過去問演習] 令和5年春問7 で誤った選択肢を選びました。");
                }
            });
        });
    }
};
