/**
 * セキスペ・セキュリティ・ラボ
 * 共通UIコンポーネントライブラリ (ui_components.js)
 * 各モジュールで重複するタブ切り替え、過去問クイズ、リファレンスリンク、
 * レスポンスボックス表示などを標準化・一元化します。
 */

window.UIComponents = {
    /**
     * タブナビゲーション＆パネルのHTML自動生成
     * @param {Array<{id: string, label: string, icon?: string, content?: string, active?: boolean}>} tabs 
     * @returns {string} HTML文字列
     */
    renderTabs: function(tabs) {
        if (!tabs || !Array.isArray(tabs) || tabs.length === 0) return '';

        let tabButtonsHtml = '';
        let tabPanelsHtml = '';

        tabs.forEach((tab, index) => {
            const isActive = tab.active !== undefined ? tab.active : (index === 0);
            const activeClass = isActive ? 'active' : '';
            const displayStyle = isActive ? 'block' : 'none';
            const iconHtml = tab.icon ? `<span style="margin-right: 6px;">${tab.icon}</span>` : '';

            tabButtonsHtml += `
                <button class="btn-tab ${activeClass}" data-tab-target="${tab.id}">
                    ${iconHtml}${tab.label}
                </button>
            `;

            tabPanelsHtml += `
                <div class="tab-panel ${activeClass}" id="${tab.id}" style="display: ${displayStyle};">
                    ${tab.content || ''}
                </div>
            `;
        });

        return `
            <div class="card-tabs" style="margin-bottom: 20px;">
                ${tabButtonsHtml}
            </div>
            <div class="tab-panels-container">
                ${tabPanelsHtml}
            </div>
        `;
    },

    /**
     * コンテナ内の全タブ切り替えイベントを自動設定
     * @param {HTMLElement|Document} rootContainer 
     * @param {Function} [onTabChange] 切り替え時のコールバック (tabId, targetPanel)
     */
    setupTabs: function(rootContainer, onTabChange) {
        if (!rootContainer) return;
        const buttons = rootContainer.querySelectorAll('.card-tabs .btn-tab[data-tab-target]');
        if (buttons.length === 0) return;

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.tabTarget;
                const parentTabs = btn.closest('.card-tabs');
                if (parentTabs) {
                    parentTabs.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
                }
                btn.classList.add('active');

                // Toggle panels
                const container = rootContainer.querySelector('.tab-panels-container') || rootContainer;
                const panels = container.querySelectorAll('.tab-panel');
                panels.forEach(p => {
                    if (p.id === targetId) {
                        p.classList.add('active');
                        p.style.display = 'block';
                    } else if (p.closest('.tab-panels-container') === container || !p.closest('.tab-panels-container')) {
                        p.classList.remove('active');
                        p.style.display = 'none';
                    }
                });

                if (typeof onTabChange === 'function') {
                    const activePanel = document.getElementById(targetId);
                    onTabChange(targetId, activePanel);
                }
            });
        });
    },

    /**
     * 共通非同期API呼び出しラッパー（ローディング・ボタン制御・エラー処理）
     * @param {HTMLElement|string} btn ボタン要素またはセレクタ
     * @param {HTMLElement|string} resultBox 結果表示要素またはセレクタ
     * @param {Function} apiPromiseFn 非同期API実行関数
     * @param {Object} [options] オプション (loadingText, successCallback, errorCallback)
     */
    handleApiAction: async function(btn, resultBox, apiPromiseFn, options = {}) {
        const btnEl = typeof btn === 'string' ? document.querySelector(btn) : btn;
        const resultEl = typeof resultBox === 'string' ? document.querySelector(resultBox) : resultBox;
        
        const originalBtnText = btnEl ? btnEl.innerHTML : '';
        const loadingText = options.loadingText || '処理中...';

        if (btnEl) {
            btnEl.disabled = true;
            btnEl.innerHTML = `<span class="spinner" style="display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: middle;"></span>${loadingText}`;
        }

        try {
            const data = await apiPromiseFn();
            if (options.successCallback) {
                options.successCallback(data, resultEl);
            } else if (resultEl && data) {
                resultEl.style.display = 'block';
                if (typeof data === 'string') {
                    resultEl.innerHTML = data;
                } else if (data.message) {
                    resultEl.innerHTML = data.message;
                }
            }
            return data;
        } catch (error) {
            window.logToConsole('error', 'API通信エラー:', error.message || error);
            if (options.errorCallback) {
                options.errorCallback(error, resultEl);
            } else if (resultEl) {
                resultEl.style.display = 'block';
                resultEl.className = 'callout-box callout-danger text-sm';
                resultEl.innerHTML = `<strong>⚠️ 通信エラーが発生しました:</strong> ${error.message || 'サーバーとの通信に失敗しました。'}`;
            }
            throw error;
        } finally {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = originalBtnText;
            }
        }
    },

    /**
     * サブタブの切り替えイベントを設定 (レガシー互換用)
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
     * 試験攻略ポイント（試験で狙われる鍵）カードのHTML生成
     * @param {string|Array<string>} examTips 攻略ポイント文字列またはリスト
     * @param {string} [title="💡 試験攻略の鍵（セキスペ出題ポイント）"]
     * @returns {string} HTML文字列
     */
    generateExamKeyCard: function(examTips, title = "💡 試験攻略の鍵（セキスペ出題ポイント）") {
        if (!examTips) return '';
        
        let contentHtml = '';
        if (Array.isArray(examTips)) {
            contentHtml = `<ul style="margin: 0; padding-left: 20px; line-height: 1.7;">` + 
                examTips.map(tip => `<li>${tip}</li>`).join('') + 
                `</ul>`;
        } else {
            contentHtml = `<div style="line-height: 1.6;">${examTips}</div>`;
        }

        return `
            <div class="exam-key-card" style="margin-top: 20px; margin-bottom: 20px;">
                <span class="text-base" style="display: block; margin-bottom: 8px; font-weight: 700;">${title}</span>
                <div class="text-base">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    /**
     * 過去問クイズリストのHTML生成
     * @param {Array<Object>} quizList クイズ定義配列
     * @returns {string} HTML文字列
     */
    generateQuizHtml: function(quizList) {
        if (!quizList || !Array.isArray(quizList) || quizList.length === 0) return '';

        let quizzesHtml = '';
        quizList.forEach((q, qIdx) => {
            const qId = q.id || `quiz_${qIdx}_${Math.random().toString(36).substring(2, 7)}`;
            
            let optionsHtml = '';
            q.options.forEach(opt => {
                optionsHtml += `
                    <button class="quiz-option-btn" data-qid="${qId}" data-ans="${opt.key}">
                        <strong>${opt.label || opt.key}.</strong> ${opt.text}
                    </button>
                `;
            });

            quizzesHtml += `
                <div class="quiz-card" id="${qId}_card" data-correct="${q.answer}">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span class="quiz-badge">${q.year || 'セキスペ過去問'}</span>
                    </div>
                    <div class="quiz-question-text">${q.question}</div>
                    <div class="quiz-options-grid">
                        ${optionsHtml}
                    </div>
                    <div class="quiz-feedback-box" id="${qId}_feedback"></div>
                </div>
            `;
        });

        return `
            <div class="card" style="margin-top: 24px;">
                <h3>📝 セキスペ過去問 演習＆理解度チェック</h3>
                <p class="card-subtitle">本モジュールで学習した知識が、実際の情報処理安全確保支援士試験でどのように問われるかを演習します。</p>
                <div class="quiz-section">
                    ${quizzesHtml}
                </div>
            </div>
        `;
    },

    /**
     * クイズカードのクリックイベントを一括バインド
     * @param {HTMLElement|Document} rootContainer 
     * @param {Array<Object>} quizList 
     */
    initQuizEvents: function(rootContainer, quizList) {
        if (!quizList || !Array.isArray(quizList)) return;

        const quizMap = {};
        quizList.forEach(q => {
            const qId = q.id || q.qid;
            if (qId) quizMap[qId] = q;
        });

        const btns = rootContainer.querySelectorAll('.quiz-option-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const qId = btn.dataset.qid;
                const selectedAns = btn.dataset.ans;
                const card = document.getElementById(`${qId}_card`) || btn.closest('.quiz-card');
                const feedbackBox = document.getElementById(`${qId}_feedback`) || (card ? card.querySelector('.quiz-feedback-box') : null);
                
                if (!card || !feedbackBox) return;

                const correctAns = card.dataset.correct;
                const qData = quizMap[qId] || quizList.find(q => (q.id === qId || q.qid === qId));

                // Disable all buttons for this quiz
                const siblingBtns = card.querySelectorAll('.quiz-option-btn');
                siblingBtns.forEach(b => {
                    b.disabled = true;
                    b.style.cursor = 'default';
                });

                const isCorrect = (selectedAns === correctAns);
                feedbackBox.style.display = 'block';

                if (isCorrect) {
                    btn.classList.add('correct');
                    feedbackBox.className = 'quiz-feedback-box correct';
                    feedbackBox.innerHTML = `
                        <div class="text-md" style="font-weight: bold; margin-bottom: 6px;">🎉 正解です！ (${selectedAns})</div>
                        <div>${qData ? qData.explanation : '正解です。'}</div>
                        ${qData && qData.point ? `<div class="text-xs" style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 6px;"><strong>💡 試験対策ポイント:</strong> ${qData.point}</div>` : ''}
                    `;
                } else {
                    btn.classList.add('wrong');
                    // Highlight correct button
                    siblingBtns.forEach(b => {
                        if (b.dataset.ans === correctAns) b.classList.add('correct');
                    });
                    feedbackBox.className = 'quiz-feedback-box wrong';
                    feedbackBox.innerHTML = `
                        <div class="text-md" style="font-weight: bold; margin-bottom: 6px;">❌ 不正解です（正解: ${correctAns}）</div>
                        <div>${qData ? qData.explanation : 'もう一度復習してみましょう。'}</div>
                        ${qData && qData.point ? `<div class="text-xs" style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 6px;"><strong>💡 試験対策ポイント:</strong> ${qData.point}</div>` : ''}
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
        if (!references || !Array.isArray(references) || references.length === 0) return '';

        let itemsHtml = '';
        references.forEach(ref => {
            const label = ref.source ? `<strong>${ref.source}</strong>: ` : (ref.title && ref.url ? `<strong>${ref.title}</strong>: ` : '');
            const linkText = ref.title && ref.source ? ref.title : (ref.url || ref.title);
            const linkHtml = ref.url 
                ? `<a href="${ref.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
                : (ref.title || '');
            const noteHtml = ref.note ? ` - ${ref.note}` : '';

            itemsHtml += `
                <li>${label}${linkHtml}${noteHtml}</li>
            `;
        });

        return `
            <div class="card references-card">
                <h3>📚 参照元・公式仕様リファレンス</h3>
                <p class="card-subtitle">本モジュールの解説およびシミュレーションは、以下の信頼できる仕様書・公式情報源を参考に構築されています。</p>
                <ul>
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
                <div class="text-xs text-muted" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-code-block); padding: 6px 12px; border-bottom: 1px solid var(--border-color);">
                    <span>${title}</span>
                    <button class="btn btn-sm btn-secondary text-xs" onclick="navigator.clipboard.writeText(document.getElementById('${blockId}').innerText); this.textContent='コピー済!'; setTimeout(()=>this.textContent='コピー', 1500);" style="padding: 2px 8px;">コピー</button>
                </div>` : ''}
                <pre id="${blockId}" class="text-sm text-mono" style="margin: 0; padding: 12px; overflow-x: auto; color: var(--text-primary);">${code}</pre>
            </div>
        `;
    },

    // 命名互換エイリアス
    renderExamKeyCard: function(examTips, title) {
        return this.generateExamKeyCard(examTips, title);
    },
    renderQuiz: function(quizList) {
        return this.generateQuizHtml(quizList);
    },
    renderReferences: function(references) {
        return this.generateReferencesHtml(references);
    }
};
