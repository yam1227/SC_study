/**
 * Module 9: SAML 2.0 & GakuNin SSO Simulator
 */
window.SecurityLabModules["saml"] = {
    html: `
        <div class="lab-container">
            <div class="lab-grid-2" style="grid-template-columns: 1.2fr 0.8fr;">
                <!-- Left: Flow Diagram & Control -->
                <div class="card">
                    <h3>📡 SAML 2.0 / 学認 (GakuNin) SSO フローシミュレーター</h3>
                    <p class="card-subtitle">大学と外部サービス（学術検索DBなど）を連携するシングルサインオン規格であるSAMLのシーケンスと、SPによる厳密なアサーション検証プロセスを学びます。</p>
                    
                    <div class="flow-scenario-badge" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 13px; line-height: 1.4;">
                        <strong>🏫 実証シナリオ (学認の例)</strong><br>
                        ・<strong>ユーザー (ブラウザ)</strong>: 〇〇大学の教員・学生 (ID: <code>yamada</code>)<br>
                        ・<strong>SP (サービスプロバイダ)</strong>: 学術検索DB (EntityID: <code>https://sp.sciencesearch.jp/saml2</code>)<br>
                        ・<strong>IdP (アイデンティティプロバイダ)</strong>: 大学の統合認証システム (EntityID: <code>https://idp.university.ac.jp/idp/shibboleth</code>)
                    </div>

                    <!-- SVG Sequence Diagram -->
                    <div class="oauth-flow-diagram" style="background: #121214; border-radius: 8px; padding: 10px;">
                        <svg class="oauth-svg" viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg">
                            <!-- Lifelines -->
                            <line x1="100" y1="50" x2="100" y2="300" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="300" y1="50" x2="300" y2="300" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />
                            <line x1="500" y1="50" x2="500" y2="300" stroke="#2d2d34" stroke-width="1" stroke-dasharray="4" />

                            <!-- Actors -->
                            <rect id="saml-actor-user" class="svg-actor" x="40" y="15" width="120" height="35" rx="5" />
                            <text class="svg-text" x="100" y="36">ユーザー (ブラウザ)</text>

                            <rect id="saml-actor-sp" class="svg-actor" x="240" y="15" width="120" height="35" rx="5" />
                            <text class="svg-text" x="300" y="36">学術検索DB (SP)</text>

                            <rect id="saml-actor-idp" class="svg-actor" x="440" y="15" width="120" height="35" rx="5" />
                            <text class="svg-text" x="500" y="36">大学統合認証 (IdP)</text>

                            <!-- Step Arrows -->
                            <!-- Step 1: Access & Initiate AuthnRequest (User -> SP) -->
                            <g id="saml-arrow-1" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 100,80 L 290,80" marker-end="url(#saml-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="195" y="73">1. 学術検索DBにアクセス</text>
                            </g>

                            <!-- Step 2: AuthnRequest Redirect (SP -> User -> IdP) -->
                            <g id="saml-arrow-2" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 300,120 L 110,120" marker-end="url(#saml-arrowhead)" />
                                <path class="svg-arrow" d="M 100,145 L 490,145" marker-end="url(#saml-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="200" y="113">2. SAMLRequest (認証要求) をIdPへリダイレクト</text>
                            </g>

                            <!-- Step 3: Identity Verification (IdP internal authentication) -->
                            <g id="saml-arrow-3" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 500,180 L 515,180 A 15,15 0 1,1 515,200 L 505,200" marker-end="url(#saml-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="525" y="195" text-anchor="start">3. ID/PW認証 & 署名アサーション生成</text>
                            </g>

                            <!-- Step 4: SAMLResponse via Browser POST (IdP -> User -> SP) -->
                            <g id="saml-arrow-4" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 500,235 L 110,235" marker-end="url(#saml-arrowhead)" />
                                <path class="svg-arrow" d="M 100,260 L 290,260" marker-end="url(#saml-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="300" y="228">4. SAMLResponse (アサーション) をSPのACSへPOST</text>
                            </g>

                            <!-- Step 5: Verify & Authenticate (SP internal verification) -->
                            <g id="saml-arrow-5" class="flow-arrow-group">
                                <path class="svg-arrow" d="M 300,285 L 285,285 A 15,15 0 1,1 285,300 L 295,300" marker-end="url(#saml-arrowhead)" />
                                <text class="svg-text svg-text-sub" x="270" y="295" text-anchor="end">5. 署名・期限・Audience等の厳密検証</text>
                            </g>

                            <!-- Definitions for marker arrowheads -->
                            <defs>
                                <marker id="saml-arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                                    <polygon points="0 0, 7 3.5, 0 7" fill="currentColor" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    <!-- Flow Controls -->
                    <div style="display: flex; gap: 14px; margin-top: 20px;">
                        <button class="btn btn-secondary" id="btnSamlReset">リセット</button>
                        <button class="btn btn-primary" id="btnSamlNext">次のステップへ進む</button>
                    </div>
                </div>

                <!-- Right: Step Explanation & XML Parser / Tamper Simulator -->
                <div class="card">
                    <h3>📁 SAML パケット & アサーション検証</h3>
                    <p class="card-subtitle">通信中のSAML XMLの内部構造と、SPでのアサーション検証基準を確認します。</p>

                    <div class="form-group">
                        <label>現在の状態:</label>
                        <div style="font-size: 14px; font-weight: bold; color: var(--color-primary-hover);" id="samlStepTitle">
                            開始ボタンを押してください
                        </div>
                    </div>

                    <!-- Interactive Area (Dynamically changes between info and code editors) -->
                    <div class="form-group">
                        <label id="samlPacketLabel">通信メッセージ詳細 (SAML XML):</label>
                        
                        <!-- XML viewer and editor -->
                        <div id="samlNormalXmlContainer" class="response-box" style="background-color: #0c0a09; height: 260px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.4;">
                            <code id="samlPacketCode" style="color: #60a5fa; white-space: pre;">フローを開始するとここにSAML Request/ResponseのXMLデータが表示されます。</code>
                        </div>
                        
                        <div id="samlTamperContainer" style="display: none; margin-top: 10px;">
                            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                                ⚠️ <strong>改ざんテスト</strong>: XMLデータを自由に編集できます。以下のボタンでプリセットを試すことも可能です。
                            </p>
                            <textarea id="samlResponseTextarea" class="response-box" style="width: 100%; height: 200px; background-color: #0c0a09; color: #a7f3d0; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.4; border: 1px solid #34d399; resize: vertical; padding: 10px;"></textarea>
                            
                            <!-- Preset Buttons for Tampering -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                                <button class="btn btn-secondary" style="font-size: 11px; padding: 6px;" id="btnTamperSignature">❌ 署名値を改ざんする</button>
                                <button class="btn btn-secondary" style="font-size: 11px; padding: 6px;" id="btnTamperExpiry">❌ 有効期限を過去にする</button>
                                <button class="btn btn-secondary" style="font-size: 11px; padding: 6px;" id="btnTamperAudience">❌ 宛先SP(Audience)を書き換える</button>
                                <button class="btn btn-secondary" style="font-size: 11px; padding: 6px;" id="btnTamperRole">❌ 所属(属性)を教員に昇格</button>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 10px; gap: 10px;">
                                <button class="btn btn-secondary" style="font-size: 12px; width: 45%;" id="btnTamperRestore">🔄 正常なXMLに戻す</button>
                                <button class="btn btn-primary" style="font-size: 12px; width: 50%; color: #34d399; border-color: #34d399;" id="btnExecuteVerify">🛡️ SPへ送信して検証実行</button>
                            </div>
                        </div>
                    </div>

                    <!-- Step-based security explanation -->
                    <div class="form-group">
                        <label>セキュリティ解説 / 検証結果:</label>
                        <div style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); max-height: 200px; overflow-y: auto;" id="samlStepExplanation">
                            SAML (Security Assertion Markup Language) は、異なるドメイン（組織）の間でユーザー認証情報や属性（認可情報）を安全に受け渡すためのXMLベースの規格です。学認 (GakuNin) はSAMLの国際的フェデレーションであり、所属大学の認証で様々なオンラインジャーナル等にアクセスできます。
                        </div>
                    </div>
                </div>
            </div>

            <!-- SP Verification Checklist (Detailed interactive card) -->
            <div class="card" id="spVerificationCard" style="display: none; margin-top: 20px;">
                <h3>🛡️ サービスプロバイダ (SP) によるSAMLアサーションの厳密検証</h3>
                <p class="card-subtitle" style="margin-bottom: 16px;">SAML認証において、SPは受信した <code>SAMLResponse</code> から <code>SAMLアサーション</code> を抽出し、ログインを認可する前に以下の5つの検証項目を<strong>すべて厳密に</strong>検証しなければなりません。いずれか1つでも不合格の場合、ログインは拒否されます。</p>
                
                <div class="verification-checks-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <!-- Check 1 -->
                    <div class="check-box-card" id="chk-signature" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: #18181b;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-primary);">1. デジタル署名の検証</h4>
                            <span class="status-badge" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;" id="badge-signature">待機中</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                            あらかじめメタデータで共有されたIdPの公開鍵を用いて、SAMLアサーション内の署名が有効であることを確認します。これにより、<strong>アサーション内容の改ざんやなりすましを防止</strong>します。
                        </p>
                        <div style="font-size: 11px; color: var(--color-primary-hover); margin-top: 8px; font-family: monospace;" id="detail-signature"></div>
                    </div>

                    <!-- Check 2 -->
                    <div class="check-box-card" id="chk-conditions" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: #18181b;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-primary);">2. 有効期限の検証</h4>
                            <span class="status-badge" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;" id="badge-conditions">待機中</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                            <code>&lt;saml:Conditions&gt;</code> の <code>NotBefore</code> (この時間以降有効) と <code>NotOnOrAfter</code> (この時間未満有効) を確認し、現在時刻が範囲内にあるかを検証します。
                        </p>
                        <div style="font-size: 11px; color: var(--color-primary-hover); margin-top: 8px; font-family: monospace;" id="detail-conditions"></div>
                    </div>

                    <!-- Check 3 -->
                    <div class="check-box-card" id="chk-audience" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: #18181b;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-primary);">3. 宛先 (Audience) の検証</h4>
                            <span class="status-badge" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;" id="badge-audience">待機中</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                            <code>&lt;saml:Audience&gt;</code> に記録されたEntityIDが、自SPのEntityID (<code>https://sp.sciencesearch.jp/saml2</code>) と完全一致するか検証します。他SP向けのアサーションを使い回す<strong>アサーション差し替え攻撃を防ぎます</strong>。
                        </p>
                        <div style="font-size: 11px; color: var(--color-primary-hover); margin-top: 8px; font-family: monospace;" id="detail-audience"></div>
                    </div>

                    <!-- Check 4 -->
                    <div class="check-box-card" id="chk-in-response-to" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: #18181b;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-primary);">4. リプレイ攻撃の検証</h4>
                            <span class="status-badge" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;" id="badge-in-response-to">待機中</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                            <code>&lt;saml:SubjectConfirmationData&gt;</code> の <code>InResponseTo</code> が、SPがステップ1で送信した <code>SAMLRequest (ID)</code> と一致するか検証します。また、アサーションのIDをキャッシュし、使い回されていないか検証して<strong>リプレイ攻撃を防ぎます</strong>。
                        </p>
                        <div style="font-size: 11px; color: var(--color-primary-hover); margin-top: 8px; font-family: monospace;" id="detail-in-response-to"></div>
                    </div>

                    <!-- Check 5 -->
                    <div class="check-box-card" id="chk-recipient" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: #18181b;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-primary);">5. 受信エンドポイント (Recipient)</h4>
                            <span class="status-badge" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;" id="badge-recipient">待機中</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                            <code>Recipient</code> 属性値が、自SPのACS URL（SAML応答受け取り窓口: <code>https://sp.sciencesearch.jp/saml2/acs</code>）と完全一致するか検証します。
                        </p>
                        <div style="font-size: 11px; color: var(--color-primary-hover); margin-top: 8px; font-family: monospace;" id="detail-recipient"></div>
                    </div>
                </div>

                <!-- Final Verification Result Alert -->
                <div id="samlVerificationResultBox" style="margin-top: 20px; border-radius: 8px; padding: 16px; display: none;">
                    <!-- Filled dynamically -->
                </div>
            </div>
            
            <!-- Learning Content Card -->
            <div class="card" style="margin-top: 20px;">
                <h3>💡 セキスペ試験対策：SAML認証と「学認（GakuNin）」のポイント</h3>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px;">1. SP-initiated SSO と IdP-initiated SSO</h4>
                        <p>
                            SAMLのSSO開始フローには2種類あります。<br>
                            ・<strong>SP-initiated (一般的)</strong>: ユーザーがまずSP（学術検索DB等）にアクセスし、SPが <code>AuthnRequest</code> (SAMLRequest) を生成してブラウザ経由でIdPに送り、認証を開始するフローです（本デモで再現）。<br>
                            ・<strong>IdP-initiated</strong>: ユーザーがまず大学の認証ポータル (IdP) にログインし、そこからメニュー等を選択してSPへ直接SAMLResponseを送り、シングルサインオンするフローです。SPの認証要求(ID)を検証する <code>InResponseTo</code> チェックがスキップされるため、セキュリティ設計上特別な考慮が必要です。
                        </p>
                    </div>
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px;">2. メタデータの役割と事前共有</h4>
                        <p>
                            SAML認証を機能させるには、SPとIdPが事前に設定（ Entity ID, ACS URL, 公開鍵証明書など）を共有している必要があります。この設定ファイルを <strong>メタデータ (Metadata)</strong> と呼びます。<br>
                            「学認（GakuNin）」などの認証フェデレーションでは、信頼された運営組織（国立情報学研究所: NII）が一括して参加組織のメタデータをとりまとめ、各SP/IdPへ配信する仕組みを取っています。これにより、数万〜数十万通りの組み合わせの組織間SSOを個別の信頼構築なしで安全に実現しています。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    init: function(app) {
        const btnSamlNext = document.getElementById("btnSamlNext");
        const btnSamlReset = document.getElementById("btnSamlReset");
        const samlStepTitle = document.getElementById("samlStepTitle");
        const samlPacketCode = document.getElementById("samlPacketCode");
        const samlStepExplanation = document.getElementById("samlStepExplanation");
        
        // Tamper elements
        const samlNormalXmlContainer = document.getElementById("samlNormalXmlContainer");
        const samlTamperContainer = document.getElementById("samlTamperContainer");
        const samlResponseTextarea = document.getElementById("samlResponseTextarea");
        const btnTamperSignature = document.getElementById("btnTamperSignature");
        const btnTamperExpiry = document.getElementById("btnTamperExpiry");
        const btnTamperAudience = document.getElementById("btnTamperAudience");
        const btnTamperRole = document.getElementById("btnTamperRole");
        const btnTamperRestore = document.getElementById("btnTamperRestore");
        const btnExecuteVerify = document.getElementById("btnExecuteVerify");
        
        // Verification Card elements
        const spVerificationCard = document.getElementById("spVerificationCard");
        const samlVerificationResultBox = document.getElementById("samlVerificationResultBox");
        
        let currentStep = 0;
        let authRequestId = "";
        let originalResponseXml = "";
        let currentResponseXml = "";
        
        // Helper: Highlight XML tags
        function highlightXML(xml) {
            if (!xml) return '';
            let escaped = xml
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            // Highlight XML syntax
            escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9:-]+)(.*?)&gt;/g, (match, tag, attrs) => {
                let highlightedAttrs = attrs.replace(/([a-zA-Z0-9:-]+)="([^"]*)"/g, '<span style="color: #93c5fd;">$1</span>="<span style="color: #fca5a5;">$2</span>"');
                return '&lt;<span style="color: #3b82f6; font-weight: bold;">' + tag + '</span>' + highlightedAttrs + '&gt;';
            });
            return escaped;
        }

        // Reset flow
        function resetFlow() {
            currentStep = 0;
            authRequestId = "";
            originalResponseXml = "";
            currentResponseXml = "";
            
            samlStepTitle.innerText = "SAML 認証を開始してください。";
            samlPacketCode.innerHTML = "「次のステップへ進む」をクリックすると、SPからフローを開始します。";
            samlNormalXmlContainer.style.display = "block";
            samlTamperContainer.style.display = "none";
            spVerificationCard.style.display = "none";
            samlVerificationResultBox.style.display = "none";
            
            btnSamlNext.disabled = false;
            btnSamlNext.innerText = "次のステップへ進む";
            
            // Reset SVG arrows
            document.querySelectorAll(".flow-arrow-group").forEach(el => {
                el.setAttribute("opacity", "0.2");
                const path = el.querySelector(".svg-arrow");
                if (path) path.classList.remove("svg-arrow-active");
            });
            document.querySelectorAll(".svg-actor").forEach(el => {
                el.classList.remove("svg-actor-active");
            });
            
            // Reset checklist badges
            const badges = ["badge-signature", "badge-conditions", "badge-audience", "badge-in-response-to", "badge-recipient"];
            badges.forEach(id => {
                const el = document.getElementById(id);
                el.innerText = "待機中";
                el.style.background = "#374151";
                el.style.color = "#d1d5db";
            });
            const details = ["detail-signature", "detail-conditions", "detail-audience", "detail-in-response-to", "detail-recipient"];
            details.forEach(id => {
                document.getElementById(id).innerText = "";
            });
        }

        // Apply active state in SVG
        function highlightSvgStep(stepNum) {
            // Reset opacity and classes
            document.querySelectorAll(".flow-arrow-group").forEach(el => {
                el.setAttribute("opacity", "0.2");
                const path = el.querySelector(".svg-arrow");
                if (path) path.classList.remove("svg-arrow-active");
            });
            document.querySelectorAll(".svg-actor").forEach(el => {
                el.classList.remove("svg-actor-active");
            });

            // Highlight specific elements
            if (stepNum === 1) {
                const arrow = document.getElementById("saml-arrow-1");
                if (arrow) {
                    arrow.setAttribute("opacity", "1");
                    arrow.querySelector(".svg-arrow").classList.add("svg-arrow-active");
                }
                document.getElementById("saml-actor-sp").classList.add("svg-actor-active");
            } else if (stepNum === 2) {
                const arrow = document.getElementById("saml-arrow-2");
                if (arrow) {
                    arrow.setAttribute("opacity", "1");
                    arrow.querySelector(".svg-arrow").classList.add("svg-arrow-active");
                }
                document.getElementById("saml-actor-idp").classList.add("svg-actor-active");
            } else if (stepNum === 3) {
                const arrow = document.getElementById("saml-arrow-3");
                if (arrow) {
                    arrow.setAttribute("opacity", "1");
                    arrow.querySelector(".svg-arrow").classList.add("svg-arrow-active");
                }
                document.getElementById("saml-actor-idp").classList.add("svg-actor-active");
            } else if (stepNum === 4) {
                const arrow = document.getElementById("saml-arrow-4");
                if (arrow) {
                    arrow.setAttribute("opacity", "1");
                    arrow.querySelector(".svg-arrow").classList.add("svg-arrow-active");
                }
                document.getElementById("saml-actor-user").classList.add("svg-actor-active");
            } else if (stepNum === 5) {
                const arrow = document.getElementById("saml-arrow-5");
                if (arrow) {
                    arrow.setAttribute("opacity", "1");
                    arrow.querySelector(".svg-arrow").classList.add("svg-arrow-active");
                }
                document.getElementById("saml-actor-sp").classList.add("svg-actor-active");
            }
        }

        // Step logic
        async function nextStep() {
            currentStep++;
            highlightSvgStep(currentStep);

            if (currentStep === 1) {
                samlStepTitle.innerText = "ステップ 1: 学術検索DB (SP) へアクセスし、大学を指定";
                samlStepExplanation.innerHTML = `
                    ユーザーが学術検索DBのサービスを利用するため、「学認でログイン」を選択します。<br>
                    SPはユーザーに「所属組織（大学）の選択」を求めます。ユーザーが「〇〇大学」を選択すると、SPはIdPへの認証リクエストの作成を開始します。<br><br>
                    <strong>セキュリティポイント:</strong><br>
                    SPはここで各IdPのEntityIDと通信URL情報を、事前に信頼されたフェデレーションメタデータからルックアップします。
                `;
                
                try {
                    const data = await app.apiCall("/api/saml/initiate", "POST");
                    authRequestId = data.request_id;
                    samlPacketCode.innerHTML = highlightXML(data.xml);
                } catch (error) {
                    samlPacketCode.innerText = "エラー: 認証要求の生成に失敗しました。\n" + error.message;
                }

            } else if (currentStep === 2) {
                samlStepTitle.innerText = "ステップ 2: SAMLRequest (認証要求) をブラウザ経由でIdPへ送付";
                
                try {
                    const data = await app.apiCall("/api/saml/initiate", "POST");
                    
                    samlStepExplanation.innerHTML = `
                        SPは生成した <code>&lt;samlp:AuthnRequest&gt;</code> XMLを<strong>DEFLATE圧縮し、Base64エンコード</strong>します（<code>SAMLRequest</code> パラメータ）。<br>
                        そしてブラウザに対し、大学のIdP（統合認証エンドポイント）へリダイレクトする指示（HTTP 302）を出します。<br><br>
                        <strong>パケット詳細:</strong><br>
                        GET /SAML2/Redirect/SSO?SAMLRequest=fVJNT8...&SigAlg=...<br><br>
                        右側のパケットインスペクタでは、デコードした元の <code>SAMLRequest XML</code> を確認できます。SPのEntityID (<code>Issuer</code>) や認証後の戻り先ACS URL (<code>AssertionConsumerServiceURL</code>) が明記されています。
                    `;
                    samlPacketCode.innerHTML = `<strong>[HTTP GET Redirect URL (ブラウザが移動する先)]</strong>\n` + 
                                               `<span style="color: #a7f3d0; word-break: break-all;">${data.redirect_url}</span>\n\n` + 
                                               `<strong>[デコード後の SAMLRequest XML]</strong>\n` + 
                                               highlightXML(data.xml);
                } catch (error) {
                    samlPacketCode.innerText = "エラー: リダイレクト要求の取得に失敗しました。\n" + error.message;
                }

            } else if (currentStep === 3) {
                samlStepTitle.innerText = "ステップ 3: 大学認証ポータル (IdP) で認証＆署名付きSAMLResponseの生成";
                samlStepExplanation.innerHTML = `
                    大学の統合認証システム (IdP) の画面がユーザーに表示されます。ユーザーは自身の大学用ID・パスワード（またはMFAなど）を入力し、IdPは認証を確認します。<br><br>
                    認証がOKの場合、IdPはユーザーの識別情報（NameID）および属性情報（メール、所属など）を含む<strong>SAMLアサーション (SAML Assertion)</strong>を作成します。<br><br>
                    <strong>デジタル署名の適用:</strong><br>
                    IdPは、作成した <code>&lt;saml:Assertion&gt;</code> を保護するため、<strong>IdPの持つ秘密鍵で署名</strong>を計算し、<code>&lt;ds:SignatureValue&gt;</code> を埋め込みます。これにより、このアサーションは第三者による書き換えが不可能な安全なデータになります。
                `;
                
                try {
                    const data = await app.apiCall("/api/saml/authenticate", "POST", {
                        username: "yamada",
                        authn_request_id: authRequestId
                    });
                    originalResponseXml = data.xml;
                    currentResponseXml = data.xml;
                    samlPacketCode.innerHTML = highlightXML(data.xml);
                } catch (error) {
                    samlPacketCode.innerText = "エラー: SAMLResponseの生成に失敗しました。\n" + error.message;
                }

            } else if (currentStep === 4) {
                samlStepTitle.innerText = "ステップ 4: SAMLResponse (アサーション) をSPのACSへ POST送信 (改ざんチャンス)";
                samlStepExplanation.innerHTML = `
                    IdPは生成したSAMLResponseをBase64エンコードし、ブラウザを介してSPの受け入れ口（ACS URL: Assertion Consumer Service）宛てに HTTP POST 送信します。<br><br>
                    <strong>🔥ハンズオン改ざんチャンス:</strong><br>
                    通常はブラウザによって自動ポストされますが、ここではパケットをキャプチャした状態を再現しています。<br>
                    右側の<strong>「改ざんテスト」エディタ</strong>で、アサーションの値を書き換え（改ざん）てみましょう。例えば、所属を <code>student</code>（学生）から <code>faculty</code>（教員）に書き換えて「SPへ送信して検証実行」を押し、SPがどのように改ざんをブロックするか確認してください。
                `;
                
                samlNormalXmlContainer.style.display = "none";
                samlTamperContainer.style.display = "block";
                samlResponseTextarea.value = originalResponseXml;
                
                btnSamlNext.innerText = "SPでの検証結果を確認";
                btnSamlNext.disabled = true;

            } else if (currentStep === 5) {
                samlStepTitle.innerText = "ステップ 5: SPでのSAMLアサーション厳密検証合格＆ログイン完了";
                samlNormalXmlContainer.style.display = "block";
                samlTamperContainer.style.display = "none";
                btnSamlNext.disabled = true;
                btnSamlNext.innerText = "ログイン完了";
                samlPacketCode.innerHTML = highlightXML(currentResponseXml);
            }
        }

        // Verify SAML XML via FastAPI
        async function runVerification() {
            const tamperedXml = samlResponseTextarea.value;
            currentResponseXml = tamperedXml;
            spVerificationCard.style.display = "block";
            
            const ids = ["signature", "conditions", "audience", "in-response-to", "recipient"];
            ids.forEach(id => {
                const el = document.getElementById("badge-" + id);
                el.innerText = "検証中...";
                el.style.background = "#b45309";
                el.style.color = "#fef3c7";
            });
            
            try {
                const data = await app.apiCall("/api/saml/verify", "POST", {
                    saml_response_xml: tamperedXml,
                    expected_in_response_to: authRequestId,
                    time_offset_seconds: 0
                });
                
                updateChecklist(data.checks);
                
                samlVerificationResultBox.style.display = "block";
                if (data.success) {
                    samlVerificationResultBox.style.background = "rgba(16, 185, 129, 0.1)";
                    samlVerificationResultBox.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                    samlVerificationResultBox.style.color = "#34d399";
                    samlVerificationResultBox.innerHTML = `
                        <strong>🎉 検証合格: ユーザー認証成功！</strong><br>
                        SPはアサーションが完全に信頼できると判断しました。ログインを許可します。<br>
                        ・NameID: <code>${data.user_info.username}</code><br>
                        ・Affiliation (所属): <code>${data.user_info.role}</code><br>
                        ・Email: <code>${data.user_info.email}</code>
                    `;
                    
                    btnSamlNext.disabled = false;
                    samlStepExplanation.innerHTML = `
                        <span style="color: #34d399;">🟢 <strong>アサーションは検証をパスしました！</strong></span><br>
                        改ざんされずにSPのACSへ届いたため、5つの検証基準（署名・有効期限・Audience・InResponseTo・Recipient）をすべて満たしました。<br>
                        左の「次のステップへ進む」を押してフローを完了させてください。
                    `;
                } else {
                    samlVerificationResultBox.style.background = "rgba(239, 68, 68, 0.1)";
                    samlVerificationResultBox.style.border = "1px solid rgba(239, 68, 68, 0.3)";
                    samlVerificationResultBox.style.color = "#f87171";
                    
                    let errorCause = "";
                    if (data.overall_status === "XML_PARSE_ERROR") {
                        errorCause = `XML解析エラー: ${data.error_message}`;
                    } else {
                        const failedChecks = Object.keys(data.checks).filter(k => data.checks[k].status === "FAILED");
                        errorCause = `以下の検証に失敗しました: ` + failedChecks.map(k => {
                            const labels = {
                                signature: "デジタル署名",
                                conditions: "有効期限",
                                audience: "宛先(Audience)",
                                in_response_to: "リプレイ攻撃(InResponseTo)",
                                recipient: "受信エンドポイント(Recipient)"
                            };
                            return `<strong>${labels[k]}</strong>`;
                        }).join(', ');
                    }

                    samlVerificationResultBox.innerHTML = `
                        <strong>❌ 検証不合格: ログイン拒否！</strong><br>
                        受信したアサーションの一部にエラーがあるため、SPは認証を拒否しました。<br>
                        ・理由: ${errorCause}
                    `;
                    
                    btnSamlNext.disabled = true;
                    samlStepExplanation.innerHTML = `
                        <span style="color: #f87171;">🔴 <strong>SPによってアサーションが不正であると検知されました。</strong></span><br>
                        SPは不正なアサーションを決して信頼しません。右下の個別検証項目から、どの条件が失敗したかを確認し、XMLの内容を修正して「検証実行」を再試行するか、「正常なXMLに戻す」を押してください。
                    `;
                }
                
            } catch (error) {
                window.logToConsole('error', '検証の実行中にエラーが発生しました', error.message);
            }
        }

        // Helper to update check badges style
        function updateChecklist(checks) {
            const keys = ["signature", "conditions", "audience", "in_response_to", "recipient"];
            keys.forEach(k => {
                const badge = document.getElementById("badge-" + k.replace(/_/g, '-'));
                const detail = document.getElementById("detail-" + k.replace(/_/g, '-'));
                const check = checks[k];
                
                if (check) {
                    if (check.status === "SUCCESS") {
                        badge.innerText = "合格 (OK)";
                        badge.style.background = "rgba(16, 185, 129, 0.2)";
                        badge.style.color = "#34d399";
                        badge.style.border = "1px solid rgba(16, 185, 129, 0.4)";
                        detail.innerText = "✔️ " + check.msg;
                        detail.style.color = "#a7f3d0";
                    } else {
                        badge.innerText = "不合格 (NG)";
                        badge.style.background = "rgba(239, 68, 68, 0.2)";
                        badge.style.color = "#f87171";
                        badge.style.border = "1px solid rgba(239, 68, 68, 0.4)";
                        detail.innerText = "❌ " + check.msg;
                        detail.style.color = "#fca5a5";
                    }
                } else {
                    badge.innerText = "未実施";
                    badge.style.background = "#374151";
                    badge.style.color = "#d1d5db";
                    detail.innerText = "";
                }
            });
        }

        // Tamper actions
        btnTamperSignature.addEventListener("click", () => {
            let xml = samlResponseTextarea.value;
            xml = xml.replace(/<ds:SignatureValue>([^<]+)<\/ds:SignatureValue>/, (match, p1) => {
                const corrupted = p1[0] === 'A' ? 'B' : 'A';
                return `<ds:SignatureValue>${corrupted}${p1.substring(1)}</ds:SignatureValue>`;
            });
            samlResponseTextarea.value = xml;
            window.logToConsole('system', '署名データ（SignatureValue）を1文字書き換えました。これによりデジタル署名の整合性が破壊されます。');
        });

        btnTamperExpiry.addEventListener("click", () => {
            let xml = samlResponseTextarea.value;
            const pastStart = new Date(Date.now() - 3600000 * 2).toISOString();
            const pastEnd = new Date(Date.now() - 3600000).toISOString();
            
            xml = xml.replace(/NotBefore="[^"]+"/, `NotBefore="${pastStart}"`);
            xml = xml.replace(/NotOnOrAfter="[^"]+"/, `NotOnOrAfter="${pastEnd}"`);
            samlResponseTextarea.value = xml;
            window.logToConsole('system', 'アサーションの有効期間（Conditions）を「過去」に書き換えました。有効期限切れのエラーがシミュレートされます。');
        });

        btnTamperAudience.addEventListener("click", () => {
            let xml = samlResponseTextarea.value;
            xml = xml.replace(/<saml:Audience>[^<]+<\/saml:Audience>/, '<saml:Audience>https://fake.another-sp.com/saml2</saml:Audience>');
            samlResponseTextarea.value = xml;
            window.logToConsole('system', 'SAMLAssertionの対象宛先（Audience）を別のSPのURLに変更しました。アサーション再利用攻撃の防御フローを検証できます。');
        });

        btnTamperRole.addEventListener("click", () => {
            let xml = samlResponseTextarea.value;
            xml = xml.replace(/<saml:AttributeValue>student<\/saml:AttributeValue>/, '<saml:AttributeValue>faculty</saml:AttributeValue>');
            samlResponseTextarea.value = xml;
            window.logToConsole('system', '属性証明書（eduPersonAffiliation）の値をstudent（学生）からfaculty（教員）へ昇格改ざんしました。デジタル署名対象のデータを変更したため、署名検証エラーも同時にトリガーされます。');
        });

        btnTamperRestore.addEventListener("click", () => {
            samlResponseTextarea.value = originalResponseXml;
            window.logToConsole('system', 'IdPが生成した正常なSAMLResponse XMLへ復元しました。');
        });

        btnExecuteVerify.addEventListener("click", () => {
            runVerification();
        });

        btnSamlNext.addEventListener("click", () => {
            if (currentStep < 5) {
                nextStep();
            }
        });
        
        btnSamlReset.addEventListener("click", () => {
            resetFlow();
            window.logToConsole('system', 'SAML学習フローを初期化しました。');
        });

        // Initialize state
        resetFlow();
    }
};
