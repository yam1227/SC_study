/**
 * セキスペ・セキュリティ・ラボ
 * 共通UIコンポーネントライブラリ (ui_components.js)
 * 各モジュールで重複するタブ切り替え、過去問クイズ、リファレンスリンク、
 * レスポンスボックス表示などを標準化・一元化します。
 */

window.UIComponents = {
    /**
     * サブタブの切り替えイベントを設定
     * @param {Array<{btnId: string, panelId: string}>} tabMappings 
     * @param {Function} [onTabChange] 切り替え時のコールバック
     */
    setupSubTabs: function(tabMappings, onTabChange) {
        tabMappings.forEach(mapping => {
            const btn = document.getElementById(mapping.btnId);
            if (!btn) return;

            btn.addEventListener("click", () => {
                tabMappings.forEach(m => {
                    const b = document.getElementById(m.btnId);
                    const p = document.getElementById(m.panelId);
                    if (b) b.classList.remove("active");
                    if (p) p.style.display = "none";
                });

                btn.classList.add("active");
                const targetPanel = document.getElementById(mapping.panelId);
                if (targetPanel) {
                    targetPanel.style.display = "block";
                }
                if (typeof onTabChange === "function") {
                    onTabChange(mapping.btnId, mapping.panelId);
                }
            });
        });
    },

    /**
     * 過去問クイズウィジェットのHTML生成とイベントハンドリング
     * @param {string} containerId クイズを描画するDOMのID
     * @param {Object} quizData クイズの定義
     * @param {string} quizData.title 過去問の出典タイトル（例: "平成30年秋期 午前Ⅱ 問12"）
     * @param {string} quizData.question 問題文
     * @param {Array<{label: string, text: string, isCorrect: boolean}>} quizData.choices 選択肢
     * @param {string} quizData.explanation 正解の解説文
     * @param {string} [quizData.point] 支援士試験の重要ポイント
     */
    renderQuiz: function(containerId, quizData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const quizId = 'quiz_' + Math.random().toString(36).substring(2, 9);

        let choicesHtml = '';
        quizData.choices.forEach((choice, idx) => {
            choicesHtml += `
                <button class="btn btn-secondary quiz-choice-btn" 
                        data-choice-idx="${idx}"
                        style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 8px; font-size: 13px; line-height: 1.5; border-radius: 6px; transition: all 0.2s ease;">
                    <strong style="margin-right: 8px; color: var(--color-primary-hover);">${choice.label}.</strong>
                    <span>${choice.text}</span>
                </button>
            `;
        });

        container.innerHTML = `
            <div class="card quiz-card" style="margin-bottom: 16px; border: 1px solid var(--border-color); background: var(--bg-card); padding: 18px; border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: bold; color: var(--color-primary-hover); background: rgba(59, 130, 246, 0.1); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.3);">
                        📝 ${quizData.title}
                    </span>
                    <span style="font-size: 11px; color: var(--text-secondary);">過去問チャレンジ</span>
                </div>
                <h4 style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: var(--text-primary);">
                    ${quizData.question}
                </h4>
                <div class="quiz-choices-group" id="${quizId}_choices">
                    ${choicesHtml}
                </div>
                <div class="quiz-feedback-box" id="${quizId}_feedback" style="display: none; margin-top: 14px; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.6;"></div>
            </div>
        `;

        const choiceBtns = container.querySelectorAll('.quiz-choice-btn');
        const feedbackBox = document.getElementById(`${quizId}_feedback`);

        choiceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const choiceIdx = parseInt(btn.dataset.choiceIdx, 10);
                const selectedChoice = quizData.choices[choiceIdx];

                choiceBtns.forEach(b => {
                    b.disabled = true;
                    b.style.cursor = 'default';
                });

                if (selectedChoice.isCorrect) {
                    btn.style.background = 'rgba(16, 185, 129, 0.15)';
                    btn.style.borderColor = 'var(--color-success)';
                    btn.style.color = 'var(--color-success)';
                    feedbackBox.style.display = 'block';
                    feedbackBox.style.background = 'rgba(16, 185, 129, 0.1)';
                    feedbackBox.style.border = '1px solid var(--color-success)';
                    feedbackBox.style.color = 'var(--text-primary)';
                    feedbackBox.innerHTML = `
                        <div style="font-weight: bold; color: var(--color-success); font-size: 14px; margin-bottom: 6px;">
                            🎉 正解です！ (${selectedChoice.label})
                        </div>
                        <div>${quizData.explanation}</div>
                        ${quizData.point ? `<div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary); border-top: 1px dashed var(--border-color); padding-top: 6px;"><strong>💡 試験対策ポイント:</strong> ${quizData.point}</div>` : ''}
                    `;
                } else {
                    btn.style.background = 'rgba(239, 68, 68, 0.15)';
                    btn.style.borderColor = 'var(--color-danger)';
                    btn.style.color = 'var(--color-danger)';
                    
                    const correctChoice = quizData.choices.find(c => c.isCorrect);
                    feedbackBox.style.display = 'block';
                    feedbackBox.style.background = 'rgba(239, 68, 68, 0.1)';
                    feedbackBox.style.border = '1px solid var(--color-danger)';
                    feedbackBox.style.color = 'var(--text-primary)';
                    feedbackBox.innerHTML = `
                        <div style="font-weight: bold; color: var(--color-danger); font-size: 14px; margin-bottom: 6px;">
                            ❌ 不正解です（正解: ${correctChoice ? correctChoice.label : 'なし'}）
                        </div>
                        <div>${quizData.explanation}</div>
                        ${quizData.point ? `<div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary); border-top: 1px dashed var(--border-color); padding-top: 6px;"><strong>💡 試験対策ポイント:</strong> ${quizData.point}</div>` : ''}
                    `;
                }
            });
        });
    },

    /**
     * 参考文献・標準規格セクションのHTML生成
     * @param {Array<{title: string, url: string, note?: string}>} references 
     * @returns {string} HTML文字列
     */
    generateReferencesHtml: function(references) {
        if (!references || references.length === 0) return '';

        let itemsHtml = '';
        references.forEach(ref => {
            itemsHtml += `
                <li style="margin-bottom: 6px;">
                    <strong>${ref.title}</strong>: 
                    <a href="${ref.url}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-hover); word-break: break-all;">
                        ${ref.url}
                    </a>
                    ${ref.note ? `<span style="font-size: 11px; color: var(--text-secondary); margin-left: 6px;">(${ref.note})</span>` : ''}
                </li>
            `;
        });

        return `
            <div class="card references-card" style="margin-top: 24px; border-top: 2px solid var(--border-color); padding-top: 16px; background: var(--bg-card); border-radius: var(--radius-md);">
                <h4 style="margin-top: 0; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                    📚 参考文献 ＆ 標準規格仕様ドキュメント
                </h4>
                <ul style="font-size: 12px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 0; padding-left: 20px;">
                    ${itemsHtml}
                </ul>
            </div>
        `;
    },

    /**
     * レスポンス・ログボックスへの整形出力
     * @param {string} elementId 
     * @param {string} message 
     * @param {'success'|'warning'|'danger'|'info'} [type='info'] 
     */
    displayStatus: function(elementId, message, type = 'info') {
        const el = document.getElementById(elementId);
        if (!el) return;

        const colors = {
            success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'var(--color-success)', text: 'var(--color-success)' },
            warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'var(--color-warning)', text: 'var(--color-warning)' },
            danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--color-danger)', text: 'var(--color-danger)' },
            info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'var(--color-primary-hover)', text: 'var(--color-primary-hover)' }
        };

        const theme = colors[type] || colors.info;
        el.style.background = theme.bg;
        el.style.borderColor = theme.border;
        el.style.color = 'var(--text-primary)';
        el.innerHTML = `<span style="color: ${theme.text}; font-weight: bold; margin-right: 6px;">●</span> ${message}`;
    },

    /**
     * コード/パケットブロック（コピー機能付き）のHTML生成
     * @param {string} code 
     * @param {string} [title=""] 
     * @returns {string} HTML文字列
     */
    generateCodeBlockHtml: function(code, title = "") {
        const blockId = 'code_' + Math.random().toString(36).substring(2, 9);
        return `
            <div class="code-block-container" style="position: relative; margin: 10px 0; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-card);">
                ${title ? `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 6px 12px; font-size: 11px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">
                    <span>${title}</span>
                    <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('${blockId}').innerText); this.textContent='コピー済!'; setTimeout(()=>this.textContent='コピー', 1500);" style="padding: 2px 8px; font-size: 10px;">コピー</button>
                </div>` : ''}
                <pre id="${blockId}" style="margin: 0; padding: 12px; font-family: var(--font-mono, monospace); font-size: 12px; overflow-x: auto; color: var(--text-primary);">${code}</pre>
            </div>
        `;
    }
};
