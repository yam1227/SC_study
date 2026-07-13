/**
 * Module 5: Cryptography & Digital Signature Lab
 */
window.SecurityLabModules["crypto"] = {
    html: `
        <div class="lab-container">
            <!-- 1. Symmetric Encryption -->
            <div class="card">
                <h3>🔐 共通鍵暗号 (AES-256-GCM)</h3>
                <p class="card-subtitle">同じ鍵（共通鍵）を使って暗号化と復号を行います。認証付き暗号である GCM は改ざん検知機能も含みます。</p>
                
                <div class="lab-grid-2" style="gap: 20px;">
                    <div>
                        <div class="form-group">
                            <label for="symPlaintext">暗号化する平文メッセージ:</label>
                            <input type="text" id="symPlaintext" value="セキスペ試験合格を目指す！" placeholder="暗号化したいテキストを入力">
                        </div>
                        <button class="btn btn-primary" id="btnSymEncrypt">暗号化を実行</button>
                        
                        <div class="form-group" style="margin-top: 14px;">
                            <label>生成された共通鍵 (256-bit Hex):</label>
                            <div class="response-box" style="padding: 10px;">
                                <code id="outSymKey">鍵未生成</code>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div class="form-group">
                            <label for="symCiphertext">暗号文 (Hex) ※意図的に改ざん可能:</label>
                            <input type="text" id="symCiphertext" placeholder="暗号化後にここを編集して改ざんテストができます">
                        </div>
                        <div class="form-group">
                            <label for="symNonce">一時値 Nonce / IV (Hex):</label>
                            <input type="text" id="symNonce" placeholder="自動挿入されます">
                        </div>
                        <div class="form-group">
                            <label for="symTag">GCMタグのHEX値 ※意図的に改ざん可能:</label>
                            <input type="text" id="symTag" placeholder="自動挿入されます。改ざんすると整合性検証で弾かれます">
                        </div>
                        <button class="btn btn-secondary" id="btnSymDecrypt" style="border-color: var(--color-success);">復号を実行</button>
                    </div>
                </div>
                
                <div class="info-note" style="margin-top: 14px; border-left: 3px solid var(--color-primary-hover); background: rgba(255,255,255,0.02); padding: 12px; border-radius: 4px; font-size: 12px; line-height: 1.5;">
                    <span style="color: var(--color-primary-hover); font-weight: 600;">💡 認証タグ（Tag / MAC）とは？</span><br>
                    <span style="color: var(--text-secondary);">
                        GCM（Galois/Counter Mode）などの<b>認証付き暗号 (AEAD)</b>において、暗号化と同時に生成されるチェックサム（通常16バイト）です。
                        このタグは、平文・暗号文・鍵・Nonceから数学的に算出され、復号時にサーバーで再計算して一致するか確認されます。
                        <b>暗号文やNonce、あるいはタグ自身が1文字でも改ざんされると、タグの検証で失敗し、復号エラー（改ざん検知）となります。</b>
                    </span>
                </div>
                
                <div class="form-group" style="margin-top: 14px;">
                    <label>共通鍵 復号レポート:</label>
                    <div class="response-box" id="symReportBox">
                        <code id="symReport">復号を実行してください。</code>
                    </div>
                </div>
            </div>

            <!-- 2. Asymmetric & Signature -->
            <div class="lab-grid-2">
                <!-- RSA Key Generation & Encryption -->
                <div class="card">
                    <h3>🔑 公開鍵暗号 (RSA-2048)</h3>
                    <p class="card-subtitle">公開鍵（誰でも取得可能）で暗号化し、対となる秘密鍵（本人のみ保持）で復号します。</p>
                    
                    <button class="btn btn-secondary" id="btnGenRsaKeys">RSA 2048鍵ペアを生成</button>
                    
                    <div id="rsaKeysArea" style="display: none; flex-direction: column; gap: 10px;">
                        <div class="form-group">
                            <label>公開鍵 (Public Key PEM - 受信者に送る鍵):</label>
                            <textarea id="outRsaPublicKey" class="jwt-editor" style="height: 100px; font-size: 10px;" readonly></textarea>
                        </div>
                        <div class="form-group">
                            <label>秘密鍵 (Private Key PEM - 本人が隠し持つ鍵):</label>
                            <textarea id="outRsaPrivateKey" class="jwt-editor" style="height: 100px; font-size: 10px;" readonly></textarea>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="asymPlaintext">暗号化するメッセージ:</label>
                        <input type="text" id="asymPlaintext" value="機密データの送信" placeholder="メッセージを入力">
                    </div>
                    
                    <button class="btn btn-primary" id="btnAsymEncrypt" disabled>公開鍵で暗号化</button>
                    
                    <div class="form-group">
                        <label>暗号文 (RSA Ciphertext Hex):</label>
                        <div class="response-box" style="height: 80px; overflow-y: auto;">
                            <code id="outAsymCiphertext" style="color: #fb7185;">暗号文未生成</code>
                        </div>
                    </div>
                    
                    <button class="btn btn-secondary" id="btnAsymDecrypt" style="border-color: var(--color-success);" disabled>秘密鍵で復号</button>
                    
                    <div class="form-group">
                        <label>公開鍵 復号レポート:</label>
                        <div class="response-box" id="asymReportBox">
                            <code id="asymReport">復号を実行してください。</code>
                        </div>
                    </div>
                </div>

                <!-- Digital Signature -->
                <div class="card">
                    <h3>✍️ デジタル署名と完全性 (Integrity) 検証</h3>
                    <p class="card-subtitle">本人が「秘密鍵」で署名し、受信者が「公開鍵」で検証することで、送信元の真正性とデータの無改ざん（完全性）を証明します。</p>
                    
                    <div class="form-group">
                        <label for="signMessage">送信するメッセージ内容:</label>
                        <input type="text" id="signMessage" value="振込指示: 鈴木へ10,000円" placeholder="署名対象のテキスト">
                    </div>
                    
                    <button class="btn btn-primary" id="btnSignMessage" disabled>メッセージに秘密鍵で署名</button>
                    
                    <div class="form-group">
                        <label>生成されたデジタル署名 (Digital Signature Hex):</label>
                        <div class="response-box" style="height: 80px; overflow-y: auto;">
                            <code id="outSignature" style="color: #34d399;">署名未生成</code>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="verifyMessage">受信メッセージ内容 (※ここで改ざんをシミュレート可能):</label>
                        <input type="text" id="verifyMessage" value="振込指示: 鈴木へ10,000円" placeholder="受信メッセージ">
                    </div>
                    
                    <button class="btn btn-secondary" id="btnVerifySignature" style="border-color: var(--color-success);" disabled>署名を公開鍵で検証</button>
                    
                    <div class="form-group">
                        <label>署名検証レポート:</label>
                        <div class="response-box" id="signatureReportBox">
                            <code id="signatureReport">検証を実行してください。</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: function (app) {
        const sessionId = "session_" + Math.random().toString(36).substring(2, 12);

        // 1. Symmetric Elements
        const symPlaintext = document.getElementById("symPlaintext");
        const btnSymEncrypt = document.getElementById("btnSymEncrypt");
        const outSymKey = document.getElementById("outSymKey");
        const symCiphertext = document.getElementById("symCiphertext");
        const symNonce = document.getElementById("symNonce");
        const symTag = document.getElementById("symTag");
        const btnSymDecrypt = document.getElementById("btnSymDecrypt");
        const symReport = document.getElementById("symReport");
        const symReportBox = document.getElementById("symReportBox");

        // 2. Asymmetric Elements
        const btnGenRsaKeys = document.getElementById("btnGenRsaKeys");
        const rsaKeysArea = document.getElementById("rsaKeysArea");
        const outRsaPublicKey = document.getElementById("outRsaPublicKey");
        const outRsaPrivateKey = document.getElementById("outRsaPrivateKey");
        const asymPlaintext = document.getElementById("asymPlaintext");
        const btnAsymEncrypt = document.getElementById("btnAsymEncrypt");
        const outAsymCiphertext = document.getElementById("outAsymCiphertext");
        const btnAsymDecrypt = document.getElementById("btnAsymDecrypt");
        const asymReport = document.getElementById("asymReport");
        const asymReportBox = document.getElementById("asymReportBox");

        // 3. Signature Elements
        const signMessage = document.getElementById("signMessage");
        const btnSignMessage = document.getElementById("btnSignMessage");
        const outSignature = document.getElementById("outSignature");
        const verifyMessage = document.getElementById("verifyMessage");
        const btnVerifySignature = document.getElementById("btnVerifySignature");
        const signatureReport = document.getElementById("signatureReport");
        const signatureReportBox = document.getElementById("signatureReportBox");

        let hasKeys = false;

        // --- 1. AES Symmetric Handlers ---
        btnSymEncrypt.addEventListener("click", async () => {
            const text = symPlaintext.value.trim();
            if (!text) {
                alert("暗号化するテキストを入力してください。");
                return;
            }

            try {
                const res = await app.apiCall("/api/crypto/symmetric/encrypt", "POST", {
                    plaintext: text
                });

                outSymKey.innerText = res.key_hex;
                symCiphertext.value = res.ciphertext_hex;
                symNonce.value = res.nonce_hex;
                symTag.value = res.tag_hex;

                symReport.innerText = "暗号化が正常に完了しました。暗号文や認証タグの値を書き換えて「復号を実行」すると、改ざん検知のテストができます。";
                symReportBox.style.borderColor = "var(--border-color)";
            } catch (err) {
                alert("共通鍵暗号化エラー: " + err.message);
            }
        });

        btnSymDecrypt.addEventListener("click", async () => {
            const ciphertext = symCiphertext.value.trim();
            const nonce = symNonce.value.trim();
            const tag = symTag.value.trim();
            const key = outSymKey.innerText.trim();

            if (!ciphertext || !nonce || !tag || key === "鍵未生成") {
                alert("暗号文、Nonce、認証タグ、共通鍵が必要です。先に暗号化を実行してください。");
                return;
            }

            try {
                const res = await app.apiCall("/api/crypto/symmetric/decrypt", "POST", {
                    ciphertext_hex: ciphertext,
                    nonce_hex: nonce,
                    tag_hex: tag,
                    key_hex: key
                });

                symReportBox.style.borderColor = "var(--color-success)";
                symReport.innerHTML = `
                    <span style="color: var(--color-success); font-weight: bold;">🟢 復号成功 (Authentication Successful)</span>
                    <br>平文メッセージ: <b>${res.plaintext}</b>
                    <br>※認証タグ（GCM）が一致し、通信経路上の改ざんがされていないことが証明されました。
                `;
            } catch (err) {
                symReportBox.style.borderColor = "var(--color-danger)";
                symReport.innerHTML = `
                    <span style="color: var(--color-danger); font-weight: bold;">🔴 復号失敗 (Decryption Failed)</span>
                    <br>エラー詳細: ${err.message}
                    <br>※AES-GCMの整合性チェックに失敗しました。暗号文が改ざんされたか、鍵が異なっています！
                `;
            }
        });

        // --- 2. Asymmetric RSA Handlers ---
        btnGenRsaKeys.addEventListener("click", async () => {
            btnGenRsaKeys.disabled = true;
            btnGenRsaKeys.innerText = "生成中...";

            try {
                const res = await app.apiCall(`/api/crypto/generate-keys?session_id=${sessionId}`, "POST");

                outRsaPublicKey.value = res.public_key_pem;
                outRsaPrivateKey.value = res.private_key_pem;
                rsaKeysArea.style.display = "flex";

                hasKeys = true;
                btnAsymEncrypt.disabled = false;
                btnSignMessage.disabled = false;
                btnGenRsaKeys.innerText = "RSA 鍵ペア再生成";

                app.log('system', 'RSA 2048-bit 鍵ペアを生成し、メモリに保存しました。');
            } catch (err) {
                alert("鍵生成エラー: " + err.message);
            } finally {
                btnGenRsaKeys.disabled = false;
            }
        });

        btnAsymEncrypt.addEventListener("click", async () => {
            const text = asymPlaintext.value.trim();
            if (!text) return;

            try {
                const res = await app.apiCall("/api/crypto/asymmetric/encrypt", "POST", {
                    session_id: sessionId,
                    plaintext: text
                });

                outAsymCiphertext.innerText = res.ciphertext_hex;
                btnAsymDecrypt.disabled = false;
                asymReport.innerText = "公開鍵（Public Key）による暗号化が完了しました。対応する秘密鍵でのみ復号できます。";
                asymReportBox.style.borderColor = "var(--border-color)";
            } catch (err) {
                alert("公開鍵暗号化エラー: " + err.message);
            }
        });

        btnAsymDecrypt.addEventListener("click", async () => {
            const ciphertext = outAsymCiphertext.innerText.trim();
            if (ciphertext === "暗号文未生成") return;

            try {
                const res = await app.apiCall("/api/crypto/asymmetric/decrypt", "POST", {
                    session_id: sessionId,
                    ciphertext_hex: ciphertext
                });

                asymReportBox.style.borderColor = "var(--color-success)";
                asymReport.innerHTML = `
                    <span style="color: var(--color-success); font-weight: bold;">🟢 復号成功</span>
                    <br>復号された平文: <b>${res.plaintext}</b>
                `;
            } catch (err) {
                asymReportBox.style.borderColor = "var(--color-danger)";
                asymReport.innerHTML = `
                    <span style="color: var(--color-danger); font-weight: bold;">🔴 復号失敗</span>
                    <br>${err.message}
                `;
            }
        });

        // --- 3. Digital Signature Handlers ---
        btnSignMessage.addEventListener("click", async () => {
            const msg = signMessage.value.trim();
            if (!msg) return;

            try {
                const res = await app.apiCall("/api/crypto/signature/sign", "POST", {
                    session_id: sessionId,
                    message: msg
                });

                outSignature.innerText = res.signature_hex;
                verifyMessage.value = msg;
                btnVerifySignature.disabled = false;

                signatureReport.innerText = "秘密鍵（Private Key）による電子署名の生成が完了しました。受信者側で「メッセージ」と「公開鍵」を用いて署名を検証できます。";
                signatureReportBox.style.borderColor = "var(--border-color)";
            } catch (err) {
                alert("署名生成エラー: " + err.message);
            }
        });

        btnVerifySignature.addEventListener("click", async () => {
            const msg = verifyMessage.value.trim();
            const signature = outSignature.innerText.trim();

            if (signature === "署名未生成") return;

            try {
                const res = await app.apiCall("/api/crypto/signature/verify", "POST", {
                    session_id: sessionId,
                    message: msg,
                    signature_hex: signature
                });

                if (res.valid) {
                    signatureReportBox.style.borderColor = "var(--color-success)";
                    signatureReport.innerHTML = `
                        <span style="color: var(--color-success); font-weight: bold;">🟢 署名検証成功 (Signature Valid)</span>
                        <br>${res.message}
                        <br>※送信者が秘密鍵を所有していること（真正性）、およびメッセージが途中で改ざんされていないこと（完全性）が立証されました。
                    `;
                } else {
                    signatureReportBox.style.borderColor = "var(--color-danger)";
                    signatureReport.innerHTML = `
                        <span style="color: var(--color-danger); font-weight: bold;">🔴 署名検証失敗 (Signature Invalid)</span>
                        <br>${res.message}
                        <br>※【警告】: ハッシュ値が不一致です。通信経路上でデータが書き換えられたか、異なる署名鍵が使われました。
                    `;
                }
            } catch (err) {
                alert("検証API呼び出しエラー: " + err.message);
            }
        });
    }
};
