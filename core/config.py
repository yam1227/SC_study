# Module registry & static configuration

MODULES = [
    {
        "id": "block_cipher",
        "title": "ブロック暗号 ＆ 暗号利用モード (CTR / CBC / ECB / GCM)",
        "description": "ブロック暗号の構造、利用モード (CTR, CBC, ECB, GCM) の違い、鍵ストリーム ⊕ 入力のXOR処理、パディング、並列処理可否、誤り伝搬を学びます。",
        "jsFile": "lab_block_cipher.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "長大なメッセージをブロック単位で暗号化する『暗号利用モード (Cipher Operation Mode)』のメカニズムを比較・可視化します。令和5年春期 午前Ⅱ 問7で問われた CTR(Counter)モードの特徴（鍵ストリームと入力の排他的論理和、パディング不要、暗号化・復号の完全並列実行）や、CBCモードのビット誤り伝搬、ECBモードのパターン露出危険性をビジュアル体験します。",
        "keywords": ["ブロック暗号", "暗号利用モード", "CTRモード", "CBCモード", "ECBモード", "GCMモード", "鍵ストリーム", "排他的論理和 (XOR)", "並列処理", "ビット誤り伝搬", "パディング"]
    },
    {
        "id": "mac",
        "title": "メッセージ認証符号 (MAC) ＆ デジタル署名",
        "description": "MAC (HMAC/CMAC) の仕組み、改ざん検知・共通鍵による送信元認証、およびデジタル署名（否認防止・第三者検証）との違いを学びます。",
        "jsFile": "lab_mac.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "通信メッセージの「完全性（Integrity）」と「送信元認証（Authenticity）」を保証する メッセージ認証符号 (MAC) のメカニズムを可視化します。共通鍵を使用するMACと、送信者の秘密鍵・公開鍵を使用する「デジタル署名」との決定的な違い（第三者への証明・否認防止の有無）を徹底対比します。",
        "keywords": ["メッセージ認証符号 (MAC)", "HMAC", "CMAC", "完全性", "送信元認証", "否認防止 (Non-repudiation)", "共通鍵", "デジタル署名"]
    },
    {
        "id": "hashing",
        "title": "パスワードハッシュ化＆ソルト",
        "description": "SHA-256 vs bcrypt の比較、辞書攻撃シミュレーションを通じて、ソルトとストレッチングの重要性を学びます。",
        "jsFile": "lab_hashing.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "パスワードを安全に保存するためのハッシュ化アルゴリズム（SHA-256、bcrypt）の違いや、レインボーテーブル・辞書攻撃を防ぐ「ソルト（Salt）」および「ストレッチング」の重要性を学びます。",
        "keywords": ["ハッシュ関数", "SHA-256", "bcrypt", "ソルト (Salt)", "ストレッチング", "辞書攻撃", "ストレージコスト"]
    },
    {
        "id": "jwt",
        "title": "JWTセキュリティ",
        "description": "JWTの構造、改ざん検知、および「alg: none」の脆弱性を体験的に学びます。",
        "jsFile": "lab_jwt.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Web API等で広く使われるJWT (JSON Web Token) のデータ構造を学びます。トークン改ざん検知の仕組みや、署名アルゴリズムを `none` に書き換える脆弱性（alg: none 脆弱性）を実際に再現し、正しい署名検証による防御方法を学習します。",
        "keywords": ["JWT (JSON Web Token)", "署名 (Signature)", "改ざん検知", "alg: none 脆弱性", "Base64url"]
    },
    {
        "id": "mfa",
        "title": "ワンタイムパスワード（OTP）",
        "description": "TOTPの仕組み、共有鍵、30秒有効期間の計算、QRコード連携を学びます。",
        "jsFile": "lab_mfa.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "ワンタイムパスワード（OTP）を用いた多要素認証について学びます。認証アプリで使われる時間ベースのワンタイムパスワード（TOTP）の生成ロジック（共有鍵と時間から算出する仕組み）を可視化し、実際の Authenticator アプリとの同期を検証します。",
        "keywords": ["MFA (多要素認証)", "TOTP", "HOTP", "共有鍵 (Base32)", "Unix Time (30秒制限)"]
    },
    {
        "id": "oauth",
        "title": "OAuth 2.0 / OIDC フロー",
        "description": "認可コードフローや state パラメータによるCSRF対策をインタラクティブに学びます。",
        "jsFile": "lab_oauth.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "外部サービス間で権限を安全に委譲する OAuth 2.0 / OpenID Connect (OIDC) の動作フローを学びます。代表的な『認可コードフロー』を順を追って実行し、セキュリティ対策パラメータ `state`（CSRF対策）や `nonce`（リプレイ攻撃対策）の重要性を学習します。",
        "keywords": ["OAuth 2.0", "OIDC (OpenID Connect)", "認可コードフロー", "state パラメータ (CSRF対策)", "nonce パラメータ"]
    },
    {
        "id": "crypto",
        "title": "暗号化＆デジタル署名",
        "description": "AES（共通鍵）とRSA（公開鍵）の使い分け、デジタル署名による改ざん検知を学びます。",
        "jsFile": "lab_crypto.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "現代のセキュリティの基盤となる暗号技術を学びます。共通鍵暗号（AES-GCM）での暗号化・復号、公開鍵暗号（RSA）を用いた鍵ペア生成と暗号化、さらに送信元の証明と改ざん防止を行う『デジタル署名』の仕組みを検証します。",
        "keywords": ["共通鍵暗号 (AES)", "公開鍵暗号 (RSA)", "ハイブリッド暗号", "デジタル署名", "改ざん検知"]
    },
    {
        "id": "network",
        "title": "FW / IDS・IPS / WAF 使い分け",
        "description": "ファイアウォール、IDS/IPS、WAFのそれぞれの処理レイヤーや防御対象の違いを体系的に学びます。",
        "jsFile": "lab_network.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "ネットワークやアプリケーションを防御するための3つの主要防御機器（ファイアウォール、IDS/IPS、WAF）の動作レイヤーと防衛対象の違いを学びます。境界防衛シミュレータを使用し、パケットの種類に応じてどの機器がどのように機能するかを可視化します。",
        "keywords": ["ファイアウォール (L4)", "IDS/IPS (L7 シグネチャ)", "WAF (L7 HTTP)", "ポートスキャン", "SQLi/XSS"]
    },
    {
        "id": "vuln",
        "title": "Web脆弱性攻撃と防衛 (SQLi / XSS)",
        "description": "SQLインジェクションやクロスサイトスクリプティング（XSS）の脆弱性と、セキュアコーディングでの防御を体験します。",
        "jsFile": "lab_vuln.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Webアプリケーションに潜む代表的な脆弱性である SQL インジェクション (SQLi) とクロスサイトスクリプティング (XSS) の動作原理と、その防衛方法を学びます。攻撃リクエストを体験し、ソースコードレベルでのバインド変数使用やサニタイズ（エスケープ）の効果を確認します。",
        "keywords": ["SQLインジェクション (SQLi)", "プレースホルダ (バインド変数)", "クロスサイトスクリプティング (XSS)", "サニタイズ (エスケープ)", "セキュアプログラミング"]
    },
    {
        "id": "email_security",
        "title": "メールセキュリティ・ドメイン認証",
        "description": "SMTP/POP3/IMAPの送受信フロー、メールヘッダの構造、およびSPF・DKIM・DMARCドメイン認証の検証プロセスを詳細に学習します。",
        "jsFile": "lab_email_security.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "メールの送受信で使用される各種プロトコルの違いや、メールヘッダの構造（Envelope-FromとHeader Fromの違い）を学びます。さらなりすましメール対策として必須の送信元ドメイン認証技術である『SPF』『DKIM』『DMARC』の仕組みと検証フロー、アライメントチェックの動作をビジュアルシミュレーターで体験します。",
        "keywords": ["SMTP / POP3 / IMAP", "Envelope-From / Header From", "Receivedヘッダ", "SPF (送信IP制限)", "DKIM (電子署名)", "DMARC (アライメントとポリシー)", "SPF/DKIMアライメント"]
    },
    {
        "id": "cookie_security",
        "title": "CookieとWebセキュリティ",
        "description": "Cookieの送受信フロー、主要属性（Secure、HttpOnly、SameSite）の挙動、およびXSSやCSRFなどの攻撃に対する具体的な防御策を詳細に学習します。",
        "jsFile": "lab_cookie_security.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Webアプリケーションでセッション管理等に使われるCookieについて、HTTPリクエスト・レスポンスにおける送受信プロセスをシミュレートします。XSS脆弱性からセッションIDを守る「HttpOnly属性」，盗聴を防ぐ「Secure属性」，別ドメイン発のリクエストによるCSRF攻撃を防ぐ「SameSite属性（Strict/Lax/None）」の違いをビジュアルで学習します。",
        "keywords": ["Cookie", "Set-Cookieヘッダ", "HttpOnly属性 (XSS対策)", "Secure属性", "SameSite属性 (CSRF対策)", "Domain/Path/Max-Age", "セッションハイジャック"]
    },
    {
        "id": "kerberos",
        "title": "認証プロトコル・ログ解析 (Kerberos)",
        "description": "Kerberos認証チケットの発行プロセスと、チケットをデコードした認証ログの解析を学びます。",
        "jsFile": "lab_kerberos.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "Kerberos（ケルベロス）認証の3つのチケット発行フェーズ（AS、TGS、AP）のステップ実行。暗号化された TGT（チケット交付チケット） やサービスチケットの内容、および リプレイ攻撃対策としてのタイムスタンプ を含む生ログのデコード解析。",
        "keywords": ["Kerberos (ケルベロス)", "TGT (チケット交付チケット)", "Authenticator (認証子)", "チケット転送", "リプレイ攻撃対策 (タイムスタンプ)"]
    },
    {
        "id": "ipsec",
        "title": "IPsec構造・IKE交換",
        "description": "IPsecカプセル化（Tunnel/Transport、AH/ESP）パケットと、IKE Phase 1・Phase 2の通信シーケンスを学びます。",
        "jsFile": "lab_ipsec.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "IPsecによる安全なVPN通信のパケット構造と、接続前に鍵交換を行うIKEプロトコルの動作を学びます。AHとESP、トンネルモードとトランスポートモードの違いによるパケット配置をビジュアルで確認し、IKEのメインモードとアグレッシブモードのシーケンスを比較します。",
        "keywords": ["IPsec", "AH (認証のみ)", "ESP (暗号化+認証)", "トンネル / トランスポートモード", "IKE Phase 1 / Phase 2", "メイン / アグレッシブモード"]
    },
    {
        "id": "vpn_types",
        "title": "IPsec SA・広域ネットワークVPN",
        "description": "IPsecの鍵交換・接続管理を司る『SA (Security Association)』の動作概念と、キャリア閉域網などを利用した広域ネットワークVPNの違いを体系的に学びます。",
        "jsFile": "lab_vpn_types.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "IPsecの鍵交換・接続管理を司る『SA (Security Association)』の動作概念と、キャリア閉域網などを利用した広域ネットワークVPN（IP-VPN、広域イーサネット、インターネットVPN）の違いを学びます。SAの方向性やSPI、広域VPNの特徴を整理します。",
        "keywords": ["IKE SA (双方向1本)", "IPsec SA (片方向2本)", "SPI (Security Parameter Index)", "IP-VPN (MPLS閉域網)", "広域イーサネット (L2閉域網)"]
    },
    {
        "id": "osi_model",
        "title": "OSI参照モデル・カプセル化",
        "description": "データのカプセル化（ヘッダー付与）と非カプセル化を、物理層からアプリケーション層までの各プロトコル動作と共に視覚的に学びます。",
        "jsFile": "lab_osi_model.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "ネットワーク通信の共通規格であるOSI参照モデル7階層について、PCからWebサーバーへHTTPSでリクエストが送られる際の『カプセル化』および『非カプセル化』プロセスをアニメーションで視覚的に学習します。",
        "keywords": ["OSI参照モデル", "カプセル化 (Encapsulation)", "非カプセル化 (Decapsulation)", "PDU (プロトコルデータ単位)", "L2/L3スイッチ", "MAC/IPアドレス"]
    },
    {
        "id": "saml",
        "title": "SAML 認証 & 学認 SSO",
        "description": "SAML 2.0 に基づくシングルサインオン、アサーションの内部構造、および SP におけるデジタル署名や有効期限の厳密な検証基準を、学認 (GakuNin) のシナリオを通じて体験的に学びます。",
        "jsFile": "lab_saml.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "教育・研究機関で広く使われている学術認証フェデレーション「学認（GakuNin）」をモデルに、SAML 2.0 に基づくシングルサインオン（SSO）の仕組みを学習します。ユーザーがサービスプロバイダ（SP）にアクセスし、アイデンティティプロバイダ（IdP）で認証され、SAMLアサーションを含むSAMLResponseを受け取るフローを追体験し、SPがアサーションの信頼性をどのように厳密に検証しているか（署名・有効期限・宛先・リプレイ攻撃防止など）を学習します。",
        "keywords": ["SAML 2.0", "SP (Service Provider)", "IdP (Identity Provider)", "SAMLアサーション", "メタデータ", "学認 (GakuNin)", "ACS (Assertion Consumer Service)", "デジタル署名", "リプレイ攻撃対策"]
    },
    {
        "id": "pki",
        "title": "認証局 (CA) と PKI ライフサイクル",
        "description": "CA, RA, VA, AA, OCSP などの役割とデータの流れ、証明書の発行から失効検証（CRL/OCSP）までをインタラクティブに学びます。",
        "jsFile": "lab_pki.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "公開鍵基盤 (PKI) における認証局 (CA)、登録局 (RA)、検証局 (VA)、アトリビュート認証局 (AA) の役割を学びます。証明書発行申請 (CSR) から発行、そして証明書の有効性検証 (CRL / OCSP) までのデータと検証の流れを視覚的にシミュレートします。",
        "keywords": ["公開鍵基盤 (PKI)", "認証局 (CA)", "登録局 (RA)", "検証局 (VA)", "アトリビュート認証局 (AA)", "OCSP", "CRL (証明書失効リスト)", "CSR (証明書署名要求)"]
    },
    {
        "id": "eap_auth",
        "title": "IEEE 802.1X・EAP認証",
        "description": "IEEE 802.1Xの仕組みと、EAP各種認証方式（MD5、LEAP、EAP-FAST、TLS、TTLS、PEAP）のハンドシェイクの違いを学びます。",
        "jsFile": "lab_eap.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "有線・無線LANのポート制御規格である IEEE 802.1X と、そこで使われるEAP (Extensible Authentication Protocol) フレームワークについて学びます。Supplicant, Authenticator, RADIUSサーバー間の対話と、各EAP認証方式（EAP-TLS, PEAP等）による安全性の違い（証明書や暗号化トンネルの有無）を可視化します。",
        "keywords": ["IEEE 802.1X", "EAP (Extensible Authentication Protocol)", "EAP-TLS", "PEAP", "EAP-FAST", "RADIUS", "Supplicant", "Authenticator"]
    },
    {
        "id": "csrf_vs_xss",
        "title": "CSRF vs XSS 徹底比較と防衛",
        "description": "CSRF（クロスサイトリクエストフォージェリ）とXSS（クロスサイトスクリプティング）の違い、発生機構、および抗CSRFトークン・SameSite・HttpOnly・サニタイズによる防御を体験的に学びます。",
        "jsFile": "lab_csrf_vs_xss.js",
        "category": "technology",
        "subcategory": "3_security",
        "subcategory_name": "3. セキュリティ",
        "overview": "情報処理安全確保支援士試験で最も混同しやすいWeb攻撃「CSRF」と「XSS」について、攻撃が実行されるオリジン（発動場所）、目的、Cookieの動作、Same-Origin Policy (同種オリジン制約) の関係を徹底比較します。外部罠サイトからの偽リクエスト（CSRF）と、ターゲットサイト内でのスクリプト注入（XSS）をそれぞれシミュレートし、抗CSRFトークン、SameSite Cookie (Strict/Lax)、HttpOnly属性、HTMLエスケープによる防御をハンズオンで体感します。",
        "keywords": ["CSRF", "XSS", "Same-Origin Policy (SOP)", "抗CSRFトークン", "SameSite Cookie", "HttpOnly属性", "サニタイズ (HTMLエスケープ)"]
    },
    {
        "id": "stp",
        "title": "スパニングツリープロトコル (STP / IEEE 802.1D)",
        "description": "STPのルートブリッジ選出、ルートポート(RP)・代表ポート(DP)・ブロックポート(BP)の選出条件、およびブロードキャストストーム防御を学習します。",
        "jsFile": "lab_stp.js",
        "category": "technology",
        "subcategory": "2_network",
        "subcategory_name": "2. ネットワーク",
        "overview": "スイッチドネットワークにおけるL2ループを防ぐ『スパニングツリープロトコル (STP / IEEE 802.1D)』の選出アルゴリズムをインタラクティブに学習します。Bridge ID（優先度 + MACアドレス）によるルートブリッジ選出、ルートポート (RP)、代表ポート (DP / 令和5年春AM2問19出題)、ブロックポート (BP) の選出ロジック、およびSTP無効時のブロードキャストストーム発生メカニズムを体験できます。",
        "keywords": ["スパニングツリープロトコル (STP)", "IEEE 802.1D", "RSTP (IEEE 802.1w)", "ルートブリッジ (Root Bridge)", "Bridge ID (BID)", "ルートポート (Root Port / RP)", "代表ポート (Designated Port / DP)", "ブロックポート (Blocked Port / BP)", "経路コスト (Path Cost)", "BPDU (Bridge Protocol Data Unit)", "ブロードキャストストーム"]
    },
    {
        "id": "system_reliability",
        "title": "システム信頼性方式設計 (フェールセーフ / フールプルーフ等)",
        "description": "フールプルーフ、フェールセーフ、フェールソフト、フォールトトレラントの定義の違いと使い分けを比較・体験学習します。",
        "jsFile": "lab_system_reliability.js",
        "category": "technology",
        "subcategory": "5_mgmt",
        "subcategory_name": "5. マネジメント・システム設計",
        "overview": "システム方式設計における信頼性・可用性・安全設計の4大概念（フールプルーフ、フェールセーフ、フェールソフト、フォールトトレラント）を体系的に学習します。誤操作（ヒューマンエラー）対策と機器故障対策の分類、および障害発生時の挙動（安全停止 vs 縮退運転 vs 無停止二重化継続）の違いをインタラクティブな障害シミュレータで体感します。",
        "keywords": ["フールプルーフ (Foolproof)", "フェールセーフ (Fail-safe)", "フェールソフト (Fail-soft)", "フォールトトレラント (Fault-tolerant)", "フォールトアボイダンス (Fault Avoidance)", "縮退運転 (Degraded Operation)", "Fail-closed / Fail-open", "ヒューマンエラー防止"]
    }
]
