/**
 * セキスペ・セキュリティ・ラボ
 * メインアプリケーション制御 (main.js)
 * 拡張性に優れた動的スクリプト・テンプレートローダーを実装しています。
 */

// Global namespace for learning modules
window.SecurityLabModules = {};

document.addEventListener("DOMContentLoaded", () => {
    const app = new SecurityLab();
    app.init();
});

class SecurityLab {
    constructor() {
        this.modules = [];
        this.activeModuleId = null;
        this.consoleActive = false;
        this.isResizing = false;
        this.consoleHeight = 240; // Default height from CSS var
        
        // DOM Elements
        this.navMenu = document.getElementById("navMenu");
        this.welcomeTab = document.getElementById("welcomeTab");
        this.labContainer = document.getElementById("labContainer");
        this.welcomeGrid = document.getElementById("welcomeGrid");
        this.moduleTitle = document.getElementById("moduleTitle");
        this.moduleDesc = document.getElementById("moduleDesc");
        this.contentBody = document.getElementById("contentBody");
        
        this.logConsole = document.getElementById("logConsole");
        this.consoleBody = document.getElementById("consoleBodyText");
        this.toggleConsoleBtn = document.getElementById("toggleConsoleBtn");
        this.clearConsoleBtn = document.getElementById("clearConsoleBtn");
        this.closeConsoleBtn = document.getElementById("closeConsoleBtn");
        this.resizeHandle = document.getElementById("consoleResizeHandle");
    }

    async init() {
        this.setupConsole();
        this.setupKeyboardShortcuts();
        
        try {
            await this.loadModulesList();
            this.renderNavigation();
            this.renderWelcomeGrid();
            this.renderQuickReference();
        } catch (error) {
            this.log('error', 'モジュール一覧の取得に失敗しました。サーバーが起動しているか確認してください。', error);
        }
    }

    // Load registered modules from FastAPI
    async loadModulesList() {
        const response = await fetch("/api/modules");
        if (!response.ok) throw new Error("HTTP error " + response.status);
        this.modules = await response.json();
        this.log('system', `サーバーから ${this.modules.length} 個のモジュール定義をロードしました。`);
    }

    // Render left navigation menu
    renderNavigation() {
        this.navMenu.innerHTML = "";
        
        // Add Dashboard link
        const dashItem = document.createElement("a");
        dashItem.className = "nav-item active";
        dashItem.dataset.id = "dashboard";
        dashItem.innerHTML = `<span class="icon">📊</span> ダッシュボード`;
        dashItem.addEventListener("click", () => this.switchTab("dashboard"));
        this.navMenu.appendChild(dashItem);
        
        // Add each module
        this.modules.forEach(mod => {
            const item = document.createElement("a");
            item.className = "nav-item";
            item.dataset.id = mod.id;
            
            // Assign icons based on module ID
            let icon = "⚙️";
            if (mod.id === "hashing") icon = "🔑";
            else if (mod.id === "jwt") icon = "🎟️";
            else if (mod.id === "mfa") icon = "📱";
            else if (mod.id === "oauth") icon = "🤝";
            else if (mod.id === "crypto") icon = "🔐";
            
            item.innerHTML = `<span class="icon">${icon}</span> ${mod.title}`;
            item.addEventListener("click", () => this.switchTab(mod.id));
            this.navMenu.appendChild(item);
        });
    }

    // Render grid list on the dashboard
    renderWelcomeGrid() {
        this.welcomeGrid.innerHTML = "";
        this.modules.forEach(mod => {
            const card = document.createElement("div");
            card.className = "module-card";
            
            let icon = "⚙️";
            if (mod.id === "hashing") icon = "🔑";
            else if (mod.id === "jwt") icon = "🎟️";
            else if (mod.id === "mfa") icon = "📱";
            else if (mod.id === "oauth") icon = "🤝";
            else if (mod.id === "crypto") icon = "🔐";
            
            card.innerHTML = `
                <div class="module-card-header">
                    <span class="module-card-icon">${icon}</span>
                </div>
                <h4>${mod.title}</h4>
                <p>${mod.description}</p>
                <div class="module-card-footer">
                    <span>ラボを開始する</span>
                    <span>→</span>
                </div>
            `;
            card.addEventListener("click", () => this.switchTab(mod.id));
            this.welcomeGrid.appendChild(card);
        });
    }

