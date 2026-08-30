/**
 * Module: Block Cipher & Operation Modes Lab (CTR, CBC, ECB, GCM)
 * 情報処理安全確保支援士対策: ブロック暗号の利用モード（CTRモードの鍵ストリーム・XOR処理・並列処理・パディング不要、CBCの誤り伝搬）
 */

window.SecurityLabModules = window.SecurityLabModules || {};

window.SecurityLabModules["block_cipher"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container">
                <button class="btn-tab active" id="btnTabBcSim">① 暗号利用モード 構造 ＆ 可視化実験</button>
                <button class="btn-tab" id="btnTabBcMatrix">② 5大暗号利用モード 比較マトリックス</button>
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
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-top: 16px;">
                        <h4 class="text-md text-primary-color" style="margin-top: 0;">⚙️ 暗号化パラメータの設定</h4>

                        <div class="lab-grid-2" style="gap: 16px; margin-top: 12px;">
                            <div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="text-sm" style="font-weight: bold; color: var(--text-primary);">暗号利用モードの選択:</label>
                                    <select id="bcModeSelect" class="text-base" style="width: 100%; padding: 8px; border-radius: 4px; font-weight: bold;">
                                        <option value="CTR" selected>⚡ CTR (Counter) モード【問7本命: 鍵ストリーム ⊕ 入力のXOR / 全並列可 / パディング不要】</option>
                                        <option value="CBC">🛡️ CBC (Cipher Block Chaining) モード【チェーニング / 復号並列可 / パディング要 / 誤り伝搬あり】</option>
                                        <option value="ECB">⚠️ ECB (Electronic Codebook) モード【単純分割 / パターン露出危険 / パディング要】</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="text-sm" style="font-weight: bold; color: var(--text-primary);">暗号化する平文メッセージ (複数ブロックに分割):</label>
                                    <input type="text" id="bcPlaintextInput" class="text-base" value="PASS_ALL_EXAMS_2026_SC" style="width: 100%; padding: 8px; border-radius: 4px;">
                                </div>
                            </div>

                            <div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="text-sm text-success-color" style="font-weight: bold;">🔑 暗号化共通鍵 (Secret Key):</label>
                                    <input type="text" id="bcSecretKey" class="text-base text-mono" value="SecretKey128Bit!" style="width: 100%; padding: 8px; border-radius: 4px;">
                                </div>

                                <!-- Dynamic Badges based on Selected Mode -->
                                <div id="bcFeatureBadges" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                                    <!-- Filled dynamically -->
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-primary text-md" id="btnRunBcSim" style="width: 100%; font-weight: bold; margin-top: 14px; cursor: pointer;">
                            🚀 暗号化処理シミュレーションを実行 ＆ ブロック分割・鍵ストリーム計算過程を表示
                        </button>
                    </div>

                    <!-- Visual Execution Process Output -->
                    <div style="margin-top: 20px;">
                        <h4 class="text-base" style="margin-bottom: 8px; color: var(--text-primary);">📡 ブロック処理ステップ ＆ 鍵ストリーム計算結果</h4>
                        
                        <div id="bcBlockStepsContainer" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div class="text-sm text-muted" style="background: var(--bg-app); padding: 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                                上記の「暗号化処理シミュレーションを実行」ボタンを押すと、各ブロックの処理ステップが表示されます。
                            </div>
                        </div>

                        <!-- Mode Summary & Exam Match -->
                        <div class="response-box" id="bcSummaryBox" style="background-color: #0c0a09; min-height: 80px; margin-top: 14px; padding: 12px;">
                            <div id="bcSummaryStatus" class="text-base text-muted">
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
                        <table class="text-sm" style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr class="table-row-header">
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">暗号利用モード</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">出力の計算方法</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">パディング</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">暗号化の並列実行</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">復号の並列実行</th>
                                    <th style="padding: 10px; border: 1px solid var(--border-color);">1bit暗号文誤りの影響（誤り伝搬）</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="table-row-primary">
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
                                <tr class="table-row-success">
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
    `,

    quiz: [
        {
            id: "qR5Haru7",
            year: "令和5年春期 午前Ⅱ 問7 (CTRモード)",
            question: "ブロック暗号の暗号利用モードの一つであるCTR(Counter)モードに関する記述のうち，適切なものはどれか。",
            options: [
                { key: "A", label: "ア", text: "暗号化と復号の処理において，出力は，入力されたブロックと鍵ストリームとの排他的論理和である。" },
                { key: "I", label: "イ", text: "暗号化の処理において，平文のデータ長がブロック長の倍数でないときにパディングが必要である。" },
                { key: "U", label: "ウ", text: "ビット誤りがある暗号文を復号すると，ビット誤りのあるブロック全体と次のブロックの対応するビットが平文ではビット誤りになる。" },
                { key: "E", label: "エ", text: "複数ブロックの暗号化の処理は並列に実行できないが，複数ブロックの復号の処理は並列に実行できる。" }
            ],
            answer: "A",
            explanation: "CTRモードでは、カウンタ値を暗号化して得られる「鍵ストリーム」と入力データ（平文または暗号文）との「排他的論理和(XOR)」を出力とします。<br><br>【誤り選択肢の解説】<br>・イ: ストリーム暗号化として動作するためパディングは不要です。<br>・ウ: これはCBCモードの誤り伝搬の説明です。<br>・エ: カウンタ値が独立しているため、暗号化・復号ともに並列実行が可能です。",
            point: "CTRモードは「パディング不要」「暗号化・復号ともに並列処理可能」「鍵ストリームとのXOR」の3大特性が頻出です。"
        }
    ],

    references: [
        { source: "IPA 独立行政法人 情報処理推進機構", title: "令和5年春期 午前Ⅱ 問7 過去問解説（ブロック暗号利用モード）", url: "https://www.sc-siken.com/kakomon/05_haru/am2_7.html" },
        { source: "NIST SP 800-38A", title: "Recommendation for Block Cipher Modes of Operation (ECB, CBC, CFB, OFB, CTR)", url: "https://csrc.nist.gov/publications/detail/sp/800-38a/final" },
        { source: "NIST SP 800-38D", title: "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)", url: "https://csrc.nist.gov/publications/detail/sp/800-38d/final" }
    ],

    init: function() {
        // --- Navigation Tab Switching using UIComponents ---
        if (window.UIComponents && window.UIComponents.setupSubTabs) {
            window.UIComponents.setupSubTabs([
                { btnId: "btnTabBcSim", panelId: "panelBcSim" },
                { btnId: "btnTabBcMatrix", panelId: "panelBcMatrix" },
                { btnId: "btnTabBcQuiz", panelId: "panelBcQuiz" }
            ]);
        }

        // Update Badges on Mode Select Change
        const bcModeSelect = document.getElementById("bcModeSelect");
        const bcFeatureBadges = document.getElementById("bcFeatureBadges");

        function updateBadges() {
            if (!bcFeatureBadges || !bcModeSelect) return;
            const mode = bcModeSelect.value;
            if (mode === "CTR") {
                bcFeatureBadges.innerHTML = `
                    <span class="subtab-badge badge-subtle-primary">⚡ 鍵ストリーム ⊕ 入力のXOR</span>
                    <span class="subtab-badge badge-subtle-success">✅ パディング不要 (ストリーム化)</span>
                    <span class="subtab-badge badge-subtle-success">🚀 暗号化・復号 全並列処理化</span>
                `;
            } else if (mode === "CBC") {
                bcFeatureBadges.innerHTML = `
                    <span class="subtab-badge badge-subtle-warning">🛡️ 前暗号文とのチェーニング</span>
                    <span class="subtab-badge badge-subtle-danger">⚠️ パディング必須</span>
                    <span class="subtab-badge badge-subtle-primary">復号のみ並列可 (暗号化並列不可)</span>
                `;
            } else {
                bcFeatureBadges.innerHTML = `
                    <span class="subtab-badge badge-subtle-danger">⚠️ パターン露出危険 (単純分割)</span>
                    <span class="subtab-badge badge-subtle-danger">⚠️ パディング必須</span>
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
                                    <div class="text-sm" style="background: #18181b; border: 1px solid #3b82f6; border-radius: 6px; padding: 12px;">
                                        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #60a5fa; margin-bottom: 6px;">
                                            <span>📦 ブロック #${step.block_index} (入力: "${step.input_plain}")</span>
                                            <span class="text-xs badge-subtle-primary" style="padding: 2px 8px; border-radius: 4px;">カウンタ値: ${step.counter_val}</span>
                                        </div>
                                        <div class="text-mono" style="color: #cbd5e1; line-height: 1.6;">
                                            1. AES_Encrypt(Key, ${step.counter_val}) ➔ <strong>鍵ストリーム(KeyStream)</strong>: <code style="color: #34d399;">${step.keystream}</code><br>
                                            2. <strong>XOR演算 (問7の核心)</strong>: ${step.xor_operation}<br>
                                            3. 最終暗号文出力: <code style="color: #fb7185;">${step.output_cipher}</code>
                                        </div>
                                    </div>
                                `;
                            } else if (mode === "CBC") {
                                html += `
                                    <div class="text-sm" style="background: #18181b; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px;">
                                        <div style="font-weight: bold; color: #f59e0b; margin-bottom: 6px;">
                                            📦 ブロック #${step.block_index} (平文: "${step.input_plain}")
                                        </div>
                                        <div class="text-mono" style="color: #cbd5e1; line-height: 1.6;">
                                            前暗号文/IVとXOR (チェーニング): <code>${step.prev_chain}</code><br>
                                            暗号文出力: <code style="color: #fb7185;">${step.output_cipher}</code>
                                        </div>
                                    </div>
                                `;
                            } else {
                                html += `
                                    <div class="text-sm" style="background: #18181b; border: 1px solid #ef4444; border-radius: 6px; padding: 12px;">
                                        <div style="font-weight: bold; color: #f87171; margin-bottom: 6px;">
                                            📦 ブロック #${step.block_index} (平文: "${step.input_plain}")
                                        </div>
                                        <div class="text-mono" style="color: #cbd5e1; line-height: 1.6;">
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
                            <div class="text-md" style="color: #60a5fa; font-weight: bold; margin-bottom: 6px;">${data.message}</div>
                            <div class="text-sm" style="color: #cbd5e1; line-height: 1.6;">
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

        }
    }
};
