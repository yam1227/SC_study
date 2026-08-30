/**
 * Module 19: System Reliability & Design Concepts Simulator
 * フールプルーフ, フェールセーフ, フェールソフト, フォールトトレラント, フォールトアボイダンス
 */
window.SecurityLabModules["system_reliability"] = {
    html: `
        <div class="lab-container">
            <!-- Header Banner -->
            <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--color-success);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 1.3rem; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                            <span>🛡️</span> システム信頼性・方式設計 (フェールセーフ / フールプルーフ等)
                            <span class="badge badge-subtle-success">試験頻出・重要概念</span>
                        </h2>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">
                            「人（誤操作）」と「物（機器故障）」の対策の違い、および障害発生時の振る舞い（安全停止 vs 縮退運転 vs 無停止二重化継続）の定義と使い分けを完全マスターします。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="tab-container">
                <button id="srTabBtn-matrix" class="btn-tab active">📊 1. 概念比較マトリクス</button>
                <button id="srTabBtn-sim" class="btn-tab">⚡ 2. 障害発生 & システム挙動シミュレータ</button>
            </div>

            <!-- TAB 1: Comparison Matrix -->
            <div id="srTab-matrix" class="tab-content" style="display: block;">
                <!-- Summary Comparison Table -->
                <div class="card" style="margin-bottom: 20px;">
                    <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-primary);">⚖️ 信頼性・安全設計 5大概念の一覧比較</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                            <thead>
                                <tr class="table-row-header">
                                    <th style="padding: 10px; color: #818cf8; width: 18%;">設計方式</th>
                                    <th style="padding: 10px; color: #34d399; width: 18%;">対象（何を防ぐか）</th>
                                    <th style="padding: 10px; color: #d97706; width: 34%;">障害・ミス発生時の動作方針</th>
                                    <th style="padding: 10px; color: var(--text-secondary); width: 30%;">代表的な具体例</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="table-row-primary" style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 10px; font-weight: bold; color: #818cf8;">フールプルーフ<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(Foolproof)</span></td>
                                    <td style="padding: 10px;"><span class="badge badge-subtle-primary">人間 (ヒューマンエラー)</span></td>
                                    <td style="padding: 10px;">操作誤りや誤入力を行っても、不整合や危険が発生しないよう構造的に遮断・保護する。</td>
                                    <td style="padding: 10px; color: var(--text-secondary);">・ドアを閉めないと回らない洗濯機<br>・入力フォーマットチェック<br>・削除確認ダイアログ</td>
                                </tr>
                                <tr class="table-row-danger" style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 10px; font-weight: bold; color: #f87171;">フェールセーフ<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(Fail-safe)</span></td>
                                    <td style="padding: 10px;"><span class="badge badge-subtle-danger">物・ソフト (機器故障)</span></td>
                                    <td style="padding: 10px;">故障発生時、二次被害やデータ破壊を防ぐため、<strong>必ず安全な状態へ移行（停止・遮断）</strong>させる。</td>
                                    <td style="padding: 10px; color: var(--text-secondary);">・全方向赤信号になる故障信号機<br>・Fail-closed型ファイアウォール<br>・圧力安全弁</td>
                                </tr>
                                <tr class="table-row-warning" style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 10px; font-weight: bold; color: #d97706;">フェールソフト<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(Fail-soft)</span></td>
                                    <td style="padding: 10px;"><span class="badge badge-subtle-warning">物・ソフト (機器故障)</span></td>
                                    <td style="padding: 10px;">全停止せず、一部機能を制限・切り離して重要機能のみで運用を継続する（<strong>縮退運転</strong>）。</td>
                                    <td style="padding: 10px; color: var(--text-secondary);">・DBダウン時にキャッシュ閲覧のみ継続<br>・帯域低下時に低画質配信切り替え<br>・1台マルチサーバー障害時の性能低下継続</td>
                                </tr>
                                <tr class="table-row-success" style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 10px; font-weight: bold; color: #34d399;">フォールトトレラント<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(Fault-tolerant)</span></td>
                                    <td style="padding: 10px;"><span class="badge badge-subtle-success">物・ソフト (機器故障)</span></td>
                                    <td style="padding: 10px;">二重化（冗長化）により、構成要素が故障しても<strong>ダウンタイムも機能低下もなく完全無停止継続</strong>する。</td>
                                    <td style="padding: 10px; color: var(--text-secondary);">・RAID 1 / 5 / 6 ディスクミラーリング<br>・二重化電源 (Redundant Power)<br>・アクティブ/アクティブ クラスタ</td>
                                </tr>
                                <tr class="table-row-neutral">
                                    <td style="padding: 10px; font-weight: bold; color: #a1a1aa;">フォールトアボイダンス<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(Fault Avoidance)</span></td>
                                    <td style="padding: 10px;"><span class="badge badge-subtle-neutral">物・ソフト (故障予防)</span></td>
                                    <td style="padding: 10px;">高品質部品の採用や厳密なテスト、予防保守により、<strong>故障そのものを発生させない</strong>設計。</td>
                                    <td style="padding: 10px; color: var(--text-secondary);">・高品質半導体・高耐久パーツの使用<br>・事前動作テスト・予防交換</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Distinction Guide Cards -->
                <div class="lab-grid-2" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="card" style="border-left: 4px solid #6366f1;">
                        <h4 style="font-size: 0.95rem; color: #818cf8; margin-bottom: 8px;">💡 【識別テクニック 1】 「人」 vs 「物（機器）」</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                            問題文で対象が<strong>「人間の誤操作・不慣れな利用者の入力ミス」</strong>であれば、即座に <strong>フールプルーフ</strong> を選択します。<br>
                            それ以外の4つ（フェールセーフ、フェールソフト、フォールトトレラント、フォールトアボイダンス）はすべて<strong>「システム・ハードウェアの故障・障害」</strong>が対象です。
                        </p>
                    </div>

                    <div class="card" style="border-left: 4px solid #f59e0b;">
                        <h4 style="font-size: 0.95rem; color: #d97706; margin-bottom: 8px;">💡 【識別テクニック 2】 故障発生後の「システムの状態」</h4>
                        <ul style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; padding-left: 18px;">
                            <li><strong>安全最優先で全停止・遮断する:</strong> → <strong style="color: #f87171;">フェールセーフ (Fail-safe)</strong></li>
                            <li><strong>一部機能を落として（縮退運転）継続する:</strong> → <strong style="color: #d97706;">フェールソフト (Fail-soft)</strong></li>
                            <li><strong>二重化により完全無停止（機能低下ゼロ）で継続する:</strong> → <strong style="color: #34d399;">フォールトトレラント (Fault-tolerant)</strong></li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Fault Simulator -->
            <div id="srTab-sim" class="tab-content" style="display: none;">
                <div class="lab-grid-2" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Left: Control Panel -->
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">⚡ 障害イベント & 設計方針シミュレーター</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
                            Webシステムの各コンポーネントで障害（誤操作・API切断・DBダウン）を発生させ、適用する設計方針に応じたシステムの挙動の違いを体験します。
                        </p>

                        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                            <!-- Event Selector -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">1. 発生させるイベント/障害:</label>
                                <select id="srEventTypeSelect" onchange="window.srLab.onEventChange(this.value)" style="width: 100%; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm); font-size: 0.85rem; margin-top: 4px;">
                                    <option value="human_error" selected>👤 【人】 ユーザーによる不整合データの誤入力・連打操作</option>
                                    <option value="api_failure">🔌 【物】 外部決済APIサーバーの突然の通信断絶 (ダウン)</option>
                                    <option value="database_crash">🛢️ 【物】 主データベース (Master DB) のハードウェアクラッシュ</option>
                                </select>
                            </div>

                            <!-- Policy Selector -->
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">2. システムに適用する設計方針:</label>
                                <select id="srPolicySelect" style="width: 100%; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm); font-size: 0.85rem; margin-top: 4px;">
                                    <option value="none">❌ 未導入 (対策なし・デフォルト状態)</option>
                                    <option value="foolproof">🛡️ フールプルーフ (入力バリデーション・誤入力防止)</option>
                                    <option value="failsafe">🚨 フェールセーフ (被害防止の即時安全全停止)</option>
                                    <option value="failsoft">📉 フェールソフト (一部機能制限による縮退運転)</option>
                                    <option value="fault_tolerant">⚡ フォールトトレラント (二重化・無停止フェイルオーバー)</option>
                                </select>
                            </div>

                            <button class="btn btn-primary" onclick="window.srLab.runSimulation()" style="width: 100%;">
                                🚀 シミュレーションを実行
                            </button>
                        </div>

                        <!-- Status Result Badge Box -->
                        <div id="srResultStatusBox" style="padding: 14px; border-radius: 8px; font-size: 0.9rem; background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-secondary);">
                            「シミュレーションを実行」ボタンを押すと、システムの応答と適合性が評価されます。
                        </div>
                    </div>

                    <!-- Right: Live Log Output -->
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 12px;">📡 システム状態 & 処理ログ</h3>
                        <div id="srSimLogBox" style="background: #09090b; border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; font-family: var(--font-mono); font-size: 0.8rem; color: #e4e4e7; height: 340px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6;">
                            ログがここにリアルタイム表示されます。
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
            id: "srQuiz_1",
            year: "IPA共通シラバス / 基本・応用・支援士 午前Ⅱ",
            question: "Webアプリケーションで利用者が不慣れなために誤った形式のデータを入力した場合でも、システムに異常やデータ破損を発生させないよう、入力チェック機能を強化して安全に保護する設計思想はどれか。",
            options: [
                { key: "foolproof", label: "ア", text: "フールプルーフ" },
                { key: "failsafe", label: "イ", text: "フェールセーフ" },
                { key: "failsoft", label: "ウ", text: "フェールソフト" },
                { key: "fault_tolerant", label: "エ", text: "フォールトトレラント" }
            ],
            answer: "foolproof",
            explanation: "「利用者の不慣れ・誤入力（ヒューマンエラー）」を対象として安全保護する設計思想は<strong>フールプルーフ (Foolproof)</strong> です。",
            point: "「人のミスを防ぐ」＝フールプルーフ。「機器の故障時に安全側へ倒す」＝フェールセーフ。この対比が頻出です。"
        },
        {
            id: "srQuiz_2",
            year: "IPA共通シラバス / 基本・応用・支援士 午前Ⅱ",
            question: "データベースサーバーの構成機器に障害が発生した際、データベースへのデータ書き込み処理は停止させるが、キャッシュサーバーを利用してWebサイトでの情報閲覧サービスのみを縮退運用で維持する設計思想はどれか。",
            options: [
                { key: "foolproof", label: "ア", text: "フールプルーフ" },
                { key: "failsafe", label: "イ", text: "フェールセーフ" },
                { key: "failsoft", label: "ウ", text: "フェールソフト" },
                { key: "fault_tolerant", label: "エ", text: "フォールトトレラント" }
            ],
            answer: "failsoft",
            explanation: "障害発生時に全停止せず、書き込み等の機能を一部制限して「縮退運転（Degraded Operation）」で閲覧サービスを維持する設計思想は<strong>フェールソフト (Fail-soft)</strong> です。",
            point: "フェールソフトは「縮退運転 (Degraded)」というキーワードと常にセットで出題されます。"
        },
        {
            id: "srQuiz_3",
            year: "IPA共通シラバス / 基本・応用・支援士 午前Ⅱ",
            question: "踏切の遮断機システムにおいて、装置の電気回路や制御系が故障した際、自重によって遮断桿（バー）が自動的に下降し、通行人の進入を防いで事故を回避する構造はどの設計思想に該当するか。",
            options: [
                { key: "foolproof", label: "ア", text: "フールプルーフ" },
                { key: "failsafe", label: "イ", text: "フェールセーフ" },
                { key: "failsoft", label: "ウ", text: "フェールソフト" },
                { key: "fault_tolerant", label: "エ", text: "フォールトトレラント" }
            ],
            answer: "failsafe",
            explanation: "機器の故障時に、人身事故を防ぐため「必ず安全な状態（遮断降下状態）」へ移行・停止させる設計思想は<strong>フェールセーフ (Fail-safe)</strong> です。",
            point: "踏切の遮断機、石油ストーブの対震自動消火装置、信号機の赤点滅などはすべてフェールセーフの代表例です。"
        }
    ],

    references: [
        { source: "IPA 独立行政法人 情報処理推進機構", title: "ITパスポート・基本情報・応用情報・高度試験 シラバス（システム信頼性設計）", url: "https://www.ipa.go.jp/shiken/syllabus/gaiyou.html" },
        { source: "JSA 日本規格協会", title: "JIS Z 8115 信頼性用語 & 機能安全 (Functional Safety) 原理規格", url: "https://www.jsa.or.jp/" },
        { source: "デジタル庁 / 政府共通プラットフォーム", title: "システム可用性・耐障害性評価設計ガイドライン", url: "https://www.digital.go.jp/" }
    ],

    init: function () {
        const self = this;

        if (window.UIComponents && window.UIComponents.setupSubTabs) {
            window.UIComponents.setupSubTabs([
                { btnId: "srTabBtn-matrix", panelId: "srTab-matrix" },
                { btnId: "srTabBtn-sim", panelId: "srTab-sim" }
            ]);
        }

        const eventSelect = document.getElementById("srEventTypeSelect");
        if (eventSelect) {
            eventSelect.addEventListener("change", (e) => {
                self.onEventChange(e.target.value);
            });
        }

        const runBtn = document.getElementById("srBtnRunSim");
        if (runBtn) {
            runBtn.addEventListener("click", () => {
                self.runSimulation();
            });
        }
    },

    onEventChange: function (eventVal) {
        const policySelect = document.getElementById("srPolicySelect");
        if (!policySelect) return;
        
        // Auto-select recommended matching policy to help learning
        if (eventVal === "human_error") {
            policySelect.value = "foolproof";
        } else if (eventVal === "api_failure") {
            policySelect.value = "failsafe";
        } else if (eventVal === "database_crash") {
            policySelect.value = "fault_tolerant";
        }
    },

    runSimulation: async function () {
        const eventVal = document.getElementById("srEventTypeSelect").value;
        const policyVal = document.getElementById("srPolicySelect").value;
        const logBox = document.getElementById("srSimLogBox");
        const statusBox = document.getElementById("srResultStatusBox");

        if (logBox) logBox.innerHTML = "⌛ シミュレーションを実行中...";

        try {
            const res = await fetch("/api/system_reliability/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_type: eventVal,
                    policy: policyVal
                })
            });

            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            if (logBox) {
                logBox.innerHTML = data.logs.join("\n");
            }

            if (statusBox) {
                if (data.success) {
                    statusBox.style.borderColor = "var(--color-success)";
                    statusBox.style.color = "var(--color-success)";
                } else {
                    statusBox.style.borderColor = "var(--color-danger)";
                    statusBox.style.color = "var(--color-danger)";
                }
                statusBox.innerHTML = `
                    <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 4px;">${data.status_label}</div>
                    <div style="font-size: 0.8rem;">適合評価: <strong>${data.concept_match}</strong> (システム状態: ${data.system_state})</div>
                `;
            }
        } catch (err) {
            if (logBox) logBox.innerHTML = `❌ シミュレーションエラー: ${err.message}`;
        }
    }
};