    // Render interactive attack quick reference on the dashboard
    renderQuickReference() {
        const container = document.getElementById("quickReferenceContainer");
        if (!container) return;
        
        container.innerHTML = "";
        
        const attacks = [
            {
                title: "💥 辞書攻撃 (Dictionary Attack)",
                moduleId: "hashing",
                attack: "漏洩したハッシュ値に対して、よく使われるパスワードリスト（辞書）を順次ハッシュ化して突き合わせることで、元のパスワードを解読する手法。",
                defense: "故意に計算を遅くする<b>「ストレッチング（bcrypt等の鍵伸張関数）」</b>の導入と、同一パスワードから同一ハッシュが生まれるのを防ぐ<b>「ソルト (Salt) の追加」</b>が有効です。",
                exam: "レインボーテーブル（事前計算ハッシュテーブル）への有効な防御策として<b>「ソルトの付与」</b>が頻繁に正解選択肢になります。"
            },
            {
                title: "🎟️ JWT改ざん ＆ alg: none 脆弱性",
                moduleId: "jwt",
                attack: "クライアント側で保持されるJWTを改ざんし、一般権限を管理者権限（role: adminなど）に書き換える、あるいはヘッダーの署名アルゴリズムを `none` に設定して署名を削除することで、サーバーの署名検証ロジックをバイパスする手法。",
                defense: "サーバー側で受け取ったJWTの署名を<b>必ず秘密鍵または公開鍵で検証</b>すること、および <b>`alg: none` のトークンを明示的に拒否（不許可）</b>するようにライブラリを設定します。",
                exam: "JWTはBase64URLで符号化されているだけで暗号化はされていないため<b>「第三者に中身を盗み見られても良い情報のみを載せる」</b>こと、および `alg` ヘッダーを信頼せずサーバー側で検証アルゴリズムを固定することが重要です。"
            },
            {
                title: "📱 パスワード漏洩 ➔ なりすましログイン",
                moduleId: "mfa",
                attack: "ID/パスワード（知識情報）のみの認証プロセスにおいて、フィッシング詐欺やパスワードリスト攻撃によって資格情報が漏洩した場合、悪意ある第三者が正規ユーザーになりすましてログインを突破する手法。",
                defense: "ID/パスワードに加え、スマートフォン等で一時的に生成される30秒間のみ有効なワンタイムパスワード（所有物情報）を追加する <b>「多要素認証 (TOTP)」</b> を導入します。",
                exam: "認証の3要素である<b>「知識（パスワード）」「所有（スマホ、ICカード）」「生体（指紋、顔）」</b>のうち、2つ以上の異なる要素を組み合わせる認証方式（多要素認証）の定義が問われます。"
            },
            {
                title: "🤝 クロスサイトリクエストフォージェリ (CSRF) (OAuth連携時)",
                moduleId: "oauth",
                attack: "認可プロセス中、攻撃者が用意したログイン連携URLを被害者のブラウザで強制的に踏ませることで、被害者のアプリセッションと攻撃者のアカウントを紐付け（ソーシャルログインの悪用）、アカウントを乗っ取る手法。",
                defense: "認可要求のパラメータに暗号論的なランダム文字列である <b>`state`</b> パラメータを含め、リダイレクト戻り時にセッションで保持した元の値と一致するかを厳密に検証します。",
                exam: "OAuth 2.0におけるCSRF脆弱性の防止には、クライアントが生成する <b>`state` パラメータ</b> の検証が根本的な対策として出題されます。"
            },
            {
                title: "🔑 認可コード横取り攻撃 (OAuthパブリッククライアント)",
                moduleId: "oauth",
                attack: "モバイルアプリなど、クライアントシークレットを安全に保持できないパブリッククライアントにおいて、リダイレクトURI（カスタムURLスキーム等）を通じて認可サーバーから返却された「認可コード」を、悪意ある別のアプリが横取りしてアクセストークンを不正取得する手法。",
                defense: "認可要求時にクライアント側で生成したランダムな一時キーのハッシュ値（`code_challenge`）を送り、トークン交換時に生キー（`code_verifier`）を検証する <b>「PKCE (Proof Key for Code Exchange)」</b> を有効化します。",
                exam: "ネイティブアプリ等のパブリッククライアントで認可コードフローを安全に実行するための必須規格として、<b>PKCE</b> がよく問われます。"
            },
            {
                title: "🔐 通信路上でのデータの盗聴・改ざん (アプリケーション層)",
                moduleId: "crypto",
                attack: "暗号化されていない、あるいは整合性チェックのない通信路上において、機密データを第三者が盗み取る、または転送中のデータを改変して意図しない動作を引き起こす手法。",
                defense: "共通鍵暗号方式で暗号化と改ざん検知を同時に高速処理する <b>「AES-GCM（認証付き暗号: AEAD）」</b> や、公開鍵暗号とハッシュを用いた <b>「デジタル署名」</b> で改ざん防止・送信元認証・否認防止を行います。",
                exam: "デジタル署名では<b>「送信者の秘密鍵でハッシュ化されたメッセージダイジェストを暗号化」</b>し、受信者は<b>「送信者の公開鍵で復号」</b>して検証することにより、改ざん防止および「否認防止」を実現します。"
            },
            {
                title: "🧱 ポートスキャン (L4 探索)",
                moduleId: "network",
                attack: "ターゲットサーバーの各ポート（0〜65535）に対してパケットを連続送信し、どのサービス（ポート）がオープン（稼働中）か、OSの種類などを調査してその後の攻撃の糸口を探る手法。",
                defense: "<b>ファイアウォール (FW)</b> をネットワーク境界に設置し、不要なポート（SSH用の22、データベースポートなど）への外部アクセスを「拒否 (DROP / REJECT)」し、検出情報を最小限に抑えます。",
                exam: "ポートスキャンは攻撃の「事前準備段階（フットプリンティング）」に分類され、FWによってトランスポート層（L4）レベルでポートごとの遮断ポリシーを設計することが求められます。"
            },
            {
                title: "👁️ OSコマンドインジェクション (L7 OS層攻撃)",
                moduleId: "network",
                attack: "Webアプリのパラメータ（入力値）に、OSのシェルコマンドを解釈可能なメタ文字（`;` や `&` など）を混入させ、Webサーバーの権限で任意の不正コマンドを実行させる手法。",
                defense: "<b>IDS/IPS（侵入検知・防止システム）</b>でパケットデータ部（L7シグネチャ）に含まれる `rm -rf` や `powershell` などの不正パターンを検知・遮断し、アプリ側では外部プログラムを直接起動する関数の使用を避けます。",
                exam: "IDS/IPSは、OSレベルの脆弱性を狙うワームやコマンドインジェクション等の攻撃に対し、ネットワーク層からアプリケーション層に至るシグネチャベースの防御を提供します。"
            },
            {
                title: "🛡️ SQLインジェクション (SQLi) (L7 データベース層攻撃)",
                moduleId: "vuln",
                attack: "入力値にSQL構文を混入させ、アプリのSQL問い合わせロジックを改ざんして、データベースの不正閲覧・更新・削除や認証回避を達成する手法。",
                defense: "SQL文のコンパイル（構文解析）をパラメータ流し込み前に確定させる <b>「静的プレースホルダ（バインド変数）」</b> の使用を徹底し、入力値を直接SQL文と文字列結合することを完全に排除します。",
                exam: "SQLインジェクションの根本対策として、セキスペでは「静的プレースホルダ（プレコンパイルプレースホルダ）の使用」が最重要対策として繰り返し問われます。"
            },
            {
                title: "🛡️ クロスサイトスクリプティング (XSS) (L7 アプリ層攻撃)",
                moduleId: "vuln",
                attack: "Webアプリの入力欄やURLパラメータに <code>&lt;script&gt;</code> 等の悪意あるHTMLコードを注入し、それをブラウザに出力させることで、ページを閲覧した別ユーザーのブラウザ上で不正スクリプトを実行し、Cookie（セッションID）の窃取やページの改ざんを行う手法。",
                defense: "ブラウザにとって特別な意味を持つ文字（`&lt;`, `&gt;`, `&quot;`, `&#x27;` など）を出力時に <b>「HTMLエスケープ (サニタイズ)」</b> し、無害な文字列に変換します。また、セッションCookieに `HttpOnly` 属性を付与します。",
                exam: "XSSの根本対策は<b>「出力する全ての箇所で適切なHTMLエスケープを行うこと」</b>です。また、CookieからセッションIDがJavaScriptで窃取されるのを防ぐために <b>`HttpOnly` 属性</b> を有効にする対策が有効です。"
            },
            {
                title: "🔑 リプレイ攻撃 (Kerberos等へのなりすまし)",
                moduleId: "kerberos",
                attack: "ネットワーク上を流れる暗号化された認証情報（チケットや認証メッセージ）を攻撃者が盗聴・コピーし、それをそのままサーバーに再送信することで、正規ユーザーになりすまして認証を突破する手法。",
                defense: "認証用パケットに <b>「タイムスタンプ (Timestamp)」</b> を含め、サーバー側で受信した時刻と比較して短時間（一般的には5分以内）のみの有効期限とすることで、後からの再送信を無効化します。",
                exam: "Kerberos認証などで用いられるリプレイ攻撃対策の代表は<b>「タイムスタンプによる有効期限の検証」</b>であり、時刻の同期（NTPの使用）が前提条件として問われます。"
            },
            {
                title: "📡 IPパケットの盗聴・改ざん (IP層/ネットワーク層攻撃)",
                moduleId: "ipsec",
                attack: "公衆回線（インターネット）などの中間回線において、通過するIPパケットを生データのまま盗聴する、あるいは内容を改ざんしてパケットを受信者に送信する手法。",
                defense: "IPsecを構築し、<b>ESP (Encapsulating Security Payload)</b> プロトコルによってペイロード部を強力な共通鍵で暗号化し、かつパケット全体の整合性チェックを適用します。",
                exam: "IPsecでは、暗号化と完全性を提供する <b>ESP</b> と、暗号化は行わず完全性・認証のみを提供する <b>AH (Authentication Header)</b> の仕様の違いが出題されます。AHはパケットのグローバルIP等が書き換わるNAT変換環境下では、ヘッダーの整合性エラーが発生するため使用できない性質が重要です。"
            }
        ];
        
        attacks.forEach(att => {
            const card = document.createElement("details");
            card.className = "ref-card";
            
            card.innerHTML = `
                <summary class="ref-summary">${att.title}</summary>
                <div class="ref-content">
                    <div class="ref-attack">
                        <b>📌 攻撃の概要:</b><br>
                        ${att.attack}
                    </div>
                    <div class="ref-defense">
                        <b>🛡️ 根本的な防衛策 (セキスペ基本):</b><br>
                        ${att.defense}
                    </div>
                    <div class="ref-exam-focus">
                        <b>💡 試験対策ポイント:</b><br>
                        ${att.exam}
                    </div>
                    <div class="ref-footer">
                        <button class="ref-btn" data-module="${att.moduleId}">
                            <span>🛠️ 対応する学習ラボを開く</span>
                            <span>➔</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Add navigation handler to the button inside the details
            const btn = card.querySelector(".ref-btn");
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent closing/opening accordion
                this.switchTab(att.moduleId);
                // Scroll top smoothly to allow user to see the lab beginning
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
            
            container.appendChild(card);
        });
    }

    // Switch active tab/module
    async switchTab(id) {
        // Update nav UI active class
        document.querySelectorAll(".nav-item").forEach(item => {
            if (item.dataset.id === id) item.classList.add("active");
            else item.classList.remove("active");
        });
        
        if (id === "dashboard") {
            this.welcomeTab.style.display = "flex";
            this.labContainer.style.display = "none";
            this.moduleTitle.innerText = "ダッシュボード";
            this.moduleDesc.innerText = "認証とセキュリティ技術の体系的な学習プラットフォーム";
            this.activeModuleId = null;
            return;
        }
        
        const mod = this.modules.find(m => m.id === id);
        if (!mod) return;
        
        this.welcomeTab.style.display = "none";
        this.labContainer.style.display = "flex";
        this.moduleTitle.innerText = mod.title;
        this.moduleDesc.innerText = mod.description;
        
        this.activeModuleId = id;
        this.labContainer.innerHTML = `<div class="nav-loading">実験モジュール「${mod.title}」を読み込み中...</div>`;
        
        try {
            await this.loadModuleScript(mod);
            this.renderModule(mod);
        } catch (error) {
            this.labContainer.innerHTML = `
                <div class="status-indicator error" style="padding: 20px; text-align: center;">
                    <h3>モジュールのロード中にエラーが発生しました</h3>
                    <p>${error.message}</p>
                </div>
            `;
            this.log('error', `モジュール [${id}] のロードに失敗しました。`, error);
        }
    }

    // Dynamic Script Loader
    loadModuleScript(mod) {
        return new Promise((resolve, reject) => {
            // If already loaded in namespace
            if (window.SecurityLabModules[mod.id]) {
                resolve();
                return;
            }
            
            // Append script element to body
            const script = document.createElement("script");
            script.src = `/static/js/${mod.jsFile}`;
            script.type = "text/javascript";
            script.async = true;
            
            script.onload = () => {
                if (window.SecurityLabModules[mod.id]) {
                    this.log('system', `モジュールスクリプト Loaded: ${mod.jsFile}`);
                    resolve();
                } else {
                    reject(new Error(`スクリプトはロードされましたが、window.SecurityLabModules["${mod.id}"] が見つかりません。`));
                }
            };
            
            script.onerror = () => {
                reject(new Error(`スクリプトの取得に失敗しました: /static/js/${mod.jsFile}`));
            };
            
            document.body.appendChild(script);
        });
    }

    // Render loaded module html and run init
    renderModule(mod) {
        const modObj = window.SecurityLabModules[mod.id];
        if (!modObj) return;
        
        // Define Glossary Search Box HTML
        const glossaryHtml = `
            <div class="card glossary-search-card" style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">📖</span>
                        <h3 style="border-bottom: none; padding-bottom: 0; font-size: 14px; font-weight: 600; margin: 0; color: var(--text-primary);">セキスペ試験対策・用語検索</h3>
                    </div>
                    <span style="font-size: 11px; color: var(--text-secondary); background-color: var(--bg-card); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">全 ${window.SecurityGlossary ? window.SecurityGlossary.length : 0} 単語</span>
                </div>
                <div class="inline-group" style="margin-top: 12px;">
                    <input type="text" class="glossary-search-input" placeholder="意味を調べたいセキュリティ用語を入力（例: JWT, ソルト, PKCE, デジタル署名...）" style="width: 100%;">
                </div>
                <div class="glossary-results" style="display: none;"></div>
            </div>
        `;
        
        // Insert module html template with Glossary prepended
        this.labContainer.innerHTML = glossaryHtml + modObj.html;
        
        // Initialize glossary search handlers
        this.initGlossarySearch();
        
        // Run module initialization logic
        try {
            modObj.init(this);
            this.log('system', `実験環境「${mod.title}」を初期化しました。`);
        } catch (e) {
            this.log('error', `モジュールの初期化中にエラーが発生しました: ${e.message}`, e);
        }
    }

    initGlossarySearch() {
        const searchInput = this.labContainer.querySelector(".glossary-search-input");
        const resultsContainer = this.labContainer.querySelector(".glossary-results");
        
        if (!searchInput || !resultsContainer || !window.SecurityGlossary) return;
        
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            
            if (query === "") {
                resultsContainer.innerHTML = "";
                resultsContainer.style.display = "none";
                return;
            }
            
            // Filter glossary
            const filtered = window.SecurityGlossary.filter(item => {
                return item.term.toLowerCase().includes(query) || 
                       item.definition.toLowerCase().includes(query) ||
                       item.keywords.some(kw => kw.toLowerCase().includes(query));
            });
            
            resultsContainer.style.display = "flex";
            resultsContainer.innerHTML = "";
            
            if (filtered.length === 0) {
                resultsContainer.innerHTML = `<div class="glossary-no-results">「${searchInput.value}」に一致する用語は見見つかりませんでした。</div>`;
                return;
            }
            
            filtered.forEach(item => {
                const div = document.createElement("div");
                div.className = "glossary-item";
                
                // Highlight match in term name if possible
                let termHtml = item.term;
                const reg = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
                termHtml = termHtml.replace(reg, `<mark style="background-color: rgba(99, 102, 241, 0.4); color: white; border-radius: 2px; padding: 0 2px;">$1</mark>`);
                
                div.innerHTML = `
                    <div class="glossary-term">📖 ${termHtml}</div>
                    <div class="glossary-definition">${item.definition}</div>
                    ${item.exam_tip ? `<div class="glossary-exam-tip"><b>💡 試験対策ポイント:</b> ${item.exam_tip}</div>` : ""}
                `;
                resultsContainer.appendChild(div);
            });
        });
    }

    // Console System Methods
    setupConsole() {
        this.toggleConsoleBtn.addEventListener("click", () => this.toggleConsole());
        this.closeConsoleBtn.addEventListener("click", () => this.toggleConsole(false));
        this.clearConsoleBtn.addEventListener("click", () => {
            this.consoleBody.innerHTML = "";
            this.log('system', 'ログをクリアしました。');
        });
        
        // Drag resizing handler
        if (this.resizeHandle) {
            this.resizeHandle.addEventListener("mousedown", (e) => {
                e.preventDefault();
                this.isResizing = true;
                this.logConsole.classList.add("resizing");
                this.resizeHandle.classList.add("active");
                
                document.body.style.userSelect = "none";
                document.body.style.cursor = "ns-resize";
                
                const onMouseMove = (moveEvent) => {
                    if (!this.isResizing) return;
                    
                    let newHeight = window.innerHeight - moveEvent.clientY;
                    
                    // Clamp height between 100px and 80% of window height
                    const maxHeight = window.innerHeight * 0.8;
                    if (newHeight < 100) newHeight = 100;
                    if (newHeight > maxHeight) newHeight = maxHeight;
                    
                    this.consoleHeight = newHeight;
                    this.logConsole.style.height = newHeight + "px";
                    
                    // Keep layout padding synchronized
                    if (this.consoleActive) {
                        this.contentBody.style.paddingBottom = newHeight + "px";
                    }
                };
                
                const onMouseUp = () => {
                    this.isResizing = false;
                    this.logConsole.classList.remove("resizing");
                    this.resizeHandle.classList.remove("active");
                    
                    document.body.style.userSelect = "";
                    document.body.style.cursor = "";
                    
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                };
                
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });
        }
        
        // Attach log function to window for global access
        window.logToConsole = (type, message, details) => this.log(type, message, details);
    }

    toggleConsole(forceState) {
        this.consoleActive = forceState !== undefined ? forceState : !this.consoleActive;
        if (this.consoleActive) {
            this.logConsole.classList.add("active");
            this.contentBody.style.paddingBottom = this.consoleHeight + "px";
        } else {
            this.logConsole.classList.remove("active");
            this.contentBody.style.paddingBottom = "80px"; // Reset to default padding
        }
    }

    setupKeyboardShortcuts() {
        // Toggle console with Ctrl + ` (backtick)
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "`") {
                e.preventDefault();
                this.toggleConsole();
            }
        });
    }

    log(type, message, details = null) {
        const line = document.createElement("div");
        line.className = `console-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        let prefix = `[${timestamp}] [${type.toUpperCase()}] `;
        
        let textContent = prefix + message;
        
        if (details) {
            if (details instanceof Error) {
                textContent += `\nError Stack:\n${details.stack}`;
            } else if (typeof details === 'object') {
                textContent += `\nPayload:\n${JSON.stringify(details, null, 2)}`;
            } else {
                textContent += `\nDetails: ${details}`;
            }
        }
        
        line.textContent = textContent;
        this.consoleBody.appendChild(line);
        
        // Auto scroll to bottom
        this.consoleBody.scrollTop = this.consoleBody.scrollHeight;
    }

    // Helper for modules to make API fetch calls with console logging
    async apiCall(url, method = "GET", body = null) {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        // Log request
        this.log('request', `FETCH ${method} ${url}`, body);

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            // Log response
            if (response.ok) {
                this.log('response', `RESPONSE ${response.status} ${url}`, data);
                return data;
            } else {
                this.log('error', `ERROR RESPONSE ${response.status} ${url}`, data);
                throw new Error(data.detail || `HTTP Error ${response.status}`);
            }
        } catch (e) {
            if (e.message.indexOf("HTTP Error") === -1 && e.message.indexOf("detail") === -1) {
                this.log('error', `NETWORK FAILED ${url}`, e.message);
            }
            throw e;
        }
    }
}
