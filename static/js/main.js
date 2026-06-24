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
        
        // DOM Elements
        this.navMenu = document.getElementById("navMenu");
        this.welcomeTab = document.getElementById("welcomeTab");
        this.labContainer = document.getElementById("labContainer");
        this.welcomeGrid = document.getElementById("welcomeGrid");
        this.moduleTitle = document.getElementById("moduleTitle");
        this.moduleDesc = document.getElementById("moduleDesc");
        
        this.logConsole = document.getElementById("logConsole");
        this.consoleBody = document.getElementById("consoleBodyText");
        this.toggleConsoleBtn = document.getElementById("toggleConsoleBtn");
        this.clearConsoleBtn = document.getElementById("clearConsoleBtn");
        this.closeConsoleBtn = document.getElementById("closeConsoleBtn");
    }

    async init() {
        this.setupConsole();
        this.setupKeyboardShortcuts();
        
        try {
            await this.loadModulesList();
            this.renderNavigation();
            this.renderWelcomeGrid();
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
        
        // Insert module html template
        this.labContainer.innerHTML = modObj.html;
        
        // Run module initialization logic
        try {
            modObj.init(this);
            this.log('system', `実験環境「${mod.title}」を初期化しました。`);
        } catch (e) {
            this.log('error', `モジュールの初期化中にエラーが発生しました: ${e.message}`, e);
        }
    }

    // Console System Methods
    setupConsole() {
        this.toggleConsoleBtn.addEventListener("click", () => this.toggleConsole());
        this.closeConsoleBtn.addEventListener("click", () => this.toggleConsole(false));
        this.clearConsoleBtn.addEventListener("click", () => {
            this.consoleBody.innerHTML = "";
            this.log('system', 'ログをクリアしました。');
        });
        
        // Attach log function to window for global access
        window.logToConsole = (type, message, details) => this.log(type, message, details);
    }

    toggleConsole(forceState) {
        this.consoleActive = forceState !== undefined ? forceState : !this.consoleActive;
        if (this.consoleActive) {
            this.logConsole.classList.add("active");
        } else {
            this.logConsole.classList.remove("active");
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
