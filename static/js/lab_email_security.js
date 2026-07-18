/**
 * Module 12: Email Security & Domain Authentication (SPF, DKIM, DMARC) Lab
 */
window.SecurityLabModules["email_security"] = {
    html: `
        <div class="lab-container">
            <!-- Navigation Tabs -->
            <div class="tab-container" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 24px;">
                <button class="btn btn-tab active" id="btnTabEmailFlow" style="font-size: 13px; padding: 8px 16px;">① メール送受信 ＆ ヘッダ構造</button>
                <button class="btn btn-tab" id="btnTabEmailAuth" style="font-size: 13px; padding: 8px 16px;">② 送信元ドメイン認証 (SPF/DKIM/DMARC)</button>
            </div>

            <!-- TAB 1: Email Flow & Headers -->
            <div id="panelEmailFlow" class="tab-panel active">
                <div class="card" style="margin-bottom: 24px;">
                    <h3>✉️ メール送受信フロー ＆ ヘッダ構造シミュレータ</h3>
                    <p class="card-subtitle">SMTP/POP3によるメール配送プロセスを体験し、ReceivedヘッダやEnvelope-From（MAIL FROM）とHeader From（From:）の違い、およびDKIM署名の有無による構造の差分を確認します。</p>

                    <div class="lab-grid-3" style="grid-template-columns: 1fr 1.2fr 1.1fr; gap: 20px; margin-top: 15px;">
                        <!-- Left: Mail Composition Form -->
                        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
                            <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">1. メール送信設定</span>
                            
                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">Envelope-From (MAIL FROM):</label>
                                <input type="text" id="emailEnvFrom" value="support@trusted-bank.com" style="width: 100%; font-size: 11px; padding: 4px 8px;" placeholder="SMTP通信で使用する送信ドメイン">
                                <span style="font-size: 9px; color: var(--text-secondary);">※ SMTPのMAIL FROM（本来の送信者）</span>
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">HeaderFrom :</label>
                                <input type="text" id="emailHeaderFrom" value="support@trusted-bank.com" style="width: 100%; font-size: 11px; padding: 4px 8px;" placeholder="メールヘッダに表示する送信者">
                                <span style="font-size: 9px; color: var(--text-secondary);">※ メーラーの「差出人」欄（なりすまし可能）</span>
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">To (宛先):</label>
                                <input type="text" id="emailTo" value="user@my-isp.ne.jp" style="width: 100%; font-size: 11px; padding: 4px 8px;">
                            </div>

                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 11px;">Subject (件名) &amp; Body (本文):</label>
                                <input type="text" id="emailSubject" value="【重要】ログイン情報の確認" style="width: 100%; font-size: 11px; padding: 4px 8px; margin-bottom: 4px;">
                                <textarea id="emailBody" style="width: 100%; height: 60px; font-size: 11px; padding: 4px 8px; font-family: var(--font-sans);" placeholder="本文を入力...">セキュリティ設定を更新してください。</textarea>
                            </div>

                            <div style="margin-top: 10px; display: flex; gap: 8px;">
                                <button class="btn btn-primary" id="btnStartEmailSend" style="flex: 1; font-size: 11px; padding: 6px;">メール送信実行</button>
                                <button class="btn btn-lime-outline" id="btnResetEmailFlow" style="font-size: 11px; padding: 6px;">リセット</button>
                            </div>
                        </div>

                        <!-- Middle: Send Sequence Animation & SMTP Log -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div>
                                <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; margin-bottom: 6px;">2. 配送経路ステータス</span>
                                <div class="email-flow-visual" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 14px 10px; border-radius: var(--radius-md); position: relative;">
                                    <div style="text-align: center; z-index: 2;">
                                        <span style="font-size: 18px;" id="nodeSenderPC">💻</span>
                                        <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">送信PC</div>
                                    </div>
                                    <div class="flow-arrow" id="arrowSendToMta1" style="flex: 1; border-top: 2px dashed #4b5563; height: 1px; margin: 0 4px; position: relative;">
                                        <div class="flow-dot" id="dotFlow1" style="display: none; position: absolute; top: -5px; left: 0; width: 8px; height: 8px; background-color: var(--color-primary); border-radius: 50%;"></div>
                                    </div>
                                    <div style="text-align: center; z-index: 2;">
                                        <span style="font-size: 18px;" id="nodeMta1">📤</span>
                                        <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">送信サーバ<br>(MTA)</div>
                                    </div>
                                    <div class="flow-arrow" id="arrowMta1ToMta2" style="flex: 1; border-top: 2px dashed #4b5563; height: 1px; margin: 0 4px; position: relative;">
                                        <div class="flow-dot" id="dotFlow2" style="display: none; position: absolute; top: -5px; left: 0; width: 8px; height: 8px; background-color: var(--color-primary); border-radius: 50%;"></div>
                                    </div>
                                    <div style="text-align: center; z-index: 2;">
                                        <span style="font-size: 18px;" id="nodeMta2">📥</span>
                                        <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">受信サーバ<br>(MTA)</div>
                                    </div>
                                    <div class="flow-arrow" id="arrowMta2ToRecvPC" style="flex: 1; border-top: 2px dashed #4b5563; height: 1px; margin: 0 4px; position: relative;">
                                        <div class="flow-dot" id="dotFlow3" style="display: none; position: absolute; top: -5px; left: 0; width: 8px; height: 8px; background-color: var(--color-primary); border-radius: 50%;"></div>
                                    </div>
                                    <div style="text-align: center; z-index: 2;">
                                        <span style="font-size: 18px;" id="nodeRecvPC">💻</span>
                                        <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">受信PC</div>
                                    </div>
                                </div>
                                <div style="text-align: center; font-size: 9px; color: var(--text-secondary); margin-top: 4px;" id="emailFlowStatusText">待機中</div>
                            </div>

                            <div style="flex: 1; display: flex; flex-direction: column; min-height: 200px;">
                                <label style="font-size: 11px;">SMTP / POP3 セッション・プロトコルログ:</label>
                                <div class="response-box" style="flex: 1; overflow-y: auto; background-color: #0c0a09; border-color: rgba(99,102,241,0.3); padding: 10px; font-family: var(--font-mono); font-size: 10px; line-height: 1.4; color: #fbbf24;">
                                    <div id="emailProtocolLog">送信を実行すると、SMTPセッションのコマンドとレスポンスの履歴がここに展開されます。</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Raw E-mail Headers display with toggle -->
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                                <span style="font-weight: bold; color: var(--text-primary); font-size: 11px;">3. 受信メールヘッダ (Raw Data)</span>
                                <div style="display: flex; gap: 4px;" id="headerDkimToggles">
                                    <button class="btn btn-tab-mini active" id="btnToggleDkimOn" style="font-size: 9px; padding: 2px 6px; border: 1px solid var(--border-color); background: var(--bg-card); cursor: pointer;">DKIMあり</button>
                                    <button class="btn btn-tab-mini" id="btnToggleDkimOff" style="font-size: 9px; padding: 2px 6px; border: 1px solid var(--border-color); background: var(--bg-card); cursor: pointer;">DKIMなし</button>
                                </div>
                            </div>
                            <div style="flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; font-family: var(--font-mono); font-size: 10px; line-height: 1.4; overflow-y: auto; max-height: 380px; min-height: 300px; color: #e4e4e7; white-space: pre-wrap;" id="emailHeaderViewer">※ メールを受信すると、ここに構築されたメールヘッダが表示されます。右上の「DKIMあり / なし」のトグルを切り替えることで、署名ヘッダの差分が瞬時に確認できます。</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Domain Authentication (SPF / DKIM / DMARC) -->
            <div id="panelEmailAuth" class="tab-panel" style="display: none;">
                <div class="card" style="margin-bottom: 24px;">
                    <h3>🛡️ 送信元ドメイン認証 (SPF, DKIM, DMARC) 検証</h3>
                    <p class="card-subtitle">接続元メールサーバのIPアドレスや模擬DNSレコードをもとに、受信サーバ（受信MTA）がどのように送信元詐称を検知するか、その判定・アライメント処理のフローを学びます。</p>

                    <div class="lab-grid-3" style="grid-template-columns: 1.1fr 1.6fr 1.3fr; gap: 20px; margin-top: 15px;">
                        
                        <!-- Left: Simulation Environment & Configuration -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
                                <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">1. 検証条件の設定</span>
                                
                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 11px;">送信メールの設定:</label>
                                    <select id="authMailPreset" style="width: 100%; font-size: 11px; padding: 4px 8px; background-color: var(--bg-card); border-color: var(--border-color); color: var(--text-primary);">
                                        <option value="legit">【正当】銀行からの正規メール（SPF/DKIM/DMARC 一致）</option>
                                        <option value="spoof_spf_fail">【詐称】攻撃者IPからのなりすまし（SPF検証失敗）</option>
                                        <option value="spoof_spf_align_fail">【詐称】Mailing List経由などのなりすまし（SPFアライメント失敗）</option>
                                        <option value="spoof_dkim_fail">【詐称】署名の改ざん/無効（DKIM検証失敗）</option>
                                        <option value="spoof_dmarc_fail">【詐称】完全ななりすまし（SPF/DKIM/DMARC すべて失敗）</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 11px;">接続元送信IPアドレス:</label>
                                    <input type="text" id="authSenderIp" value="192.0.2.10" style="width: 100%; font-size: 11px; padding: 4px 8px;" readonly>
                                    <span style="font-size: 9px; color: var(--text-secondary);">※ メールを送ってきたサーバの物理IP</span>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 11px;">Envelope-From ドメイン:</label>
                                    <input type="text" id="authEnvFromDom" value="trusted-bank.com" style="width: 100%; font-size: 11px; padding: 4px 8px;" readonly>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 11px;">Header From ドメイン:</label>
                                    <input type="text" id="authHeaderFromDom" value="trusted-bank.com" style="width: 100%; font-size: 11px; padding: 4px 8px;" readonly>
                                </div>

                                <div class="form-group" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="authMailHasDkim" checked disabled>
                                    <label style="font-size: 11px; margin: 0;">DKIM署名が存在する</label>
                                </div>

                                <div style="margin-top: 6px;">
                                    <button class="btn btn-primary" id="btnStartAuthVerify" style="width: 100%; font-size: 11px; padding: 8px;">認証検証を実行する</button>
                                </div>
                            </div>

                            <!-- DNS Records Panel -->
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 8px;">
                                <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">模擬DNSレコード設定</span>
                                
                                <div style="font-size: 10px;">
                                    <div style="font-weight: bold; color: var(--color-primary-hover); margin-bottom: 2px;">trusted-bank.com のDNS:</div>
                                    <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); font-family: monospace; font-size: 9px; line-height: 1.3;">
                                        IN TXT "v=spf1 ip4:192.0.2.0/24 -all"<br>
                                        _dmarc IN TXT "v=DMARC1; p=reject; pct=100; aspf=r; adkim=r"<br>
                                        selector1._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGS..."
                                    </div>
                                </div>
                                <div style="font-size: 10px; margin-top: 4px;">
                                    <div style="font-weight: bold; color: #f87171; margin-bottom: 2px;">malicious.domain のDNS:</div>
                                    <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); font-family: monospace; font-size: 9px; line-height: 1.3;">
                                        IN TXT "v=spf1 ip4:198.51.100.0/24 -all"<br>
                                        _dmarc IN TXT "v=DMARC1; p=none"<br>
                                        selector1._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGS..."
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Middle: Domain Verification Flow Visualizer -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <span style="font-weight: bold; color: var(--text-primary); font-size: 12px; display: block;">2. 受信側メールサーバでのドメイン認証検証フロー</span>
                            
                            <div class="auth-flow-grid" style="display: grid; grid-template-rows: auto auto auto; gap: 14px;">
                                <!-- Row 1: SPF & DKIM parallel verification -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                    <!-- SPF Validation Block -->
                                    <div id="blockVerifySPF" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 6px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                                            <span style="font-weight: bold; font-size: 11px; color: var(--text-primary);">① SPF検証</span>
                                            <span id="badgeSpfResult" class="badge" style="font-size: 9px; padding: 2px 6px; background-color: var(--bg-card); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div style="font-size: 9px; color: var(--text-secondary); line-height: 1.3;" id="textSpfVerifyStatus">
                                            DNSから Envelope-From の SPF TXT レコードを照合し、接続元IPが許可されているかチェックします。
                                        </div>
                                    </div>

                                    <!-- DKIM Validation Block -->
                                    <div id="blockVerifyDKIM" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 6px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                                            <span style="font-weight: bold; font-size: 11px; color: var(--text-primary);">② DKIM検証</span>
                                            <span id="badgeDkimResult" class="badge" style="font-size: 9px; padding: 2px 6px; background-color: var(--bg-card); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div style="font-size: 9px; color: var(--text-secondary); line-height: 1.3;" id="textDkimVerifyStatus">
                                            DKIM-Signature ヘッダー内の送信元ドメインのDNSから公開鍵を取得し、署名を検証します。
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 2: DMARC Alignment checks -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                                    <!-- SPF Alignment Block -->
                                    <div id="blockAlignSPF" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 6px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                                            <span style="font-weight: bold; font-size: 11px; color: var(--text-primary);">③ SPFアライメント</span>
                                            <span id="badgeSpfAlignResult" class="badge" style="font-size: 9px; padding: 2px 6px; background-color: var(--bg-card); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div style="font-size: 9px; color: var(--text-secondary); line-height: 1.3;" id="textSpfAlignStatus">
                                            Header From と Envelope-From のドメインが一致しているか検証します。
                                        </div>
                                    </div>

                                    <!-- DKIM Alignment Block -->
                                    <div id="blockAlignDKIM" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 6px; transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                                            <span style="font-weight: bold; font-size: 11px; color: var(--text-primary);">④ DKIMアライメント</span>
                                            <span id="badgeDkimAlignResult" class="badge" style="font-size: 9px; padding: 2px 6px; background-color: var(--bg-card); border: 1px solid var(--border-color); display: none;">N/A</span>
                                        </div>
                                        <div style="font-size: 9px; color: var(--text-secondary); line-height: 1.3;" id="textDkimAlignStatus">
                                            Header From と DKIM署名ドメイン (d=) が一致しているか検証します。
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 3: DMARC Policy integration -->
                                <div id="blockDmarcPolicy" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 8px; transition: all 0.3s;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 14px;">🛡️</span>
                                            <span style="font-weight: bold; font-size: 12px; color: var(--text-primary);">⑤ DMARCポリシー判定 &amp; 配送処理</span>
                                        </div>
                                        <span id="badgeDmarcResult" class="badge" style="font-size: 10px; padding: 4px 10px; background-color: var(--bg-card); border: 1px solid var(--border-color); display: none;">N/A</span>
                                    </div>
                                    <div style="display: flex; gap: 14px; font-size: 9px; color: var(--text-secondary); line-height: 1.4;">
                                        <div style="flex: 1;" id="textDmarcPolicyStatus">
                                            SPFおよびDKIMの認証結果、アライメント結果を総合評価します。アライメントをパスしたSPF/DKIMのいずれかが成功していればDMARC合格(PASS)となります。失敗した場合は、送信元ドメインのDMARCポリシー設定に従って受信処理（none/quarantine/reject）を決定します。
                                        </div>
                                        <div style="width: 140px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px;" id="dmarcActionBox">
                                            <span style="font-size: 8px; color: var(--text-secondary);">最終受信アクション</span>
                                            <span style="font-size: 11px; font-weight: bold; color: var(--text-primary);" id="textDmarcFinalAction">検証前</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Detailed Explanations & Exam tips with SPF/DKIM Align and SMTP-AUTH -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="background: rgba(99,102,241,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);" id="authDetailBox">
                                <span style="font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; display: block; margin-bottom: 8px;">💡 ドメイン認証解説</span>
                                <div id="authDetailContent">
                                    検証プリセットを設定して「認証検証を実行する」ボタンを押すと、各ステップでの検証判定処理がビジュアル化されます。<br><br>
                                    <strong>SPF、DKIM、DMARCの関わりや、セキスペ試験に出題される『アライメント』の重要性</strong>について詳しく学びましょう。
                                </div>
                            </div>
                            
                            <div style="background: rgba(251,191,36,0.03); border: 1px solid rgba(251,191,36,0.2); border-radius: var(--radius-md); padding: 14px; font-size: 11px; line-height: 1.5; color: var(--text-secondary); max-height: 480px; overflow-y: auto;">
                                <span style="font-weight: bold; color: #fbbf24; border-bottom: 1px solid rgba(251,191,36,0.2); padding-bottom: 4px; display: block; margin-bottom: 8px;">🔑 セキスペ重要用語集 ＆ 勘所</span>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <div>
                                        <strong style="color: var(--text-primary); font-size: 11px; display: block; margin-bottom: 2px;">■ SPFレコード (Sender Policy Framework)</strong>
                                        送信ドメインのDNSに登録する、正当なメール送信サーバのIPアドレスリストです。<br>
                                        <code style="font-size: 9px; display: block; background: rgba(0,0,0,0.2); padding: 2px 4px; margin-top: 2px;">例: v=spf1 ip4:192.0.2.0/24 -all</code>
                                        末尾の修飾子には以下のような種類があります：
                                        <ul style="margin: 2px 0 0 12px; padding: 0;">
                                            <li><code>-all</code> (Fail): リスト外からの送信メールを厳格に不合格とし、受信拒否を推奨。</li>
                                            <li><code>~all</code> (SoftFail): リスト外からの送信を不合格としつつ、受信は許可（ポリシー適用はDMARC等に委ねる）。</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <strong style="color: var(--text-primary); font-size: 11px; display: block; margin-bottom: 2px;">■ SPFアライメント ＆ DKIMアライメント</strong>
                                        DMARC認証をクリアするためのドメイン一致チェックです。
                                        <ul style="margin: 2px 0 0 12px; padding: 0;">
                                            <li><strong>SPFアライメント</strong>: メールソフトの差出人欄に表示されるドメイン (Header From) と、MTAがSMTPセッションで使用するドメイン (Envelope-From) が一致しているか検査します。</li>
                                            <li><strong>DKIMアライメント</strong>: Header From のドメインと、DKIM署名ヘッダ内の署名ドメイン (<code>d=</code>) が一致しているか検査します。</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <strong style="color: var(--text-primary); font-size: 11px; display: block; margin-bottom: 2px;">■ SMTP-AUTH (SMTP認証)</strong>
                                        メール送信の際、メールクライアントがID・パスワードを用いて送信メールサーバ（MTA）に対してユーザ認証を行うセキュリティ技術です。認証に成功したユーザのみにメール送信を許可します。
                                    </div>

                                    <div style="border-top: 1px dashed rgba(251,191,36,0.2); padding-top: 6px;">
                                        <strong style="color: var(--text-primary); font-size: 11px; display: block; margin-bottom: 2px;">💡 ドメイン認証 と SMTP-AUTH の対比</strong>
                                        セキスペ試験では、両者の役割の違いがよく問われます。
                                        <ul style="margin: 2px 0 0 12px; padding: 0;">
                                            <li><strong>SMTP-AUTH</strong> ➔ <strong>送信側の保護</strong>。第三者による送信サーバの不正利用（迷惑メールの踏み台化）を防ぎます。</li>
                                            <li><strong>SPF / DKIM / DMARC</strong> ➔ <strong>受信側の保護</strong>。受信側サーバが、届いたメールが第三者によってなりすまされたもの（偽装メール）でないか検証・検知します。</li>
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

    init: function (app) {
        // Tab elements
        const btnTabEmailFlow = document.getElementById("btnTabEmailFlow");
        const btnTabEmailAuth = document.getElementById("btnTabEmailAuth");
        const panelEmailFlow = document.getElementById("panelEmailFlow");
        const panelEmailAuth = document.getElementById("panelEmailAuth");

        // Tab switching logic
        btnTabEmailFlow.addEventListener("click", () => {
            btnTabEmailFlow.classList.add("active");
            btnTabEmailAuth.classList.remove("active");
            panelEmailFlow.style.display = "block";
            panelEmailAuth.style.display = "none";
            app.log("system", "[メールセキュリティ] 送受信フロー画面に切り替えました。");
        });

        btnTabEmailAuth.addEventListener("click", () => {
            btnTabEmailFlow.classList.remove("active");
            btnTabEmailAuth.classList.add("active");
            panelEmailFlow.style.display = "none";
            panelEmailAuth.style.display = "block";
            app.log("system", "[メールセキュリティ] ドメイン認証検証画面に切り替えました。");
        });

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
            dot.style.left = "calc(100% - 8px)";
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

            const envFromDom = envFrom.split("@")[1] || "unknown.com";

            emailProtocolLog.innerHTML = "";
            emailHeaderViewer.innerText = "生成・受信処理を待機中...";
            renderedHeadersDkimOn = "";
            renderedHeadersDkimOff = "";

            // Helper to log protocols
            const logProto = (dir, text, delay = 200) => {
                const color = dir === "C" ? "#60a5fa" : dir === "S" ? "#34d399" : "#a78bfa";
                const prefix = dir === "C" ? "C: " : dir === "S" ? "S: " : ">> ";
                emailProtocolLog.innerHTML += `<div style="color: ${color}; margin-bottom: 2px;">${prefix}${text}</div>`;
                emailProtocolLog.parentElement.scrollTop = emailProtocolLog.parentElement.scrollHeight;
                return new Promise(r => setTimeout(r, delay));
            };

            // 1. Hop 1: Sender PC -> Sender MTA (SMTP Session)
            emailFlowStatusText.innerText = "1. クライアントPCから送信メールサーバへSMTP接続中...";
            nodeSenderPC.style.transform = "scale(1.2)";
            await logProto("INFO", "Sender PC (IP: 192.168.1.100) -> Sender MTA (trusted-bank.com) TCP接続確立");
            await animateDot(dotFlow1);
            nodeSenderPC.style.transform = "none";
            nodeMta1.style.transform = "scale(1.2)";

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
            await new Promise(r => setTimeout(r, 600));

            // 2. Hop 2: Sender MTA -> Recipient MTA (MTA Forwarding SMTP)
            emailFlowStatusText.innerText = "2. 送信サーバから受信サーバへDNS引いてSMTP中継中...";
            nodeMta1.style.transform = "scale(1.2)";
            await logProto("INFO", `MTA-MTA中継: ${envFromDom} ➔ my-isp.ne.jp (MXレコード検索中...)`);
            await animateDot(dotFlow2);
            nodeMta1.style.transform = "none";
            nodeMta2.style.transform = "scale(1.2)";

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
            await new Promise(r => setTimeout(r, 600));

            // 3. Hop 3: Recipient MTA -> Recipient PC (POP3 / IMAP download)
            emailFlowStatusText.innerText = "3. 受信者がPOP3プロトコルでメールをダウンロード中...";
            nodeMta2.style.transform = "scale(1.2)";
            await logProto("INFO", "受信クライアントPCがメールサーバのPOP3S (ポート995) へ接続開始");
            await animateDot(dotFlow3);
            nodeMta2.style.transform = "none";
            nodeRecvPC.style.transform = "scale(1.2)";

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
            emailFlowStatusText.innerText = "メール配信プロセス完了";

            // Colorize helper
            const colorize = (text) => {
                return text
                    .replace(/(Received:)/g, '<span style="color: #a78bfa; font-weight: bold;">$1</span>')
                    .replace(/(DKIM-Signature:)/g, '<span style="color: #60a5fa; font-weight: bold;">$1</span>')
                    .replace(/(From:)/g, '<span style="color: #34d399; font-weight: bold;">$1</span>')
                    .replace(/(To:)/g, '<span style="color: #f472b6; font-weight: bold;">$1</span>')
                    .replace(/(Subject:)/g, '<span style="color: #fbbf24; font-weight: bold;">$1</span>')
                    .replace(/(Message-ID:)/g, '<span style="color: #22d3ee; font-weight: bold;">$1</span>');
            };

            renderedHeadersDkimOn = colorize(headerOnText);
            renderedHeadersDkimOff = colorize(headerOffText);

            updateHeaderView();

            btnStartEmailSend.disabled = false;
            btnResetEmailFlow.disabled = false;
            app.log("success", "[メールセキュリティ] メール送受信シミュレーションが完了しました。右側のトグルでDKIMの差分を確認してください。");
        });

        // Reset button for flow
        btnResetEmailFlow.addEventListener("click", () => {
            clearFlowAnimation();
            emailFlowStatusText.innerText = "待機中";
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
                el.style.backgroundColor = "rgba(255,255,255,0.01)";
                el.style.borderColor = "var(--border-color)";
            });

            // Hide badges
            [badgeSpfResult, badgeDkimResult, badgeSpfAlignResult, badgeDkimAlignResult, badgeDmarcResult].forEach(b => {
                b.style.display = "none";
                b.className = "badge";
            });

            // Reset text
            textSpfVerifyStatus.innerText = "検証開始待ち...";
            textDkimVerifyStatus.innerText = "検証開始待ち...";
            textSpfAlignStatus.innerText = "検証開始待ち...";
            textDkimAlignStatus.innerText = "検証開始待ち...";
            textDmarcPolicyStatus.innerText = "検証開始待ち...";
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
            blockVerifySPF.style.backgroundColor = "rgba(99,102,241,0.05)";
            textSpfVerifyStatus.innerHTML = `⚙️ ${envDom} の DNS TXTレコードを参照中...<br>`;
            await new Promise(r => setTimeout(r, 600));

            if (envDom === "trusted-bank.com") {
                textSpfVerifyStatus.innerHTML += `・SPFレコード: <code>v=spf1 ip4:192.0.2.0/24 -all</code><br>`;
                if (ip.startsWith("192.0.2.")) {
                    spfPass = true;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong>PASS</strong> (送信元IP ${ip} は許可リスト内)`;
                } else {
                    spfPass = false;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong>FAIL</strong> (送信元IP ${ip} は許可リスト外)`;
                }
            } else if (envDom === "malicious.domain") {
                textSpfVerifyStatus.innerHTML += `・SPFレコード: <code>v=spf1 ip4:198.51.100.0/24 -all</code><br>`;
                if (ip.startsWith("198.51.100.")) {
                    spfPass = true;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong>PASS</strong> (送信元IP ${ip} は攻撃者ドメインの許可リスト内)`;
                } else {
                    spfPass = false;
                    textSpfVerifyStatus.innerHTML += `・結果: <strong>FAIL</strong> (送信元IP ${ip} は攻撃者ドメインの許可リスト外)`;
                }
            }

            badgeSpfResult.style.display = "inline-block";
            badgeSpfResult.innerText = spfPass ? "PASS" : "FAIL";
            badgeSpfResult.className = spfPass ? "badge badge-success" : "badge badge-danger";
            blockVerifySPF.style.borderColor = spfPass ? "var(--color-success)" : "#ef4444";

            // --- STEP 2: DKIM Verification ---
            blockVerifyDKIM.style.borderColor = "var(--color-primary)";
            blockVerifyDKIM.style.backgroundColor = "rgba(99,102,241,0.05)";
            textDkimVerifyStatus.innerHTML = `⚙️ DKIM署名をチェック中...<br>`;
            await new Promise(r => setTimeout(r, 600));

            if (!hasDkim) {
                dkimPass = false;
                textDkimVerifyStatus.innerHTML += `・結果: <strong>NONE/FAIL</strong> (DKIM-Signature ヘッダーが存在しません)`;
            } else {
                if (preset === "legit") {
                    dkimPass = true;
                    textDkimVerifyStatus.innerHTML += `・DNSから <code>selector1._domainkey.trusted-bank.com</code> 公開鍵を取得。<br>・結果: <strong>PASS</strong> (署名の検証に成功)`;
                } else if (preset === "spoof_dkim_fail") {
                    dkimPass = false;
                    textDkimVerifyStatus.innerHTML += `・DNSから <code>selector1._domainkey.trusted-bank.com</code> 公開鍵を取得。<br>・結果: <strong>FAIL</strong> (本文/ヘッダハッシュ不一致。改ざん検知)`;
                }
            }

            badgeDkimResult.style.display = "inline-block";
            badgeDkimResult.innerText = dkimPass ? "PASS" : "FAIL";
            badgeDkimResult.className = dkimPass ? "badge badge-success" : "badge badge-danger";
            blockVerifyDKIM.style.borderColor = dkimPass ? "var(--color-success)" : "#ef4444";

            // --- STEP 3: SPF Alignment ---
            blockAlignSPF.style.borderColor = "var(--color-primary)";
            blockAlignSPF.style.backgroundColor = "rgba(99,102,241,0.05)";
            textSpfAlignStatus.innerHTML = `⚙️ SPFアライメント照合中...<br>`;
            await new Promise(r => setTimeout(r, 500));

            // Alignment passes if Header From matches Envelope-From (relaxed permits organziation domain match)
            if (headerDom === envDom) {
                spfAlign = true;
                textSpfAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・Envelope-From: <code>${envDom}</code><br>・結果: <strong>MATCH (合格)</strong>`;
            } else {
                spfAlign = false;
                textSpfAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・Envelope-From: <code>${envDom}</code><br>・結果: <strong>MISMATCH (不合格)</strong>`;
            }

            badgeSpfAlignResult.style.display = "inline-block";
            badgeSpfAlignResult.innerText = spfAlign ? "PASS" : "FAIL";
            badgeSpfAlignResult.className = spfAlign ? "badge badge-success" : "badge badge-danger";
            blockAlignSPF.style.borderColor = spfAlign ? "var(--color-success)" : "#ef4444";

            // --- STEP 4: DKIM Alignment ---
            blockAlignDKIM.style.borderColor = "var(--color-primary)";
            blockAlignDKIM.style.backgroundColor = "rgba(99,102,241,0.05)";
            textDkimAlignStatus.innerHTML = `⚙️ DKIMアライメント照合中...<br>`;
            await new Promise(r => setTimeout(r, 500));

            if (!hasDkim) {
                dkimAlign = false;
                textDkimAlignStatus.innerHTML += `・結果: <strong>FAIL</strong> (有効なDKIM署名が存在しないためアライメント不可)`;
            } else {
                // If signature exists, check d= domain
                if (preset === "legit" || preset === "spoof_dkim_fail") {
                    // Legit/Spoof dkim fail both use trusted-bank.com for signature domain d=
                    const dkimDom = "trusted-bank.com";
                    if (headerDom === dkimDom) {
                        dkimAlign = true;
                        textDkimAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・DKIM署名ドメイン (d=): <code>${dkimDom}</code><br>・結果: <strong>MATCH (合格)</strong>`;
                    } else {
                        dkimAlign = false;
                        textDkimAlignStatus.innerHTML += `・Header From: <code>${headerDom}</code><br>・DKIM署名ドメイン (d=): <code>${dkimDom}</code><br>・結果: <strong>MISMATCH (不合格)</strong>`;
                    }
                }
            }

            badgeDkimAlignResult.style.display = "inline-block";
            badgeDkimAlignResult.innerText = dkimAlign ? "PASS" : "FAIL";
            badgeDkimAlignResult.className = dkimAlign ? "badge badge-success" : "badge badge-danger";
            blockAlignDKIM.style.borderColor = dkimAlign ? "var(--color-success)" : "#ef4444";

            // --- STEP 5: DMARC Policy integration ---
            blockDmarcPolicy.style.borderColor = "var(--color-primary)";
            blockDmarcPolicy.style.backgroundColor = "rgba(99,102,241,0.05)";
            textDmarcPolicyStatus.innerHTML = `⚙️ DMARCアライメント判定を統合評価中...<br>`;
            await new Promise(r => setTimeout(r, 800));

            // DMARC passes if:
            // (SPF passes AND SPF alignment passes) OR (DKIM passes AND DKIM alignment passes)
            const dmarcSpfPass = spfPass && spfAlign;
            const dmarcDkimPass = dkimPass && dkimAlign;

            if (dmarcSpfPass || dmarcDkimPass) {
                dmarcPass = true;
                textDmarcPolicyStatus.innerHTML += `・DMARC判定: <strong>PASS (合格)</strong><br>`;
                if (dmarcSpfPass && dmarcDkimPass) {
                    textDmarcPolicyStatus.innerHTML += `・理由: SPF/DKIMアライメントを伴う双方の認証に合格しました。`;
                } else if (dmarcSpfPass) {
                    textDmarcPolicyStatus.innerHTML += `・理由: DKIMは不合格ですが、アライメント合格したSPFがPASSしたためDMARCを通過します。`;
                } else {
                    textDmarcPolicyStatus.innerHTML += `・理由: SPFは不合格ですが、アライメント合格したDKIM署名がPASSしたためDMARCを通過します。`;
                }
                finalAction = "none"; // Accept
            } else {
                dmarcPass = false;
                textDmarcPolicyStatus.innerHTML += `・DMARC判定: <strong style="color: #f87171;">FAIL (不合格)</strong><br>`;
                textDmarcPolicyStatus.innerHTML += `・理由: SPF/DKIMのどちらもアライメント整合性を持つ認証に合格しませんでした。<br>`;

                // Fetch DMARC policy from Header From domain DNS
                textDmarcPolicyStatus.innerHTML += `⚙️ 詐称ドメイン ${headerDom} の DMARC ポリシーを確認中...<br>`;
                await new Promise(r => setTimeout(r, 500));

                if (headerDom === "trusted-bank.com") {
                    textDmarcPolicyStatus.innerHTML += `・DMARCレコード: <code>p=reject</code> (厳格ポリシー指定)<br>`;
                    finalAction = "reject";
                    textDmarcPolicyStatus.innerHTML += `・結果: 送信ポリシーに従い、このメールを<strong>拒否 (SMTP 554 配送エラー応答)</strong>します。`;
                } else {
                    // Default fallback policy
                    textDmarcPolicyStatus.innerHTML += `・DMARCレコード: <code>p=none</code> (モニタリング指定)<br>`;
                    finalAction = "none";
                    textDmarcPolicyStatus.innerHTML += `・結果: DMARCは失敗ですがポリシーが p=none のため、<strong>受信箱へ配送</strong>します。`;
                }
            }

            badgeDmarcResult.style.display = "inline-block";
            badgeDmarcResult.innerText = dmarcPass ? "PASS" : "FAIL";
            badgeDmarcResult.className = dmarcPass ? "badge badge-success" : "badge badge-danger";
            blockDmarcPolicy.style.borderColor = dmarcPass ? "var(--color-success)" : "#ef4444";

            // Final Action Display Box update
            if (finalAction === "none") {
                textDmarcFinalAction.innerText = "通常配送 (受信箱)";
                textDmarcFinalAction.style.color = "var(--color-success)";
                dmarcActionBox.style.borderColor = "var(--color-success)";
            } else if (finalAction === "quarantine") {
                textDmarcFinalAction.innerText = "隔離 (迷惑フォルダ)";
                textDmarcFinalAction.style.color = "#fbbf24";
                dmarcActionBox.style.borderColor = "#fbbf24";
            } else if (finalAction === "reject") {
                textDmarcFinalAction.innerText = "受信拒否 (Reject)";
                textDmarcFinalAction.style.color = "#f87171";
                dmarcActionBox.style.borderColor = "#f87171";
            }

            // Explanatory detail box dynamically updated based on the scenario
            updateDetailContent(preset, spfPass, dkimPass, spfAlign, dkimAlign, dmarcPass, finalAction);

            btnStartAuthVerify.disabled = false;
            if (dmarcPass) {
                app.log("success", `[ドメイン認証] メールがDMARCをパスしました。配送: ${textDmarcFinalAction.innerText}`);
            } else {
                app.log("error", `[ドメイン認証] メールがDMARCで失敗しました。ポリシー処理: ${textDmarcFinalAction.innerText}`);
            }
        });

        // Generate tailored explanations for educational support
        function updateDetailContent(preset, spf, dkim, spfAlign, dkimAlign, dmarc, action) {
            let html = `<span style="font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; display: block; margin-bottom: 8px;">💡 検証解説: ${authMailPreset.options[authMailPreset.selectedIndex].text}</span>`;

            if (preset === "legit") {
                html += `
                    正当なドメイン送信者からの正規メールです。<br><br>
                    送信元IP <code>192.0.2.10</code> が <code>trusted-bank.com</code> の SPF レコードに含まれるため、<strong>SPFはPASS</strong>します。<br>
                    また、正規の秘密鍵で署名されているため <strong>DKIMもPASS</strong>します。<br>
                    ドメインアライメントもすべて一致しているため、総合判定は <strong>DMARC PASS</strong> となり、メールは無事に受信者の受信箱へ届けられます。
                `;
            } else if (preset === "spoof_spf_fail") {
                html += `
                    攻撃者のメールサーバ（IP: <code>198.51.100.5</code>）から、差出人を銀行（<code>trusted-bank.com</code>）と詐称して直接送りつけられた典型的な「なりすましメール」です。<br><br>
                    受信サーバは <code>trusted-bank.com</code> の SPF レコードを引きますが、その中に攻撃者のIP <code>198.51.100.5</code> が存在しないため、<strong>SPF検証はFAIL</strong>します。またDKIM署名も存在しません。<br>
                    結果としてDMARCはFAILし、詐称されたドメイン側のポリシーが <code>p=reject</code> に設定されているため、受信サーバはこのメールを <strong>SMTPエラーを返して即座に遮断（受信拒否）</strong> します。
                `;
            } else if (preset === "spoof_spf_align_fail") {
                html += `
                    メーリングリストなどを経由、または攻撃者が自身のドメイン（<code>malicious.domain</code>）から送信IPを登録した上で、メーラーに表示される From（Header From）だけを銀行（<code>trusted-bank.com</code>）と詐称した巧妙ななりすましメールです。<br><br>
                    ・<strong>SPF単体はPASSします</strong>。なぜなら、SPFレコードの照合は SMTP 通信時の送信者 <code>Envelope-From (malicious.domain)</code> に対して行われ、攻撃者のIPが許可されているからです。<br>
                    ・しかし、<strong>DMARCアライメント検証で不合格になります</strong>。Header From（<code>trusted-bank.com</code>）と Envelope-From（<code>malicious.domain</code>）が異なるためです。<br>
                    DMARCはアライメント不合格による「なりすまし」と判断し、本来の銀行のポリシー <code>p=reject</code> に従って、このメールを <strong>受信拒否</strong> します。
                `;
            } else if (preset === "spoof_dkim_fail") {
                html += `
                    DKIM署名は付与されていますが、伝送中に改ざんされたか、もしくは署名に使用された秘密鍵に対応する公開鍵がDNSに存在しない（または失効している）場合のシミュレーションです。<br><br>
                    SPF（IP認証）はPASSしていますが、<strong>DKIMの電子署名検証自体がFAIL</strong>になります。<br>
                    ただし、このメールは SPF 認証と SPF アライメント（Fromドメインの一致）をパスしているため、<strong>DMARC全体としては合格 (PASS) と判定されます</strong>（DMARCはSPFとDKIMのいずれか一方がアライメント付きでPASSすれば合格となるため）。そのため、受信箱へ通常配送されます。
                `;
            } else if (preset === "spoof_dmarc_fail") {
                html += `
                    攻撃者のメールサーバ（IP: <code>198.51.100.5</code>）から、Envelope-From を <code>malicious.domain</code>、Header From を <code>trusted-bank.com</code> として送信されたなりすましメールです。<br><br>
                    攻撃者のIPは <code>malicious.domain</code> のSPFレコードに許可されているため SPF認証自体はPASSしますが、ドメイン不一致により <strong>SPFアライメントはFAIL</strong> します。DKIM署名もありません。<br>
                    SPF/DKIMいずれのアライメントも通過しないため <strong>DMARCはFAIL</strong> となります。<br>
                    銀行ドメイン <code>trusted-bank.com</code> の DMARC レコードの指示に従い、メールは <strong>受信拒否（Reject）</strong> されます。
                `;
            }

            authDetailContent.innerHTML = html;
        }

        // Initialize preset state
        authMailPreset.dispatchEvent(new Event("change"));
    }
};
