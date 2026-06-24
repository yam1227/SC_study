/**
 * Module 1: Password Hashing Lab
 */
window.SecurityLabModules["hashing"] = {
    html: `
        <div class="lab-grid-2">
            <!-- Part 1: Hash Generator -->
            <div class="card">
                <h3>🔑 パスワードハッシュ生成</h3>
                <p class="card-subtitle">パスワードをハッシュ化し、生成にかかる時間（計算コスト）を比較します。</p>
                
                <div class="form-group">
                    <label for="hashPassword">パスワードを入力してください:</label>
                    <input type="text" id="hashPassword" value="SecureP@ssw0rd!" placeholder="例: password123">
                </div>
                
                <div class="form-group">
                    <label for="bcryptRounds">bcrypt ストレッチング回数 (Rounds / Cost Factor):</label>
                    <select id="bcryptRounds">
                        <option value="4">4 (非常に高速 - 低保護)</option>
                        <option value="8">8 (中間)</option>
                        <option value="12" selected>12 (推奨設定 - 高コスト)</option>
                        <option value="14">14 (非常に遅い - 高負荷)</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" id="btnGenerateHash">ハッシュ化を実行</button>
                
                <div class="form-group">
                    <label>SHA-256 ハッシュ (ソルト・ストレッチングなし):</label>
                    <div class="response-box">
                        <code id="outSha256">ハッシュ未生成</code>
                    </div>
                    <span class="attack-stats" id="timeSha256"></span>
                </div>
                
                <div class="form-group">
                    <label>bcrypt ハッシュ (ソルト＋自動ストレッチング):</label>
                    <div class="response-box">
                        <code id="outBcrypt">ハッシュ未生成</code>
                    </div>
                    <span class="attack-stats" id="timeBcrypt"></span>
                </div>
            </div>
            
            <!-- Part 2: Dictionary Attack Simulator -->
            <div class="card">
                <h3>💥 辞書攻撃シミュレーター (ブルートフォース体験)</h3>
                <p class="card-subtitle">ハッシュ化アルゴリズムの強度により、ハッシュ解析にかかる時間がどう変化するかを検証します。</p>
                
                <div class="form-group">
                    <label for="attackAlgorithm">解析対象ハッシュのアルゴリズム:</label>
                    <select id="attackAlgorithm">
                        <option value="sha256" selected>SHA-256 (ソルトなし・高速)</option>
                        <option value="bcrypt">bcrypt (ストレッチングあり・低速)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="attackTargetPassword">解析対象のパスワード（辞書に載っているもの）:</label>
                    <select id="attackTargetPassword">
                        <option value="password">password (辞書の上位)</option>
                        <option value="hunter2">hunter2 (中位)</option>
                        <option value="tokyo2026">tokyo2026 (辞書の最後の方)</option>
                        <option value="notindictionary">notindictionary (辞書に存在しない)</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" id="btnStartAttack">攻撃シミュレーション開始</button>
                
                <div class="attack-status-container" id="attackStatusContainer" style="display: none;">
                    <div class="attack-stats">
                        <span id="attackStatusText">攻撃待機中...</span>
                        <span id="attackAttempts">0 回試行</span>
                    </div>
                    <div class="attack-progress-bar">
                        <div class="attack-progress-fill" id="attackProgressFill"></div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>攻撃結果レポート:</label>
                    <div class="response-box" style="background-color: #0f172a;">
                        <code id="attackReport">攻撃を実行してください。</code>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        const btnGenerateHash = document.getElementById("btnGenerateHash");
        const hashPassword = document.getElementById("hashPassword");
        const bcryptRounds = document.getElementById("bcryptRounds");
        const outSha256 = document.getElementById("outSha256");
        const outBcrypt = document.getElementById("outBcrypt");
        const timeSha256 = document.getElementById("timeSha256");
        const timeBcrypt = document.getElementById("timeBcrypt");
        
        const btnStartAttack = document.getElementById("btnStartAttack");
        const attackAlgorithm = document.getElementById("attackAlgorithm");
        const attackTargetPassword = document.getElementById("attackTargetPassword");
        const attackStatusContainer = document.getElementById("attackStatusContainer");
        const attackStatusText = document.getElementById("attackStatusText");
        const attackAttempts = document.getElementById("attackAttempts");
        const attackProgressFill = document.getElementById("attackProgressFill");
        const attackReport = document.getElementById("attackReport");
        
        // Setup simple dictionary
        const commonPasswords = [
            "123456", "password", "123456789", "qwerty", "12345", "1234567", "football",
            "hello", "admin", "welcome", "login", "secret", "letmein", "hunter2", "mustang",
            "dragon", "starwars", "shadow", "baseball", "computer", "password123", "tokyo",
            "japan", "cherry", "blossom", "security", "exam", "specialist", "tokyo2026"
        ];
        
        // 1. Hash generation handler
        btnGenerateHash.addEventListener("click", async () => {
            const password = hashPassword.value.trim();
            if (!password) {
                alert("パスワードを入力してください。");
                return;
            }
            
            btnGenerateHash.disabled = true;
            outSha256.innerText = "生成中...";
            outBcrypt.innerText = "生成中... (ストレッチング計算処理中)";
            
            try {
                const res = await app.apiCall("/api/hashing/hash", "POST", {
                    password: password,
                    rounds: parseInt(bcryptRounds.value)
                });
                
                outSha256.innerText = res.sha256.hash;
                timeSha256.innerHTML = `計算時間: <b style="color: var(--color-success);">${(res.sha256.time_sec * 1000).toFixed(4)} ms</b>`;
                
                outBcrypt.innerText = res.bcrypt.hash;
                timeBcrypt.innerHTML = `計算時間: <b style="color: var(--color-danger);">${(res.bcrypt.time_sec * 1000).toFixed(2)} ms</b> (SHA-256比: 約 <b>${Math.round(res.bcrypt.time_sec / res.sha256.time_sec)}倍</b> 遅い)`;
            } catch (err) {
                outSha256.innerText = "エラーが発生しました";
                outBcrypt.innerText = "エラーが発生しました";
            } finally {
                btnGenerateHash.disabled = false;
            }
        });
        
        // 2. Dictionary attack simulation handler
        btnStartAttack.addEventListener("click", async () => {
            const targetPassword = attackTargetPassword.value;
            const alg = attackAlgorithm.value;
            
            btnStartAttack.disabled = true;
            attackStatusContainer.style.display = "flex";
            attackReport.innerText = "ハッシュターゲット生成中...";
            
            try {
                // First: Generate target hash on the server
                let targetHash = "";
                if (alg === "sha256") {
                    const temp = await app.apiCall("/api/hashing/hash", "POST", { password: targetPassword, rounds: 4 });
                    targetHash = temp.sha256.hash;
                } else {
                    const temp = await app.apiCall("/api/hashing/hash", "POST", { password: targetPassword, rounds: 8 }); // cost 8 for attack demo, speed up
                    targetHash = temp.bcrypt.hash;
                }
                
                attackReport.innerText = `ターゲットハッシュ: ${targetHash}\n\n解析を開始します...`;
                
                // Simulation on frontend to show animated progress
                let currentIdx = 0;
                const total = commonPasswords.length;
                let found = false;
                let elapsedSec = 0;
                
                const t0 = performance.now();
                
                // Batch-wise dictionary verification with API
                const runStep = async () => {
                    if (currentIdx >= total || found) {
                        const t_end = (performance.now() - t0) / 1000;
                        attackProgressFill.style.width = "100%";
                        
                        if (found) {
                            attackStatusText.innerText = "🟢 解析完了 (ハッシュ一致)";
                            attackReport.innerHTML = `[SUCCESS] 辞書攻撃が成功しました！
パスワード: <span style="color: var(--color-success); font-weight: bold;">${targetPassword}</span>
試行回数: ${currentIdx} 回 / 辞書登録件数 ${total}
総解析時間: ${(t_end).toFixed(3)} 秒

<b>解説:</b>
${alg === 'sha256' 
  ? 'SHA-256は計算が非常に高速なため、辞書攻撃で容易に突破されます。ハッシュの高速性はパスワード保護においては弱点となります。'
  : 'bcryptは故意に遅く設計されているため、1回あたりの試行に大きな計算コスト（ストレッチング）がかかります。そのため辞書攻撃の解析速度が劇的に低下します。'}`;
                        } else {
                            attackStatusText.innerText = "🔴 解析終了 (不一致)";
                            attackReport.innerHTML = `[FAILED] 辞書内のすべてのワードを検証しましたが、一致するパスワードはありませんでした。
試行回数: ${total} 回
総解析時間: ${(t_end).toFixed(3)} 秒

<b>解説:</b>
十分な複雑さを持ち、一般的な単語辞書に含まれないパスワードであれば、辞書攻撃に耐えることができます。`;
                        }
                        btnStartAttack.disabled = false;
                        return;
                    }
                    
                    const batchSize = alg === "sha256" ? 10 : 1; // Bcrypt is processed 1-by-1 due to speed
                    const candidates = commonPasswords.slice(currentIdx, currentIdx + batchSize);
                    
                    // Call API to verify candidates
                    const result = await app.apiCall("/api/hashing/attack", "POST", {
                        target_hash: targetHash,
                        is_bcrypt: (alg === "bcrypt"),
                        dictionary: candidates
                    });
                    
                    currentIdx += candidates.length;
                    
                    // Update animation state
                    const percent = Math.min((currentIdx / total) * 100, 100);
                    attackProgressFill.style.width = `${percent}%`;
                    attackAttempts.innerText = `${currentIdx} 回試行`;
                    attackStatusText.innerText = `🔍 解析実行中 (${candidates[candidates.length - 1]})...`;
                    
                    if (result.success) {
                        found = true;
                    }
                    
                    // Slow down visualization of loop to make it visible
                    setTimeout(runStep, alg === "sha256" ? 100 : 400);
                };
                
                await runStep();
                
            } catch (err) {
                attackReport.innerText = "エラー: " + err.message;
                btnStartAttack.disabled = false;
            }
        });
    }
};
