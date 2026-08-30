/**
 * Module 12: Email Security & Domain Authentication (SPF, DKIM, DMARC) Lab
 * 情報処理安全確保支援士 試験対策対応 - メールセキュリティ ＆ 送信元ドメイン認証モジュール
 */
window.SecurityLabModules["email_security"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container" style="display: flex; gap: 12px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px; margin-bottom: 24px;">
                <button class="btn btn-tab active text-md" id="btnTabEmailFlow" style="font-weight: 600; padding: 10px 20px; border-radius: var(--radius-md); transition: all 0.2s;">
                    ✉️ ① メール送受信 ＆ ヘッダ構造
                </button>
                <button class="btn btn-tab text-md" id="btnTabEmailAuth" style="font-weight: 600; padding: 10px 20px; border-radius: var(--radius-md); transition: all 0.2s;">
                    🛡️ ② 送信元ドメイン認証 (SPF / DKIM / DMARC)
                </button>
            </div>

            <!-- TAB 1: Email Flow & Headers -->
            <div id="panelEmailFlow" class="tab-panel active">
                <div class="card" style="margin-bottom: 24px; border: 1px solid rgba(99,102,241,0.2); background: var(--bg-card);">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
                        <div>
                            <h3 class="text-xl" style="margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                ✉️ メール送受信フロー ＆ ヘッダ構造シミュレータ
                            </h3>
                            <p class="card-subtitle text-base text-muted" style="margin-top: 4px; line-height: 1.5;">
                                SMTP / POP3 によるメール配送プロセスを視覚的に体験し、<code>Received</code> ヘッダの追記、<code>Envelope-From (MAIL FROM)</code> と <code>Header From (From:)</code> の分離構造、および <code>DKIM</code> 署名の有無による相違点を学びます。
                            </p>
                        </div>
                        <span class="badge subtab-badge badge-subtle-primary" style="padding: 6px 12px;">
                            セキスペ頻出: メールヘッダ解析
                        </span>
                    </div>

                    <div class="lab-grid-3" style="grid-template-columns: 1fr 1.25fr 1.25fr; gap: 20px; margin-top: 15px;">
                        <!-- Left: Mail Composition Form -->
                        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                                <span class="text-md" style="font-weight: 700; color: var(--text-primary);">1. 送信メール設定</span>
                                <span class="text-xs text-muted" style="background: var(--bg-panel); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">模擬MUA</span>
                            </div>
                            
                            <div class="form-group" style="margin: 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <label class="text-xs" style="font-weight: 600; color: var(--text-primary);">Envelope-From (MAIL FROM):</label>
                                    <span class="text-xs badge-subtle-primary" style="padding: 2px 8px; border-radius: 4px;">SMTP制御用</span>
                                </div>
                                <input type="text" id="emailEnvFrom" class="text-base" value="support@trusted-bank.com" style="width: 100%; padding: 8px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);" placeholder="SMTP通信で使用する本来の送信者">
                                <span class="text-xs text-muted" style="margin-top: 2px; display: block;">※ SMTPセッションでMTAに伝える送信ドメイン（SPF検証対象）</span>
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <label class="text-xs" style="font-weight: 600; color: var(--text-primary);">Header From (From:):</label>
                                    <span class="text-xs badge-subtle-danger" style="padding: 2px 8px; border-radius: 4px;">メーラー表示用</span>
                                </div>
                                <input type="text" id="emailHeaderFrom" class="text-base" value="support@trusted-bank.com" style="width: 100%; padding: 8px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);" placeholder="メールヘッダに表示する送信者">
                                <span class="text-xs text-muted" style="margin-top: 2px; display: block;">※ 受信者のメールソフトに表示される差出人（なりすまし可能な領域）</span>
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <label class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: block;">To (宛先):</label>
                                <input type="text" id="emailTo" class="text-base" value="user@my-isp.ne.jp" style="width: 100%; padding: 8px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);">
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <label class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: block;">Subject (件名) ＆ Body (本文):</label>
                                <input type="text" id="emailSubject" class="text-base" value="【重要】ログイン情報の確認" style="width: 100%; padding: 8px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); margin-bottom: 8px;">
                                <textarea id="emailBody" class="text-sm" style="width: 100%; height: 75px; padding: 8px; font-family: var(--font-sans); background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); resize: vertical;" placeholder="本文を入力...">セキュリティ設定を更新してください。</textarea>
                            </div>

                            <div style="margin-top: 8px; display: flex; gap: 10px;">
                                <button class="btn btn-primary text-base" id="btnStartEmailSend" style="flex: 1; font-weight: 600; padding: 10px;">🚀 メール送信実行</button>
                                <button class="btn btn-lime-outline text-sm" id="btnResetEmailFlow" style="padding: 10px 14px;">🔄 リセット</button>
                            </div>
                        </div>

                        <!-- Middle: Send Sequence Animation & SMTP Log -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <span class="text-md" style="font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 8px;">2. 配送経路ステータスアニメーション</span>
                                <div class="email-flow-visual" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); border: 1px solid var(--border-color); padding: 16px 14px; border-radius: var(--radius-md); position: relative; min-height: 85px;">
                                    <div style="text-align: center; z-index: 2; flex: 1;">
                                        <span class="node-icon-lg" style="transition: transform 0.2s;" id="nodeSenderPC">💻</span>
                                        <div class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">送信PC</div>
                                    </div>
                                    <div class="flow-arrow" id="arrowSendToMta1" style="flex: 1; border-top: 2px dashed #64748b; height: 1px; margin: 0 4px; position: relative;">
                                        <div class="flow-dot" id="dotFlow1" style="display: none; position: absolute; top: -6px; left: 0; width: 10px; height: 10px; background-color: #6366f1; border-radius: 50%; box-shadow: 0 0 8px #6366f1;"></div>
                                    </div>
                                    <div style="text-align: center; z-index: 2; flex: 1;">
                                        <span class="node-icon-lg" style="transition: transform 0.2s;" id="nodeMta1">📤</span>
                                        <div class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">送信MTA<br><span class="text-xs text-muted" style="font-weight: normal;">(送信サーバ)</span></div>
                                    </div>
                                    <div class="flow-arrow" id="arrowMta1ToMta2" style="flex: 1; border-top: 2px dashed #64748b; height: 1px; margin: 0 4px; position: relative;">
                                        <div class="flow-dot" id="dotFlow2" style="display: none; position: absolute; top: -6px; left: 0; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></div>
                                    </div>
                                    <div style="text-align: center; z-index: 2; flex: 1;">
                                        <span class="node-icon-lg" style="transition: transform 0.2s;" id="nodeMta2">📥</span>
                                        <div class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">受信MTA<br><span class="text-xs text-muted" style="font-weight: normal;">(受信サーバ)</span></div>
                                    </div>
                                    <div class="flow-arrow" id="arrowMta2ToRecvPC" style="flex: 1; border-top: 2px dashed #64748b; height: 1px; margin: 0 4px; position: relative;">
                                        <div class="flow-dot" id="dotFlow3" style="display: none; position: absolute; top: -6px; left: 0; width: 10px; height: 10px; background-color: #ec4899; border-radius: 50%; box-shadow: 0 0 8px #ec4899;"></div>
                                    </div>
                                    <div style="text-align: center; z-index: 2; flex: 1;">
                                        <span class="node-icon-lg" style="transition: transform 0.2s;" id="nodeRecvPC">💻</span>
                                        <div class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">受信PC</div>
                                    </div>
                                </div>
                                <div class="text-xs" style="text-align: center; font-weight: 600; color: #38bdf8; margin-top: 6px; min-height: 18px;" id="emailFlowStatusText">
                                    待機中（「メール送信実行」を押してください）
                                </div>
                            </div>

                            <div style="flex: 1; display: flex; flex-direction: column; min-height: 250px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <label class="text-base" style="font-weight: 700; color: var(--text-primary);">💻 SMTP / POP3 セッションプロトコル通信ログ:</label>
                                    <span class="text-xs" style="color: #38bdf8;">Terminal Stream</span>
                                </div>
                                <div class="response-box text-sm text-mono" style="flex: 1; overflow-y: auto; background-color: #090d16; border: 1px solid rgba(99,102,241,0.3); border-radius: var(--radius-md); padding: 12px; line-height: 1.5; color: #38bdf8;">
                                    <div id="emailProtocolLog">送信を実行すると、SMTP/POP3セッションのコマンドとレスポンスのリアルタイム履歴がここに展開されます。</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Raw E-mail Headers display with toggle -->
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                <span class="text-base" style="font-weight: 700; color: var(--text-primary);">3. 受信メールヘッダ (Raw Data 解析)</span>
                                <div style="display: flex; gap: 6px;" id="headerDkimToggles">
                                    <button class="btn btn-tab-mini active text-xs" id="btnToggleDkimOn" style="font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer;">DKIMあり (署名付与)</button>
                                    <button class="btn btn-tab-mini text-xs" id="btnToggleDkimOff" style="font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer;">DKIMなし (無署名)</button>
                                </div>
                            </div>
                            <div class="text-sm text-mono" style="flex: 1; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; line-height: 1.5; overflow-y: auto; max-height: 440px; min-height: 350px; color: var(--text-primary); white-space: pre-wrap;" id="emailHeaderViewer">※ メールを受信すると、ここに構築されたメールヘッダが表示されます。右上の「DKIMあり / なし」のトグルを切り替えることで、署名ヘッダ (DKIM-Signature) の有無を瞬時に確認できます。</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Domain Authentication (SPF / DKIM / DMARC) -->
            <div id="panelEmailAuth" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 24px; border: 1px solid rgba(16,185,129,0.2); background: var(--bg-card);">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
                        <div>
                            <h3 class="text-xl" style="margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                🛡️ 送信元ドメイン認証 (SPF, DKIM, DMARC) ＆ アライメント検証
                            </h3>
                            <p class="card-subtitle text-base text-muted" style="margin-top: 4px; line-height: 1.5;">
                                接続元メールサーバのIPアドレスや模擬DNSレコードをもとに、受信サーバ（受信MTA）がどのように送信元詐称を検知するか、および <strong>DMARCアライメント判定</strong> のフローをシミュレーションします。
                            </p>
                        </div>
                        <span class="badge subtab-badge badge-subtle-success" style="padding: 6px 12px;">
                            試験最重要: DMARCアライメント
                        </span>
                    </div>

                    <div class="lab-grid-3" style="grid-template-columns: 1.15fr 1.6fr 1.25fr; gap: 20px; margin-top: 15px;">
                        
                        <!-- Left: Simulation Environment & Configuration -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                                <span class="text-md" style="font-weight: 700; color: var(--text-primary); display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">1. 検証条件シナリオの設定</span>
                                
                                <div class="form-group" style="margin: 0;">
                                    <label class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: block;">送信メールシナリオ選択:</label>
                                    <select id="authMailPreset" class="text-xs" style="width: 100%; padding: 8px 10px; background-color: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer;">
                                        <option value="legit">【正当】銀行からの正規メール（SPF/DKIM/DMARC 一致）</option>
                                        <option value="spoof_spf_fail">【詐称】攻撃者IPからのなりすまし（SPF検証失敗）</option>
                                        <option value="spoof_spf_align_fail">【詐称】送信者ドメイン違い（SPF合格だがアライメント失敗）</option>
                                        <option value="spoof_dkim_fail">【詐称】署名改ざん・キー無効（DKIM検証失敗）</option>
                                        <option value="spoof_dmarc_fail">【詐称】完全ななりすまし（SPF/DKIM/DMARC すべて失敗）</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px; display: block;">接続元送信IPアドレス:</label>
                                    <input type="text" id="authSenderIp" class="text-xs" value="192.0.2.10" style="width: 100%; padding: 6px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);" readonly>
                                    <span class="text-xs text-muted">※ 送信元MTAの物理IPアドレス</span>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px; display: block;">Envelope-From ドメイン (MAIL FROM):</label>
                                    <input type="text" id="authEnvFromDom" class="text-xs" value="trusted-bank.com" style="width: 100%; padding: 6px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);" readonly>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label class="text-xs" style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px; display: block;">Header From ドメイン (From:):</label>
                                    <input type="text" id="authHeaderFromDom" class="text-xs" value="trusted-bank.com" style="width: 100%; padding: 6px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);" readonly>
                                </div>

                                <div class="form-group" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="authMailHasDkim" checked disabled style="width: 16px; height: 16px;">
                                    <label class="text-xs" style="color: var(--text-primary); margin: 0;">DKIM署名が存在する</label>
                                </div>

                                <div style="margin-top: 6px;">
                                    <button class="btn btn-primary text-base" id="btnStartAuthVerify" style="width: 100%; font-weight: 700; padding: 10px;">🔍 認証＆アライメント検証を実行</button>
                                </div>
                            </div>

                            <!-- DNS Records Panel -->
                            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 10px;">
                                <span class="text-base" style="font-weight: 700; color: var(--text-primary); display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">🌐 模擬DNSレコード設定 (受信MTA参照用)</span>
                                
                                <div>
                                    <div class="text-xs text-primary-color" style="font-weight: 700; margin-bottom: 4px;">trusted-bank.com の DNS Record:</div>
                                    <div class="text-xs text-mono" style="background: #090d16; padding: 8px 10px; border-radius: 4px; border: 1px solid var(--border-subtle-primary); line-height: 1.4; color: #e2e8f0;">
                                        IN TXT "v=spf1 ip4:192.0.2.0/24 -all"<br>
                                        _dmarc IN TXT "v=DMARC1; p=reject; pct=100; aspf=r; adkim=r"<br>
                                        selector1._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
                                    </div>
                                </div>
                                <div>
                                    <div class="text-xs text-danger-color" style="font-weight: 700; margin-bottom: 4px;">malicious.domain の DNS Record:</div>
                                    <div class="text-xs text-mono" style="background: #090d16; padding: 8px 10px; border-radius: 4px; border: 1px solid var(--border-subtle-danger); line-height: 1.4; color: #e2e8f0;">
                                        IN TXT "v=spf1 ip4:198.51.100.0/24 -all"<br>
                                        _dmarc IN TXT "v=DMARC1; p=none"<br>
                                        selector1._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Middle: Domain Verification Flow Visualizer -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <span class="text-md" style="font-weight: 700; color: var(--text-primary); display: block;">2. 受信MTAでの段階的ドメイン認証 ＆ アライメント検証</span>
                            
                            <div class="auth-flow-grid" style="display: flex; flex-direction: column; gap: 14px;">
                                <!-- Row 1: SPF & DKIM parallel verification -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <!-- SPF Validation Block -->
                                    <div id="blockVerifySPF" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; background: var(--bg-card); display: flex; flex-direction: column; gap: 8px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                            <span class="text-base" style="font-weight: 700; color: var(--text-primary);">① SPF検証</span>
                                            <span id="badgeSpfResult" class="badge subtab-badge" style="padding: 3px 8px; background-color: var(--bg-panel); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div class="text-xs text-muted" style="line-height: 1.4;" id="textSpfVerifyStatus">
                                            DNSから Envelope-From の SPF TXT レコードを取得し、接続元IPが許可されているか照合します。
                                        </div>
                                    </div>

                                    <!-- DKIM Validation Block -->
                                    <div id="blockVerifyDKIM" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; background: var(--bg-card); display: flex; flex-direction: column; gap: 8px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                            <span class="text-base" style="font-weight: 700; color: var(--text-primary);">② DKIM検証</span>
                                            <span id="badgeDkimResult" class="badge subtab-badge" style="padding: 3px 8px; background-color: var(--bg-panel); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div class="text-xs text-muted" style="line-height: 1.4;" id="textDkimVerifyStatus">
                                            DKIM-Signature ヘッダーのドメインDNSから公開鍵を取得し、電子署名を検証します。
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 2: DMARC Alignment checks -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <!-- SPF Alignment Block -->
                                    <div id="blockAlignSPF" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; background: var(--bg-card); display: flex; flex-direction: column; gap: 8px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                            <span class="text-base" style="font-weight: 700; color: var(--text-primary);">③ SPFアライメント</span>
                                            <span id="badgeSpfAlignResult" class="badge subtab-badge" style="padding: 3px 8px; background-color: var(--bg-panel); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div class="text-xs text-muted" style="line-height: 1.4;" id="textSpfAlignStatus">
                                            Header From (表示差出人) と Envelope-From (通信送信元) のドメイン一致を判定します。
                                        </div>
                                    </div>

                                    <!-- DKIM Alignment Block -->
                                    <div id="blockAlignDKIM" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; background: var(--bg-card); display: flex; flex-direction: column; gap: 8px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                            <span class="text-base" style="font-weight: 700; color: var(--text-primary);">④ DKIMアライメント</span>
                                            <span id="badgeDkimAlignResult" class="badge subtab-badge" style="padding: 3px 8px; background-color: var(--bg-panel); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div class="text-xs text-muted" style="line-height: 1.4;" id="textDkimAlignStatus">
                                            Header From と DKIM署名内のドメイン (<code>d=</code>) の一致を判定します。
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 3: DMARC Policy integration -->
                                <div id="blockDmarcPolicy" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: var(--bg-card); display: flex; flex-direction: column; gap: 10px; transition: all 0.3s;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span class="text-xl">🛡️</span>
                                            <span class="text-md" style="font-weight: 700; color: var(--text-primary);">⑤ DMARC総合判定 ＆ 受信アクション決定</span>
                                        </div>
                                        <span id="badgeDmarcResult" class="badge subtab-badge" style="font-weight: 700; padding: 4px 12px; background-color: var(--bg-panel); border: 1px solid var(--border-color); display: none;">N/A</span>
                                    </div>
                                    <div class="text-xs text-muted" style="display: flex; gap: 16px; line-height: 1.5;">
                                        <div style="flex: 1;" id="textDmarcPolicyStatus">
                                            SPFおよびDKIMの認証結果、アライメント結果を総合評価します。アライメントを満たしたSPFまたはDKIMのいずれかが成功していればDMARC合格(PASS)となります。失敗時はポリシー (p=none/quarantine/reject) に従い処理します。
                                        </div>
                                        <div style="width: 150px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 6px;" id="dmarcActionBox">
                                            <span class="text-xs text-muted" style="font-weight: 600;">最終受信アクション</span>
                                            <span class="text-md" style="font-weight: 800; color: var(--text-primary);" id="textDmarcFinalAction">検証前</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Detailed Explanations & Exam tips -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div class="callout-box callout-primary text-base text-muted" id="authDetailBox">
                                <span class="text-md" style="font-weight: 700; color: #a5b4fc; border-bottom: 1px solid var(--border-subtle-primary); padding-bottom: 6px; display: block; margin-bottom: 10px;">
                                    💡 認証結果の詳細解説
                                </span>
                                <div id="authDetailContent">
                                    検証シナリオを選択し「認証＆アライメント検証を実行」を押すと、各ステップでの判定結果およびセキスペ試験に直結する技術的背景が表示されます。<br><br>
                                    <strong>「なぜSPFだけではなりすましを防げないのか」「DMARCアライメントの役割とは何か」</strong>を視覚的に理解しましょう。
                                </div>
                            </div>
                            
                            <div class="callout-box callout-warning text-sm text-muted" style="max-height: 480px; overflow-y: auto;">
                                <span class="text-md text-warning-color" style="font-weight: 700; border-bottom: 1px solid var(--border-subtle-warning); padding-bottom: 6px; display: block; margin-bottom: 10px;">
                                    🔑 セキスペ試験・超重要キーワード解説
                                </span>
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <div>
                                        <strong class="text-base text-warning-color" style="display: block; margin-bottom: 2px;">■ SPFレコード (Sender Policy Framework)</strong>
                                        送信ドメインのDNSに登録する、正当なメール送信サーバのIPアドレスリストです。<br>
                                        <code class="text-sm text-mono" style="display: block; background: #090d16; padding: 4px 8px; margin-top: 4px; border-radius: 4px; color: #cbd5e1; border: 1px solid var(--border-color);">v=spf1 ip4:192.0.2.0/24 -all</code>
                                        末尾の修飾子 (Qualifier):
                                        <ul style="margin: 4px 0 0 16px; padding: 0;">
                                            <li><code>-all</code> (Fail): 許可リスト外からのメールを不合格（拒否推奨）とする。</li>
                                            <li><code>~all</code> (SoftFail): リスト外を不合格にしつつ受信許可（DMARC等に判断を委ねる）。</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <strong class="text-base text-warning-color" style="display: block; margin-bottom: 2px;">■ SPF / DKIM アライメント (DMARC必須条件)</strong>
                                        DMARC認証をパスするためのドメイン整合性チェックです。
                                        <ul style="margin: 4px 0 0 16px; padding: 0;">
                                            <li><strong>SPFアライメント</strong>: メーラーの表示差出人 (<code>Header From</code>) と SMTP送信元 (<code>Envelope-From</code>) が一致しているかを検証。</li>
                                            <li><strong>DKIMアライメント</strong>: <code>Header From</code> と DKIM署名タグのドメイン (<code>d=</code>) が一致しているかを検証。</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <strong class="text-base text-warning-color" style="display: block; margin-bottom: 2px;">■ SMTP-AUTH (SMTP認証)</strong>
                                        メールクライアントが送信MTAに対してID・パスワードで認証を行い、許可された正規ユーザーのみに送信を許可する技術（<strong>送信側の防衛策</strong>）。
                                    </div>

                                    <div style="border-top: 1px dashed rgba(245, 158, 11, 0.3); padding-top: 8px;">
                                        <strong class="text-base text-warning-color" style="display: block; margin-bottom: 2px;">💡 セキスペ試験での問われ方</strong>
                                        試験では「送信者認証 (SMTP-AUTH)」と「送信ドメイン認証 (SPF/DKIM/DMARC)」の役割の違いが頻出します。
                                        <ul style="margin: 4px 0 0 16px; padding: 0;">
                                            <li><strong>SMTP-AUTH</strong> ➔ 第三者によるオープンリレー（迷惑メール踏み台化）を防止。</li>
                                            <li><strong>SPF / DKIM / DMARC</strong> ➔ 受信側で差出人の偽装（なりすまし・フィッシング）を検知。</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    examTips: [
        "<strong>SPF</strong>: 送信元メールサーバのIPアドレスを送信ドメイン（Envelope-From）のDNS TXTレコード（SPFレコード）と照合して検証。第三者中継・転送時にIPが変わるとFailする弱点がある。",
        "<strong>DKIM</strong>: 送信元MTAがメールヘッダ＋本文のハッシュ値を秘密鍵で署名（<code>DKIM-Signature</code> ヘッダ）。受信側は送信側DNSから公開鍵を取得して検証。中継・転送されても本文が改ざんされていなければパスする。",
        "<strong>DMARC</strong>: SPF / DKIMの検証結果と、メールヘッダの <code>From:</code> ドメインの一致（<strong>アライメント</strong>）を検証。失敗時の振る舞い（<code>none</code>: 受信許可, <code>quarantine</code>: 隔離, <code>reject</code>: 拒否）を送信元が宣言できる。"
    ],

    quiz: [
        {
            id: "emailQuiz_1",
            year: "令和3年秋期 午前Ⅱ 問12 (送信ドメイン認証)",
            question: "電子メールの送信元ドメインを認証する技術のうち、送信側メールサーバがメールヘッダや本文から算出したハッシュ値を秘密鍵で暗号化して電子署名を付与し、受信側が送信元ドメインのDNSサーバから取得した公開鍵で検証するものはどれか。",
            options: [
                { key: "A", label: "ア", text: "SPF (Sender Policy Framework)" },
                { key: "I", label: "イ", text: "DKIM (DomainKeys Identified Mail)" },
                { key: "U", label: "ウ", text: "DMARC" },
                { key: "E", label: "エ", text: "S/MIME" }
            ],
            answer: "I",
            explanation: "送信側MTAが秘密鍵で電子署名をヘッダ（<code>DKIM-Signature</code>）に付与し、受信側が送信元DNS公開鍵で検証する技術は <strong>DKIM</strong> です。<br><br>【他選択肢の比較】<br>・<strong>SPF</strong>: 送信元IPアドレスをDNSレコードと照合（電子署名は使わない）。<br>・<strong>DMARC</strong>: SPF/DKIMの認証結果とFromドメインの一致（アライメント）に基づきポリシーを適用する仕組み。<br>・<strong>S/MIME</strong>: クライアント端末間でエンドツーエンドの署名・暗号化を行う技術。",
            point: "「DNSに公開鍵を登録し、MTAが秘密鍵で電子署名を付与して検証」＝DKIM。"
        },
        {
            id: "emailQuiz_2",
            year: "令和元年秋期 午前Ⅱ 問15 (DMARCアライメント)",
            question: "DMARC (Domain-based Message Authentication, Reporting, and Conformance) の役割および機能として適切なものはどれか。",
            options: [
                { key: "A", label: "ア", text: "送信元IPアドレスに基づき、受信メールを破棄するか隔離するかのポリシーを受信側が設定する。" },
                { key: "I", label: "イ", text: "SPFまたはDKIMの認証結果に加え、Header From (From:) とのドメイン一致（アライメント）を確認し、認証失敗時のメール処理（受信/隔離/拒否）を送信側ドメイン管理者が宣言する。" },
                { key: "U", label: "ウ", text: "メール本文をエンドツーエンドで暗号化し、盗聴を防止する。" },
                { key: "E", label: "エ", text: "POP3/IMAPの通信経路全体をTLSによって暗号化する。" }
            ],
            answer: "I",
            explanation: "<strong>DMARC</strong> は、SPF/DKIMによる認証結果と、利用者のメールソフトに表示される <code>Header From (From:)</code> のドメインが一致しているか（<strong>アライメント判定</strong>）を検証し、認証失敗時のポリシー（<code>p=none / quarantine / reject</code>）やレポート受信アドレス（<code>rua / ruf</code>）を送信ドメイン管理者がDNSで宣言する仕組みです。",
            point: "「SPF/DKIM ＋ Header Fromの一致（アライメント）＋ 失敗時ポリシー宣言（none/quarantine/reject）」＝DMARC。"
        }
    ],

    references: [
        { source: "RFC 7208", title: "Sender Policy Framework (SPF) for Authorizing Use of Domains in Email", url: "https://datatracker.ietf.org/doc/html/rfc7208", note: "SPF検証標準仕様" },
        { source: "RFC 6376", title: "DomainKeys Identified Mail (DKIM) Signatures", url: "https://datatracker.ietf.org/doc/html/rfc6376", note: "電子署名によるメール認証仕様" },
        { source: "RFC 7489", title: "Domain-based Message Authentication, Reporting, and Conformance (DMARC)", url: "https://datatracker.ietf.org/doc/html/rfc7489", note: "DMARCポリシー＆アライメント判定仕様" },
        { source: "総務省 / 迷惑メール対策推進協議会", title: "送信ドメイン認証技術導入マニュアル", url: "https://www.soumu.go.jp/", note: "送信元偽装防止ガイドライン" }
    ],

    init: function (app) {
        // Tab switching logic via UIComponents
        if (window.UIComponents && window.UIComponents.setupSubTabs) {
            window.UIComponents.setupSubTabs([
                { btnId: "btnTabEmailFlow", panelId: "panelEmailFlow" },
                { btnId: "btnTabEmailAuth", panelId: "panelEmailAuth" }
            ], (btnId, panelId) => {
                if (app && app.log) {
                    app.log("system", `[メールセキュリティ] タブを切り替えました: ${panelId}`);
                }
            });
        }

        // ----------------------------------------------------
        // TAB 1: Email Flow Logic
        // ----------------------------------------------------
        const emailEnvFrom = document.getElementById("emailEnvFrom");
        const emailHeaderFrom = document.getElementById("emailHeaderFrom");
        const emailTo = document.getElementById("emailTo");
        const emailSubject = document.getElementById("emailSubject");
        const emailBody = document.getElementById("emailBody");
        const btnStartEmailSend = document.getElementById("btnStartEmailSend");
        const btnResetEmailFlow = document.getElementById("btnResetEmailFlow");

        const dotFlow1 = document.getElementById("dotFlow1");
        const dotFlow2 = document.getElementById("dotFlow2");
        const dotFlow3 = document.getElementById("dotFlow3");
        const emailFlowStatusText = document.getElementById("emailFlowStatusText");
        const emailProtocolLog = document.getElementById("emailProtocolLog");

        // Header view state variables for DKIM comparison
        let currentDkimTab = 'on'; // 'on' or 'off'
        let renderedHeadersDkimOn = "";
        let renderedHeadersDkimOff = "";

        const btnToggleDkimOn = document.getElementById("btnToggleDkimOn");
        const btnToggleDkimOff = document.getElementById("btnToggleDkimOff");
        const emailHeaderViewer = document.getElementById("emailHeaderViewer");

        const nodeSenderPC = document.getElementById("nodeSenderPC");
        const nodeMta1 = document.getElementById("nodeMta1");
        const nodeMta2 = document.getElementById("nodeMta2");
        const nodeRecvPC = document.getElementById("nodeRecvPC");

        function updateHeaderView() {
            if (renderedHeadersDkimOn === "" && renderedHeadersDkimOff === "") {
                emailHeaderViewer.innerText = "※ メールを受信すると、ここに構築されたメールヘッダが表示されます。上のトグルを切り替えることで、DKIM署名（電子署名ヘッダ）の有無を簡単に比較できます。";
                return;
            }
            if (currentDkimTab === 'on') {
                emailHeaderViewer.innerHTML = renderedHeadersDkimOn;
            } else {
                emailHeaderViewer.innerHTML = renderedHeadersDkimOff;
            }
        }

        btnToggleDkimOn.addEventListener("click", () => {
            currentDkimTab = 'on';
            btnToggleDkimOn.classList.add("active");
            btnToggleDkimOff.classList.remove("active");
            updateHeaderView();
        });

        btnToggleDkimOff.addEventListener("click", () => {
            currentDkimTab = 'off';
            btnToggleDkimOn.classList.remove("active");
            btnToggleDkimOff.classList.add("active");
            updateHeaderView();
        });

        function clearFlowAnimation() {
            dotFlow1.style.display = "none";
            dotFlow2.style.display = "none";
            dotFlow3.style.display = "none";
            dotFlow1.style.left = "0px";
            dotFlow2.style.left = "0px";
            dotFlow3.style.left = "0px";
            nodeSenderPC.style.transform = "none";
            nodeMta1.style.transform = "none";
            nodeMta2.style.transform = "none";
            nodeRecvPC.style.transform = "none";
        }

        async function animateDot(dot, speed = 800) {
            dot.style.display = "block";
            dot.style.transition = "none";
            dot.style.left = "0px";
            await new Promise(r => setTimeout(r, 50));
            dot.style.transition = `left ${speed}ms linear`;
            dot.style.left = "calc(100% - 10px)";
            await new Promise(r => setTimeout(r, speed + 50));
            dot.style.display = "none";
        }

        btnStartEmailSend.addEventListener("click", async () => {
            btnStartEmailSend.disabled = true;
            btnResetEmailFlow.disabled = true;
            clearFlowAnimation();

            const envFrom = emailEnvFrom.value.trim();
            const headerFrom = emailHeaderFrom.value.trim();
            const recipient = emailTo.value.trim();
            const subject = emailSubject.value.trim();
            const body = emailBody.value.trim();

            const envFromDom = envFrom.split("@")[1] || "trusted-bank.com";

            emailProtocolLog.innerHTML = "";
            emailHeaderViewer.innerText = "生成・受信処理を待機中...";
            renderedHeadersDkimOn = "";
            renderedHeadersDkimOff = "";

            // Helper to log protocols
            const logProto = (dir, text, delay = 200) => {
                const color = dir === "C" ? "#60a5fa" : dir === "S" ? "#34d399" : "#a78bfa";
                const prefix = dir === "C" ? "C: " : dir === "S" ? "S: " : ">> ";
                emailProtocolLog.innerHTML += `<div style="color: ${color}; margin-bottom: 3px;">${prefix}${text}</div>`;
                emailProtocolLog.parentElement.scrollTop = emailProtocolLog.parentElement.scrollHeight;
                return new Promise(r => setTimeout(r, delay));
            };

            // 1. Hop 1: Sender PC -> Sender MTA (SMTP Session)
            emailFlowStatusText.innerText = "1. クライアントPCから送信メールサーバへSMTP接続中...";
            nodeSenderPC.style.transform = "scale(1.25)";
            await logProto("INFO", "Sender PC (IP: 192.168.1.100) -> Sender MTA (trusted-bank.com) TCP接続確立");
            await animateDot(dotFlow1);
            nodeSenderPC.style.transform = "none";
            nodeMta1.style.transform = "scale(1.25)";

            await logProto("S", "220 mail.trusted-bank.com ESMTP Postfix");
            await logProto("C", "EHLO client.trusted-bank.com");
            await logProto("S", "250-mail.trusted-bank.com Hello client.trusted-bank.com\r\n250-SIZE 31457280\r\n250-STARTTLS\r\n250 DSN");

            await logProto("INFO", "STARTTLS コマンドによる暗号化接続を開始します");
            await logProto("C", "STARTTLS");
            await logProto("S", "220 2.0.0 Ready to start TLS");
            await logProto("INFO", "TLSハンドシェイク完了 (SMTP over TLS による暗号化セッション開始)");

            await logProto("C", "EHLO client.trusted-bank.com");
            await logProto("S", "250-mail.trusted-bank.com Hello client.trusted-bank.com\r\n250 SIZE 31457280");

            // SMTP-AUTH (SMTP Authentication) Simulation
            await logProto("INFO", "SMTP-AUTH 認証を開始します (送信アカウントの正当性を認証)");
            await logProto("C", "AUTH PLAIN dXNlcgBwYXNzd29yZA==");
            await logProto("S", "235 2.7.0 Authentication successful");

            // Note MAIL FROM uses Envelope-From
            await logProto("C", `MAIL FROM: <${envFrom}>`);
            await logProto("S", "250 2.1.0 Ok");
            await logProto("C", `RCPT TO: <${recipient}>`);
            await logProto("S", "250 2.1.5 Ok");
            await logProto("C", "DATA");
            await logProto("S", "354 End data with <CR><LF>.<CR><LF>");

            // SMTP Data stream: displays Header From
            await logProto("C", `From: ${headerFrom}\r\nTo: ${recipient}\r\nSubject: ${subject}\r\n\r\n${body}`);
            await logProto("C", ".");
            await logProto("S", "250 2.0.0 Ok: queued as 4VbXF982Az1");
            await logProto("C", "QUIT");
            await logProto("S", "221 2.0.0 Bye");
            await logProto("INFO", "送信メールサーバ (MTA) にメールがキューイングされました");

            nodeMta1.style.transform = "none";
            await new Promise(r => setTimeout(r, 500));

            // 2. Hop 2: Sender MTA -> Recipient MTA (MTA Forwarding SMTP)
            emailFlowStatusText.innerText = "2. 送信サーバから受信サーバへDNS(MX)を検索しSMTP中継中...";
            nodeMta1.style.transform = "scale(1.25)";
            await logProto("INFO", `MTA-MTA中継: ${envFromDom} ➔ my-isp.ne.jp (MXレコード検索完了)`);
            await animateDot(dotFlow2);
            nodeMta1.style.transform = "none";
            nodeMta2.style.transform = "scale(1.25)";

            await logProto("S", "220 mx.my-isp.ne.jp ESMTP Postfix", 100);
            await logProto("C", `EHLO mail.${envFromDom}`, 100);
            await logProto("S", `250-mx.my-isp.ne.jp Hello mail.${envFromDom}\r\n250 STARTTLS`, 100);
            await logProto("C", `MAIL FROM: <${envFrom}>`, 100);
            await logProto("S", "250 2.1.0 Ok", 100);
            await logProto("C", `RCPT TO: <${recipient}>`, 100);
            await logProto("S", "250 2.1.5 Ok", 100);
            await logProto("C", "DATA", 100);
            await logProto("S", "354 End data with <CR><LF>.<CR><LF>", 100);

            // Constructing Header preview for BOTH DKIM ON and OFF
            const msgId = "msg-" + Math.floor(Math.random() * 900000 + 100000) + "@" + envFromDom;
            const dateStr = new Date().toUTCString();

            // Received header appended by Recipient MTA
            let baseReceived = `Received: from mail.${envFromDom} (mail.${envFromDom} [192.0.2.10])\n`;
            baseReceived += `          by mx.my-isp.ne.jp (Postfix) with ESMTPS id 8D5F6B92C1\n`;
            baseReceived += `          for <${recipient}>; ${dateStr}\n`;

            // 1) Header ON (with DKIM Signature)
            let headerOnText = baseReceived;
            headerOnText += `DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\n`;
            headerOnText += `          d=${envFromDom}; s=selector1;\n`;
            headerOnText += `          h=from:to:subject:message-id;\n`;
            headerOnText += `          bh=jSG26aQ28Lz1zPZ4X3B1F8K2H=;\n`;
            headerOnText += `          b=A4e9XmZ9R2A1d5F3Kb7A1C8E9D0F8G9A1B2C3d4E5F6g7H8i9J0k1L2m3N4o5P...\n`;

            // 2) Header OFF (without DKIM Signature)
            let headerOffText = baseReceived;

            // Common headers
            const commonHeaders = `From: ${headerFrom}\n` +
                `To: ${recipient}\n` +
                `Subject: ${subject}\n` +
                `Message-ID: <${msgId}>\n` +
                `Date: ${dateStr}\n` +
                `MIME-Version: 1.0\n` +
                `Content-Type: text/plain; charset="UTF-8"\n\n` +
                `${body}`;

            headerOnText += commonHeaders;
            headerOffText += commonHeaders;

            await logProto("C", "[DATA Stream Transmission]", 100);
            await logProto("C", ".");
            await logProto("S", "250 2.0.0 Ok: queued as 9C8F7A1E6D", 100);
            await logProto("C", "QUIT", 100);
            await logProto("S", "221 2.0.0 Bye", 100);
            await logProto("INFO", "受信サーバ (MTA) にメールが正常格納されました。");

            nodeMta2.style.transform = "none";
            await new Promise(r => setTimeout(r, 500));

            // 3. Hop 3: Recipient MTA -> Recipient PC (POP3 / IMAP download)
            emailFlowStatusText.innerText = "3. 受信者がPOP3プロトコルでメールをダウンロード中...";
            nodeMta2.style.transform = "scale(1.25)";
            await logProto("INFO", "受信クライアントPCがメールサーバのPOP3S (ポート995) へ接続開始");
            await animateDot(dotFlow3);
            nodeMta2.style.transform = "none";
            nodeRecvPC.style.transform = "scale(1.25)";

            await logProto("S", "+OK my-isp.ne.jp POP3 Server ready", 100);
            await logProto("C", `USER ${recipient.split("@")[0]}`, 100);
            await logProto("S", "+OK send password", 100);
            await logProto("C", "PASS ********", 100);
            await logProto("S", "+OK maildrop ready (1 message, 2048 octets)", 100);
            await logProto("C", "STAT", 100);
            await logProto("S", "+OK 1 2048", 100);
            await logProto("C", "RETR 1", 100);
            await logProto("S", `+OK 2048 octets\n[Raw Mail Header & Body stream]`, 100);
            await logProto("C", "DELE 1", 100);
            await logProto("S", "+OK message 1 marked for deletion", 100);
            await logProto("C", "QUIT", 100);
            await logProto("S", "+OK POP3 server signing off", 100);
            await logProto("INFO", "メールの受信・ダウンロードが成功しました！");

            nodeRecvPC.style.transform = "none";
            emailFlowStatusText.innerText = "🎉 メール配送プロセス完了";

            // Colorize helper with clear contrast
            const colorize = (text) => {
                return text
                    .replace(/(Received:)/g, '<span style="color: #c084fc; font-weight: 700;">$1</span>')
                    .replace(/(DKIM-Signature:)/g, '<span style="color: #38bdf8; font-weight: 700;">$1</span>')
                    .replace(/(From:)/g, '<span style="color: #34d399; font-weight: 700;">$1</span>')
                    .replace(/(To:)/g, '<span style="color: #f472b6; font-weight: 700;">$1</span>')
                    .replace(/(Subject:)/g, '<span style="color: #f59e0b; font-weight: 700;">$1</span>')
                    .replace(/(Message-ID:)/g, '<span style="color: #22d3ee; font-weight: 700;">$1</span>');
            };

            renderedHeadersDkimOn = colorize(headerOnText);
            renderedHeadersDkimOff = colorize(headerOffText);

            updateHeaderView();

            btnStartEmailSend.disabled = false;
            btnResetEmailFlow.disabled = false;
            app.log("success", "[メールセキュリティ] メール送受信シミュレーションが完了しました。右側のトグルでDKIM署名の有無を比較できます。");
        });

        // Reset button for flow
        btnResetEmailFlow.addEventListener("click", () => {
            clearFlowAnimation();
            emailFlowStatusText.innerText = "待機中（「メール送信実行」を押してください）";
            emailProtocolLog.innerHTML = "「メール送信実行」ボタンを押すと、SMTP/POP3の全中継セッションログがここに展開されます。";
            renderedHeadersDkimOn = "";
            renderedHeadersDkimOff = "";
            updateHeaderView();
            app.log("system", "[メールセキュリティ] 送受信フロー状態を初期化しました。");
        });


        // ----------------------------------------------------
        // TAB 2: Domain Authentication Logic
        // ----------------------------------------------------
        const authMailPreset = document.getElementById("authMailPreset");
        const authSenderIp = document.getElementById("authSenderIp");
        const authEnvFromDom = document.getElementById("authEnvFromDom");
        const authHeaderFromDom = document.getElementById("authHeaderFromDom");
        const authMailHasDkim = document.getElementById("authMailHasDkim");
        const btnStartAuthVerify = document.getElementById("btnStartAuthVerify");

        const blockVerifySPF = document.getElementById("blockVerifySPF");
        const blockVerifyDKIM = document.getElementById("blockVerifyDKIM");
        const blockAlignSPF = document.getElementById("blockAlignSPF");
        const blockAlignDKIM = document.getElementById("blockAlignDKIM");
        const blockDmarcPolicy = document.getElementById("blockDmarcPolicy");

        const badgeSpfResult = document.getElementById("badgeSpfResult");
        const badgeDkimResult = document.getElementById("badgeDkimResult");
        const badgeSpfAlignResult = document.getElementById("badgeSpfAlignResult");
        const badgeDkimAlignResult = document.getElementById("badgeDkimAlignResult");
        const badgeDmarcResult = document.getElementById("badgeDmarcResult");

        const textSpfVerifyStatus = document.getElementById("textSpfVerifyStatus");
        const textDkimVerifyStatus = document.getElementById("textDkimVerifyStatus");
        const textSpfAlignStatus = document.getElementById("textSpfAlignStatus");
        const textDkimAlignStatus = document.getElementById("textDkimAlignStatus");
        const textDmarcPolicyStatus = document.getElementById("textDmarcPolicyStatus");
        const textDmarcFinalAction = document.getElementById("textDmarcFinalAction");
        const dmarcActionBox = document.getElementById("dmarcActionBox");
        const authDetailContent = document.getElementById("authDetailContent");

        // Preset dropdown change event
        authMailPreset.addEventListener("change", () => {
            const val = authMailPreset.value;
            resetAuthUI();

            if (val === "legit") {
                authSenderIp.value = "192.0.2.10";
                authEnvFromDom.value = "trusted-bank.com";
                authHeaderFromDom.value = "trusted-bank.com";
                authMailHasDkim.checked = true;
            } else if (val === "spoof_spf_fail") {
                // Sent by attacker IP, but uses correct Env-From & Header-From (typical spoofing attempt)
                authSenderIp.value = "198.51.100.5";
                authEnvFromDom.value = "trusted-bank.com";
                authHeaderFromDom.value = "trusted-bank.com";
                authMailHasDkim.checked = false;
            } else if (val === "spoof_spf_align_fail") {
                // Sent by legit IP of an attacker domain, Env-From is attacker's domain (passes SPF!)
                // but Header From is spoofed to bank. (SPF passes, but SPF Alignment fails)
                authSenderIp.value = "198.51.100.5";
                authEnvFromDom.value = "malicious.domain";
                authHeaderFromDom.value = "trusted-bank.com";
                authMailHasDkim.checked = false;
            } else if (val === "spoof_dkim_fail") {
                // Sent by legit IP, passes SPF, but DKIM signature is corrupted or failed validation
                authSenderIp.value = "192.0.2.10";
                authEnvFromDom.value = "trusted-bank.com";
                authHeaderFromDom.value = "trusted-bank.com";
                authMailHasDkim.checked = true; // signature exists but validation fails
            } else if (val === "spoof_dmarc_fail") {
                // Fully malicious email from bad IP, Env-From attacker, Header From bank, no signature.
                authSenderIp.value = "198.51.100.5";
                authEnvFromDom.value = "malicious.domain";
                authHeaderFromDom.value = "trusted-bank.com";
                authMailHasDkim.checked = false;
            }
        });

        function resetAuthUI() {
            // Remove highlighting styles
            [blockVerifySPF, blockVerifyDKIM, blockAlignSPF, blockAlignDKIM, blockDmarcPolicy].forEach(el => {
                el.style.backgroundColor = "var(--bg-card)";
                el.style.borderColor = "var(--border-color)";
                el.style.boxShadow = "none";
            });

            // Hide badges
            [badgeSpfResult, badgeDkimResult, badgeSpfAlignResult, badgeDkimAlignResult, badgeDmarcResult].forEach(b => {
                b.style.display = "none";
                b.className = "badge";
            });

            // Reset text
            textSpfVerifyStatus.innerHTML = "検証開始待ち...";
            textDkimVerifyStatus.innerHTML = "検証開始待ち...";
            textSpfAlignStatus.innerHTML = "検証開始待ち...";
            textDkimAlignStatus.innerHTML = "検証開始待ち...";
            textDmarcPolicyStatus.innerHTML = "検証開始待ち...";
            textDmarcFinalAction.innerText = "検証前";
            textDmarcFinalAction.style.color = "var(--text-primary)";
            dmarcActionBox.style.borderColor = "var(--border-color)";
        }

        // Domain authentication verify button handler
        btnStartAuthVerify.addEventListener("click", async () => {
            btnStartAuthVerify.disabled = true;
            resetAuthUI();

            const preset = authMailPreset.value;
            const ip = authSenderIp.value.trim();
            const envDom = authEnvFromDom.value.trim();
            const headerDom = authHeaderFromDom.value.trim();
            const hasDkim = authMailHasDkim.checked;

            let spfPass = false;
            let dkimPass = false;
            let spfAlign = false;
            let dkimAlign = false;
            let dmarcPass = false;
            let finalAction = "none"; // none (accept), quarantine, reject

            // --- STEP 1: SPF Verification ---
            blockVerifySPF.style.borderColor = "var(--color-primary)";
            blockVerifySPF.style.backgroundColor = "var(--bg-subtle-primary)";
            blockVerifySPF.style.boxShadow = "0 0 12px rgba(99,102,241,0.2)";
            textSpfVerifyStatus.innerHTML = `⚙️ <code>${envDom}</code> の DNS TXTレコードを照合中...<br>`;
            await new Promise(r => setTimeout(r, 600));

            if (envDom === "trusted-bank.com") {
                textSpfVerifyStatus.innerHTML += `・SPFレコード: <code>v=spf1 ip4:192.0.2.0/24 -all</code><br>`;
                if (ip.startsWith("192.0.2.")) {
                    spfPass = true;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong style="color: #34d399;">PASS</strong> (送信元IP ${ip} は許可リスト内)`;
                } else {
                    spfPass = false;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong style="color: #f87171;">FAIL</strong> (送信元IP ${ip} は許可リスト外)`;
                }
            } else if (envDom === "malicious.domain") {
                textSpfVerifyStatus.innerHTML += `・SPFレコード: <code>v=spf1 ip4:198.51.100.0/24 -all</code><br>`;
                if (ip.startsWith("198.51.100.")) {
                    spfPass = true;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong style="color: #34d399;">PASS</strong> (送信IP ${ip} は攻撃者ドメインの許可リスト内)`;
                } else {
                    spfPass = false;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong style="color: #f87171;">FAIL</strong> (送信IP ${ip} は攻撃者ドメインの許可リスト外)`;
                }
            }

            badgeSpfResult.style.display = "inline-block";
            badgeSpfResult.innerText = spfPass ? "PASS" : "FAIL";
            badgeSpfResult.className = spfPass ? "badge badge-success" : "badge badge-danger";
            blockVerifySPF.style.borderColor = spfPass ? "#10b981" : "#ef4444";

            // --- STEP 2: DKIM Verification ---
            blockVerifyDKIM.style.borderColor = "var(--color-primary)";
            blockVerifyDKIM.style.backgroundColor = "var(--bg-subtle-primary)";
            blockVerifyDKIM.style.boxShadow = "0 0 12px rgba(99,102,241,0.2)";
            textDkimVerifyStatus.innerHTML = `⚙️ DKIM署名をチェック中...<br>`;
            await new Promise(r => setTimeout(r, 600));

            if (!hasDkim) {
                dkimPass = false;
                textDkimVerifyStatus.innerHTML += `・結果: <strong style="color: #f87171;">NONE / FAIL</strong> (DKIM-Signature ヘッダーが存在しません)`;
            } else {
                if (preset === "legit") {
                    dkimPass = true;
                    textDkimVerifyStatus.innerHTML += `・DNSから <code>selector1._domainkey.trusted-bank.com</code> の公開鍵を取得。<br>・結果: <strong style="color: #34d399;">PASS</strong> (署名の検証に成功)`;
                } else if (preset === "spoof_dkim_fail") {
                    dkimPass = false;
                    textDkimVerifyStatus.innerHTML += `・DNSから <code>selector1._domainkey.trusted-bank.com</code> の公開鍵を取得。<br>・結果: <strong style="color: #f87171;">FAIL</strong> (本文/ヘッダハッシュの不一致。改ざん検知)`;
                }
            }

            badgeDkimResult.style.display = "inline-block";
            badgeDkimResult.innerText = dkimPass ? "PASS" : "FAIL";
            badgeDkimResult.className = dkimPass ? "badge badge-success" : "badge badge-danger";
            blockVerifyDKIM.style.borderColor = dkimPass ? "#10b981" : "#ef4444";

            // --- STEP 3: SPF Alignment ---
            blockAlignSPF.style.borderColor = "var(--color-primary)";
            blockAlignSPF.style.backgroundColor = "var(--bg-subtle-primary)";
            blockAlignSPF.style.boxShadow = "0 0 12px rgba(99,102,241,0.2)";
            textSpfAlignStatus.innerHTML = `⚙️ SPFアライメント照合中...<br>`;
            await new Promise(r => setTimeout(r, 500));

            if (headerDom === envDom) {
                spfAlign = true;
                textSpfAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・Envelope-From: <code>${envDom}</code><br>・結果: <strong style="color: #34d399;">MATCH (一致合格)</strong>`;
            } else {
                spfAlign = false;
                textSpfAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・Envelope-From: <code>${envDom}</code><br>・結果: <strong style="color: #f87171;">MISMATCH (不一致不合格)</strong>`;
            }

            badgeSpfAlignResult.style.display = "inline-block";
            badgeSpfAlignResult.innerText = spfAlign ? "PASS" : "FAIL";
            badgeSpfAlignResult.className = spfAlign ? "badge badge-success" : "badge badge-danger";
            blockAlignSPF.style.borderColor = spfAlign ? "#10b981" : "#ef4444";

            // --- STEP 4: DKIM Alignment ---
            blockAlignDKIM.style.borderColor = "var(--color-primary)";
            blockAlignDKIM.style.backgroundColor = "var(--bg-subtle-primary)";
            blockAlignDKIM.style.boxShadow = "0 0 12px rgba(99,102,241,0.2)";
            textDkimAlignStatus.innerHTML = `⚙️ DKIMアライメント照合中...<br>`;
            await new Promise(r => setTimeout(r, 500));

            if (!hasDkim) {
                dkimAlign = false;
                textDkimAlignStatus.innerHTML += `・結果: <strong style="color: #f87171;">FAIL</strong> (有効なDKIM署名が存在しないためアライメント不可)`;
            } else {
                if (preset === "legit" || preset === "spoof_dkim_fail") {
                    const dkimDom = "trusted-bank.com";
                    if (headerDom === dkimDom) {
                        dkimAlign = true;
                        textDkimAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・DKIM署名ドメイン (d=): <code>${dkimDom}</code><br>・結果: <strong style="color: #34d399;">MATCH (一致合格)</strong>`;
                    } else {
                        dkimAlign = false;
                        textDkimAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・DKIM署名ドメイン (d=): <code>${dkimDom}</code><br>・結果: <strong style="color: #f87171;">MISMATCH (不一致不合格)</strong>`;
                    }
                }
            }

            badgeDkimAlignResult.style.display = "inline-block";
            badgeDkimAlignResult.innerText = dkimAlign ? "PASS" : "FAIL";
            badgeDkimAlignResult.className = dkimAlign ? "badge badge-success" : "badge badge-danger";
            blockAlignDKIM.style.borderColor = dkimAlign ? "#10b981" : "#ef4444";

            // --- STEP 5: DMARC Policy integration ---
            blockDmarcPolicy.style.borderColor = "var(--color-primary)";
            blockDmarcPolicy.style.backgroundColor = "var(--bg-subtle-primary)";
            blockDmarcPolicy.style.boxShadow = "0 0 12px rgba(99,102,241,0.2)";
            textDmarcPolicyStatus.innerHTML = `⚙️ DMARCアライメント判定を総合評価中...<br>`;
            await new Promise(r => setTimeout(r, 800));

            const dmarcSpfPass = spfPass && spfAlign;
            const dmarcDkimPass = dkimPass && dkimAlign;

            if (dmarcSpfPass || dmarcDkimPass) {
                dmarcPass = true;
                textDmarcPolicyStatus.innerHTML += `・DMARC総合判定: <strong class="text-base" style="color: #34d399;">PASS (合格)</strong><br>`;
                if (dmarcSpfPass && dmarcDkimPass) {
                    textDmarcPolicyStatus.innerHTML += `・理由: SPFおよびDKIMの双方でアライメント適合した認証に成功しました。`;
                } else if (dmarcSpfPass) {
                    textDmarcPolicyStatus.innerHTML += `・理由: DKIMは不合格ですが、アライメント適合したSPFがPASSしたためDMARCを通過します。`;
                } else {
                    textDmarcPolicyStatus.innerHTML += `・理由: SPFは不合格ですが、アライメント適合したDKIM署名がPASSしたためDMARCを通過します。`;
                }
                finalAction = "none";
            } else {
                dmarcPass = false;
                textDmarcPolicyStatus.innerHTML += `・DMARC総合判定: <strong class="text-base" style="color: #f87171;">FAIL (不合格)</strong><br>`;
                textDmarcPolicyStatus.innerHTML += `・理由: SPF / DKIMのいずれもアライメント適合した認証を通過しませんでした。<br>`;

                textDmarcPolicyStatus.innerHTML += `⚙️ 差出人ドメイン <code>${headerDom}</code> の DMARC レコードを確認中...<br>`;
                await new Promise(r => setTimeout(r, 500));

                if (headerDom === "trusted-bank.com") {
                    textDmarcPolicyStatus.innerHTML += `・DMARCレコード: <code>p=reject</code> (厳格拒否ポリシー)<br>`;
                    finalAction = "reject";
                    textDmarcPolicyStatus.innerHTML += `・決定: 送信元ポリシーに従い、メールを <strong>受信拒否 (SMTP 554 エラー応答)</strong> します。`;
                } else {
                    textDmarcPolicyStatus.innerHTML += `・DMARCレコード: <code>p=none</code> (モニタリング指定)<br>`;
                    finalAction = "none";
                    textDmarcPolicyStatus.innerHTML += `・決定: DMARCは失敗ですがポリシーが p=none のため、<strong>受信箱へ配送</strong>します。`;
                }
            }

            badgeDmarcResult.style.display = "inline-block";
            badgeDmarcResult.innerText = dmarcPass ? "PASS" : "FAIL";
            badgeDmarcResult.className = dmarcPass ? "badge badge-success" : "badge badge-danger";
            blockDmarcPolicy.style.borderColor = dmarcPass ? "#10b981" : "#ef4444";

            // Final Action Display Box update
            if (finalAction === "none") {
                textDmarcFinalAction.innerText = "通常配送 (受信箱)";
                textDmarcFinalAction.style.color = "#34d399";
                dmarcActionBox.style.borderColor = "#10b981";
            } else if (finalAction === "quarantine") {
                textDmarcFinalAction.innerText = "隔離 (迷惑フォルダ)";
                textDmarcFinalAction.style.color = "#fbbf24";
                dmarcActionBox.style.borderColor = "#fbbf24";
            } else if (finalAction === "reject") {
                textDmarcFinalAction.innerText = "受信拒否 (Reject)";
                textDmarcFinalAction.style.color = "#f87171";
                dmarcActionBox.style.borderColor = "#ef4444";
            }

            // Explanatory detail box dynamically updated based on the scenario
            updateDetailContent(preset, spfPass, dkimPass, spfAlign, dkimAlign, dmarcPass, finalAction);

            btnStartAuthVerify.disabled = false;
            if (dmarcPass) {
                app.log("success", `[ドメイン認証] メールがDMARCをパスしました。配送アクション: ${textDmarcFinalAction.innerText}`);
            } else {
                app.log("error", `[ドメイン認証] メールがDMARCで失敗しました。ポリシー処理: ${textDmarcFinalAction.innerText}`);
            }
        });

        // Generate tailored explanations for educational support
        function updateDetailContent(preset, spf, dkim, spfAlign, dkimAlign, dmarc, action) {
            let html = `<span class="text-md" style="font-weight: 700; color: #a5b4fc; border-bottom: 1px solid rgba(99,102,241,0.25); padding-bottom: 6px; display: block; margin-bottom: 10px;">💡 検証結果の解説: ${authMailPreset.options[authMailPreset.selectedIndex].text}</span>`;

            if (preset === "legit") {
                html += `
                    正当な銀行サーバーからの正規メールです。<br><br>
                    1. 送信元IP <code>192.0.2.10</code> が <code>trusted-bank.com</code> の SPF レコード内にあるため <strong>SPF PASS</strong> となります。<br>
                    2. 正規の秘密鍵で生成された署名をDNSの公開鍵で検証できたため <strong>DKIM PASS</strong> となります。<br>
                    3. Header From と Envelope-From / DKIM署名ドメインがすべて一致しているため <strong>アライメント合格</strong> となります。<br><br>
                    総合判定は <strong>DMARC PASS</strong> であり、メールは無事に受信者の受信箱へ安全に届けられます。
                `;
            } else if (preset === "spoof_spf_fail") {
                html += `
                    攻撃者のサーバー（IP: <code>198.51.100.5</code>）から、差出人を銀行（<code>trusted-bank.com</code>）と偽って直接送信された典型的な「なりすましメール」です。<br><br>
                    ・受信サーバは <code>trusted-bank.com</code> の SPF レコードを参照しますが、攻撃者IPが存在しないため <strong>SPF FAIL</strong> となります。DKIM署名も存在しません。<br>
                    ・結果として DMARC 判定は <strong>FAIL</strong> となり、銀行が宣言している DMARC ポリシー <code>p=reject</code> に基づき、受信サーバはメールを <strong>受信拒否（遮断）</strong> します。
                `;
            } else if (preset === "spoof_spf_align_fail") {
                html += `
                    <strong>セキスペ試験で最も出題されるケースです！</strong><br>
                    攻撃者が自身の所有するドメイン（<code>malicious.domain</code>）から送信し、メーラーの差出人表示 (Header From) だけを銀行（<code>trusted-bank.com</code>）と詐称した巧妙な攻撃です。<br><br>
                    ・<strong>SPF単体は PASS します</strong>（<code>malicious.domain</code> のSPFレコードに攻撃者のIPが登録されているため）。<br>
                    ・しかし、<strong>SPFアライメントが FAIL になります</strong>（Header From の <code>trusted-bank.com</code> と Envelope-From の <code>malicious.domain</code> が一致しないため）。<br><br>
                    DMARC はアライメント失敗を検知して「なりすまし」と判定し、<code>p=reject</code> ポリシーに従ってこのメールを <strong>受信拒否</strong> します。SPFだけでは防げない攻撃をDMARCが防ぐ典型例です。
                `;
            } else if (preset === "spoof_dkim_fail") {
                html += `
                    DKIM署名は付与されていますが、伝送途中で本文が改ざんされたか、署名鍵が無効になっている場合のシミュレーションです。<br><br>
                    ・DKIM署名の検証は <strong>FAIL</strong> となります。<br>
                    ・ただし、このメールは SPF 認証と SPF アライメント（Fromドメインの一致）をクリアしているため、<strong>DMARC全体としては合格 (PASS)</strong> と判定されます（DMARCはSPFとDKIMのいずれか一方がアライメント適合でPASSすれば合格となる仕組みです）。
                `;
            } else if (preset === "spoof_dmarc_fail") {
                html += `
                    攻撃者のサーバー（IP: <code>198.51.100.5</code>）から Envelope-From を <code>malicious.domain</code>、Header From を <code>trusted-bank.com</code> として送信された完全ななりすましメールです。<br><br>
                    ・SPF認証自体は攻撃者ドメインでパスしますが、ドメイン不一致により <strong>SPFアライメントは FAIL</strong> します。<br>
                    ・DKIM署名もないため、DMARC総合判定は <strong>FAIL</strong> となります。<br>
                    ・銀行側の <code>p=reject</code> ポリシーに従い、メールは即座に <strong>受信拒否（Reject）</strong> されます。
                `;
            }

            authDetailContent.innerHTML = html;
        }

        // Initialize preset state
        authMailPreset.dispatchEvent(new Event("change"));
    }
};
