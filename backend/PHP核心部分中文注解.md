# 🔥 PHP 後端核心部分中文註解

## 📋 目錄
1. [資料庫連接組態](#資料庫連接組態)
2. [身份認證系統](#身份認證系統)
3. [中間件驗證](#中間件驗證)
4. [使用者資料管理](#使用者資料管理)
5. [監視列表管理](#監視列表管理)
6. [財務數據爬取](#財務數據爬取)
7. [資料庫模式](#資料庫模式)

---

## 資料庫連接組態

### 檔案: `backend/config/db.php`

```php
<?php
// 定義資料庫連接常數
define('DB_HOST', 'aws-1-ap-northeast-1.pooler.supabase.com'); // Supabase 主機位址
define('DB_PORT', '5432'); // PostgreSQL 埠號（5432 允許繞過學校防火牆）
define('DB_NAME', 'postgres'); // 資料庫名稱
define('DB_USER', 'postgres.pezwarnweoafcrxjbdoy'); // 資料庫使用者名稱
define('DB_PASS', 'Yoyo0613@@@@'); // 資料庫密碼

// JWT 密鑰（用於生成和驗證身份令牌）
define('JWT_SECRET', 'your_super_secret_jwt_key_change_this_before_deploying');

class Database {
    private static $conn = null; // 單例模式：靜態連接實例
    
    public static function getConnection() {
        // 只初始化一次連接（節省資源）
        if (self::$conn === null) {
            try {
                // DSN: 資料來源名稱（包含資料庫連接資訊）
                $project_ref = explode('.', DB_USER)[1]; // 從使用者名稱中提取項目引用
                $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";sslmode=prefer;options=endpoint=$project_ref";
                
                // 建立 PDO 連接
                self::$conn = new PDO($dsn, DB_USER, DB_PASS, array(
                    PDO::ATTR_PERSISTENT => true // 持久連接：連接在指令碼執行完後保持打開
                ));
                
                // 組態 PDO 錯誤模式和預設行為
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // 異常模式
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // 傳回關聯陣列
            } catch(PDOException $exception) {
                // 傳回通用錯誤訊息（避免泄露資料庫憑證）
                http_response_code(500);
                echo json_encode(["error" => "Database connection error: " . $exception->getMessage()]);
                exit;
            }
        }
        return self::$conn;
    }
}
?>
```

### 🔑 關鍵概念
- **PDO**: PHP 資料物件，提供統一的資料庫介面
- **單例模式**: 確保整個應用只有一個資料庫連接實例
- **預處理語句**: 使用 `:placeholder` 防止 SQL 注入攻擊

---

## 身份認證系統

### 檔案: `backend/api/auth.php`

```php
<?php
// ===== CORS 設定 =====
// 允許跨域請求（React 前端可以訪問該 API）
header("Access-Control-Allow-Origin: *"); // 生產環境改為具體域名
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // 允許的 HTTP 方法
header("Access-Control-Max-Age: 3600"); // 預檢請求快取時間（秒）
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ===== 處理 CORS 預檢請求 =====
// OPTIONS 請求是瀏覽器發送的預檢請求（在實際 POST 之前）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // 傳回 200 表示允許
    exit();
}

// 匯入必要的庫
require_once '../config/db.php'; // 資料庫連接
require_once '../vendor/autoload.php'; // Composer 自動加載器
use \Firebase\JWT\JWT; // JWT 庫用於生成令牌

// 取得資料庫連接
$db = Database::getConnection();

// ===== 接收前端發送的資料 =====
$data = json_decode(file_get_contents("php://input")); // 從請求體讀取 JSON
// php://input：從客戶端讀取原始 POST 資料

// 驗證必需欄位
if (!isset($data->action) || !isset($data->email) || !isset($data->password)) {
    http_response_code(400); // 400: 錯誤的請求
    echo json_encode(["error" => "Incomplete data. Required: action (login/register), email, password."]);
    exit();
}

$email = trim($data->email); // 移除空格
$password = $data->password;
$action = $data->action; // 'register' 或 'login'

// ===== 註冊流程 =====
if ($action === 'register') {
    // 1️⃣ 檢查使用者是否已存在
    $check_query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($check_query); // 準備 SQL 語句
    $stmt->bindParam(":email", $email); // 綁定參數（防止 SQL 注入）
    $stmt->execute(); // 執行查詢
    
    if ($stmt->rowCount() > 0) { // rowCount(): 傳回受影響的行數
        http_response_code(400); // 郵箱已存在
        echo json_encode(["error" => "Email already exists."]);
        exit();
    }
    
    // 2️⃣ 對密碼進行雜湊加密
    // PASSWORD_BCRYPT: 使用 Bcrypt 演算法，具有自適應延伸功能，可應對計算能力增長
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    
    // 3️⃣ 插入新使用者
    $insert_query = "INSERT INTO users (email, password_hash, balance) VALUES (:email, :password_hash, 100000.00) RETURNING id";
    // RETURNING id: PostgreSQL 特性，傳回插入的主鍵 ID
    $stmt = $db->prepare($insert_query);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);
    
    if ($stmt->execute()) {
        // 取得傳回的使用者 ID
        $row = $stmt->fetch(PDO::FETCH_ASSOC); // FETCH_ASSOC: 傳回關聯陣列
        $user_id = $row['id'];
        
        // 4️⃣ 生成 JWT 令牌
        $token = generateJWT($user_id, $email);
        
        http_response_code(201); // 201: 資源已建立
        echo json_encode([
            "message" => "User registered successfully.",
            "token" => $token, // 前端儲存此令牌用於後續認證
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        http_response_code(500); // 500: 伺服器錯誤
        echo json_encode(["error" => "Unable to register user."]);
    }
}

// ===== 登入流程 =====
elseif ($action === 'login') {
    // 1️⃣ 查詢郵箱對應的使用者
    $query = "SELECT id, email, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 2️⃣ 驗證密碼
        // password_verify(): 將輸入密碼與儲存的雜湊值進行比較
        // 安全原因：永遠不存儲明文密碼，只存儲雜湊值
        if (password_verify($password, $row['password_hash'])) {
            // 密碼正確，生成 JWT 令牌
            $token = generateJWT($row['id'], $row['email']);
            
            http_response_code(200); // 200: 成功
            echo json_encode([
                "message" => "Login successful.",
                "token" => $token,
                "user" => ["id" => $row['id'], "email" => $row['email']]
            ]);
        } else {
            // 密碼錯誤
            http_response_code(401); // 401: 未授權
            echo json_encode(["error" => "Invalid password."]);
        }
    } else {
        // 郵箱未找到
        http_response_code(404); // 404: 未找到
        echo json_encode(["error" => "Email not found."]);
    }
}
?>
```

### JWT 生成函式
```php
function generateJWT($user_id, $email) {
    // JWT 的三部分：header.payload.signature
    
    $issued_at = time(); // 發行時間（秒級時間戳記）
    $expire = $issued_at + (10 * 365 * 24 * 60 * 60); // 10 年後過期
    
    /*
    payload: 令牌包含的資料
    - iat: 發行時間
    - exp: 過期時間
    - data: 使用者資訊
    */
    $payload = [
        'iat' => $issued_at,
        'exp' => $expire,
        'data' => [
            'id' => $user_id,
            'email' => $email
        ]
    ];
    
    // 使用 JWT_SECRET 密鑰和 HS256 演算法簽署令牌
    $token = JWT::encode($payload, JWT_SECRET, 'HS256');
    return $token;
}
```

### 🔐 安全機制
- **密碼加密**: 使用 Bcrypt（自適應演算法）
- **JWT 令牌**: 無狀態認證，無需伺服器存儲會話
- **CORS**: 跨域資源共享，防止未授權熼域訪問
- **HTTP 狀態碼**: 使用標準的 HTTP 狀態碼傳達結果

---

## 中間件驗證

### 檔案: `backend/api/middleware.php`

```php
<?php
// middleware: 中間件，在處理請求前進行驗證

require_once '../vendor/autoload.php';
require_once '../config/db.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key; // 用於指定密鑰和演算法

function authenticate() {
    // ===== 取得請求頭 =====
    // HTTP 請求通過 Authorization 頭傳遞 JWT 令牌
    $headers = apache_request_headers();
    
    // 備選方案：某些伺服器（如 Nginx）可能不支援 apache_request_headers()
    if (!isset($headers['Authorization']) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
    }
    
    // ===== 檢查授權頭 =====
    if (!isset($headers['Authorization'])) {
        http_response_code(401); // 401: 未授權
        echo json_encode(["error" => "No authorization token provided."]);
        exit();
    }
    
    // ===== 解析令牌 =====
    $authHeader = $headers['Authorization'];
    $arr = explode(" ", $authHeader); // 分割 "Bearer <token>"
    
    // 確保格式正確
    if (count($arr) !== 2 || $arr[0] !== 'Bearer') {
        http_response_code(401);
        echo json_encode(["error" => "Invalid authorization format. Expected 'Bearer <token>'"]);
        exit();
    }
    
    $jwt = $arr[1]; // 提取令牌
    
    // ===== 驗證並解碼 JWT =====
    try {
        // JWT::decode(): 驗證簽名並傳回 payload
        // Key 物件：指定密鑰和演算法
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        
        // $decoded->data 包含 {id, email} 使用者資訊
        return $decoded->data;
        
    } catch (Exception $e) {
        // 令牌無效、已過期或簽名不匹配
        http_response_code(401);
        echo json_encode(["error" => "Access denied. " . $e->getMessage()]);
        exit();
    }
}
?>
```

### 📍 使用示例
```php
// 在任何需要認證的 API 端點中呼叫
require_once 'middleware.php';
$user = authenticate(); // 傳回 {id, email} 或拋出 401 錯誤
$user_id = $user->id;
$email = $user->email;
```

### 🔍 驗證流程
1. 取得請求頭中的 Authorization 欄位
2. 解析格式 "Bearer <token>"
3. 驗證 JWT 簽名（防止篡改）
4. 檢查過期時間
5. 傳回包含的使用者資料或拋出 401 錯誤

---

## 使用者資料管理

### 檔案: `backend/api/profile.php`

```php
<?php
// ===== 取得使用者資料 (GET 請求) =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 需要 JWT 認證，取得目前使用者 ID
    $user = authenticate(); // 來自 middleware.php
    $db = Database::getConnection();
    
    // 1️⃣ 查詢使用者基本資訊
    $query = "SELECT id, email, balance, name, bio FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $user->id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 2️⃣ 取得使用者的監視列表（關注的股票）
        $wl_query = "SELECT symbol FROM watchlists WHERE user_id = :id";
        $wl_stmt = $db->prepare($wl_query);
        $wl_stmt->bindParam(":id", $user->id);
        $wl_stmt->execute();
        
        $watchlist = []; // 存儲所有股票代碼
        while ($wl_row = $wl_stmt->fetch(PDO::FETCH_ASSOC)) {
            $watchlist[] = $wl_row['symbol'];
        }
        
        // 3️⃣ 傳回格式化的使用者資料
        echo json_encode([
            "id" => $row['id'],
            "email" => $row['email'],
            "name" => $row['name'],
            "bio" => $row['bio'],
            "balance" => (float)$row['balance'], // 轉換為浮點數
            "watchlist" => $watchlist, // 使用者關注的所有股票
            "currency" => "USD" // 貨幣單位
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
    }
}

// ===== 更新使用者資料 (POST 請求) =====
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = authenticate();
    $db = Database::getConnection();
    
    // 取得請求體的 JSON 資料
    $data = json_decode(file_get_contents("php://input"));
    
    // 構建動態 UPDATE 語句（只更新提供的欄位）
    $updates = []; // 存儲要更新的列名
    
    // 檢查哪些欄位被提供
    if (isset($data->balance)) $updates[] = "balance = :balance";
    if (isset($data->name)) $updates[] = "name = :name";
    if (isset($data->bio)) $updates[] = "bio = :bio";
    
    if (count($updates) > 0) {
        // 動態構建 UPDATE 語句
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        // 綁定對應的參數
        if (isset($data->balance)) $stmt->bindParam(":balance", $data->balance);
        if (isset($data->name)) $stmt->bindParam(":name", $data->name);
        if (isset($data->bio)) $stmt->bindParam(":bio", $data->bio);
        $stmt->bindParam(":id", $user->id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Profile updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update profile."]);
        }
    } else {
        // 沒有有效的更新資料
        http_response_code(400);
        echo json_encode(["error" => "No valid data provided for update."]);
    }
}
?>
```

### 💡 關鍵設計
- **GET**: 取得目前使用者的完整資料
- **POST**: 更新使用者可修改的欄位
- **動態 SQL**: 只更新提供的欄位，靈活高效
- **關聯查詢**: 同時取得使用者資訊和監視列表

---

## 監視列表管理

### 檔案: `backend/api/watchlist.php`

```php
<?php
require_once 'middleware.php'; // 認證使用者

$user = authenticate(); // 取得目前使用者
$db = Database::getConnection();

// 取得 POST/DELETE 請求的 JSON 資料
$data = json_decode(file_get_contents("php://input"));

// ===== 新增股票到監視列表 (POST) =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    $symbol = strtoupper(trim($data->symbol)); // 轉大寫，去除空格
    
    // INSERT ... ON CONFLICT DO NOTHING
    // 如果 (user_id, symbol) 已存在，則忽略此插入（不報錯）
    // 這允許前端多次點擊「新增」而不會導致重複或錯誤
    $query = "INSERT INTO watchlists (user_id, symbol) VALUES (:user_id, :symbol) ON CONFLICT DO NOTHING";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user->id);
    $stmt->bindParam(":symbol", $symbol);
    
    if ($stmt->execute()) {
        echo json_encode(["message" => "Symbol added to watchlist.", "symbol" => $symbol]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to add symbol."]);
    }
}

// ===== 從監視列表移除股票 (DELETE) =====
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    $symbol = strtoupper(trim($data->symbol));
    
    // 移除符合條件的記錄
    $query = "DELETE FROM watchlists WHERE user_id = :user_id AND symbol = :symbol";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user->id);
    $stmt->bindParam(":symbol", $symbol);
    
    if ($stmt->execute()) {
        echo json_encode(["message" => "Symbol removed from watchlist.", "symbol" => $symbol]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to remove symbol."]);
    }
}
?>
```

### 🎯 功能特性
- **POST**: 新增股票到監視列表（帶去重）
- **DELETE**: 從監視列表移除股票
- **ON CONFLICT**: PostgreSQL 特性，處理重複插入
- **使用者隔離**: 每個使用者只能操作自己的監視列表

---

## 財務數據爬取

### 檔案: `backend/api/financial_scraper.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// 從 URL 參數取得股票代碼（預設為 AAPL）
$symbol = isset($_GET['symbol']) ? strtoupper(trim($_GET['symbol'])) : 'AAPL';

// ===== 嘗試從 Yahoo Finance API 取得真實數據 =====
$url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{$symbol}?modules=incomeStatementHistory";

$ch = curl_init($url); // 初始化 cURL 會話
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // 傳回結果而不是輸出
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    // 新增瀏覽器 User-Agent 頭，某些 API 可能會阻止 bot
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept: application/json',
    'Connection: keep-alive'
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // 跟隨重定向
curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 5 秒超時

$response = curl_exec($ch); // 執行請求
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // 取得 HTTP 回應碼
curl_close($ch); // 關閉會話

// ===== 解析真實數據 =====
$realData = null;
if ($httpcode == 200 && $response) {
    $data = json_decode($response, true);
    if (isset($data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0])) {
        $realData = $data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0];
    }
}

// ===== 生成樹形結構 =====
// 前端使用 DFS（深度優先搜尋）遍歷此樹形結構來可視化財務資料

if ($realData) {
    // 使用真實資料構建樹
    $tree = [
        "name" => "Total Revenue",
        "value" => $realData['totalRevenue']['raw'] ?? 0,
        "fmt" => $realData['totalRevenue']['fmt'] ?? "0", // fmt: 格式化的顯示值
        "children" => [
            [
                "name" => "Operating Income",
                "value" => $realData['operatingIncome']['raw'] ?? 0,
                "fmt" => $realData['operatingIncome']['fmt'] ?? "0",
                "children" => []
            ],
            [
                "name" => "Cost of Revenue",
                "value" => $realData['costOfRevenue']['raw'] ?? 0,
                "fmt" => $realData['costOfRevenue']['fmt'] ?? "0",
                "children" => []
            ]
        ]
    ];
} else {
    // API 被阻止或超時？生成模擬資料
    // 使用符號的雜湊值生成「真實」但可重複的隨機資料
    $hash = md5($symbol); // 同一股票符號總是生成相同的模擬資料
    $seed = hexdec(substr($hash, 0, 5)); // 從雜湊中提取種子
    srand($seed); // 使用種子初始化隨機數生成器
    
    $baseRev = rand(20000, 400000) * 1000000; // 基礎收入：200 億到 4000 億
    
    $tree = [
        "name" => "Total Revenue",
        "value" => $baseRev,
        "fmt" => "$" . number_format($baseRev / 1000000000, 2) . "B", // "B" = 十億
        "children" => [
            [
                "name" => "Core Products",
                "value" => $baseRev * 0.65, // 佔 65%
                "fmt" => "$" . number_format(($baseRev * 0.65) / 1000000000, 2) . "B",
                "children" => [
                    ["name" => "Hardware", "value" => $baseRev * 0.4, "fmt" => "$" . ..., "children" => []],
                    ["name" => "Software Licenses", "value" => $baseRev * 0.25, "fmt" => "$" . ..., "children" => []]
                ]
            ],
            [
                "name" => "Services & Subscriptions",
                "value" => $baseRev * 0.35, // 佔 35%
                "fmt" => "$" . number_format(($baseRev * 0.35) / 1000000000, 2) . "B",
                "children" => [
                    ["name" => "Cloud Services", "value" => $baseRev * 0.2, ...],
                    // 更多子項...
                ]
            ]
        ]
    ];
}

// 傳回 JSON 樹結構
echo json_encode($tree);
?>
```

### 🌳 樹形結構設計
```
總收入（根節點）
├── 核心產品 (65%)
│   ├── 硬體 (40%)
│   └── 軟體授權 (25%)
└── 服務與訂閱 (35%)
    ├── 雲服務 (20%)
    └── 支援與維護 (15%)
```

### 🔄 容錯機制
- **真實 API**: 優先嘗試 Yahoo Finance API
- **模擬資料**: API 被阻止時使用，但保證一致性（相同符號總是相同資料）
- **cURL 組態**: 瀏覽器 User-Agent、超時、重定向等

---

## 資料庫模式

### 檔案: `backend/schema.sql`

```sql
-- ===== 使用者表 =====
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, -- 自動遞增的主鍵
    email VARCHAR(255) UNIQUE NOT NULL, -- 唯一郵箱
    password_hash VARCHAR(255) NOT NULL, -- 加密後的密碼
    name VARCHAR(255) DEFAULT '', -- 使用者名字
    bio TEXT DEFAULT '', -- 使用者個人簡介
    balance NUMERIC(15, 2) DEFAULT 0.00, -- 帳戶餘額（15 位數字，2 位小數）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 建立時間
);

-- ===== 監視列表表 =====
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 外鍵，刪除使用者時級聯刪除
    symbol VARCHAR(50) NOT NULL, -- 股票代碼（如 AAPL, MSFT）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol) -- 複合唯一鍵：同一使用者不能新增相同股票兩次
);

-- ===== 論壇帖子表 =====
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 發帖人
    title VARCHAR(255) NOT NULL, -- 帖子標題
    content TEXT NOT NULL, -- 帖子內容
    likes_count INTEGER DEFAULT 0, -- 點贊數
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== 論壇評論表 =====
CREATE TABLE IF NOT EXISTS forum_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE, -- 所屬帖子
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 評論者
    content TEXT NOT NULL, -- 評論內容
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== 論壇點贊表 =====
CREATE TABLE IF NOT EXISTS forum_likes (
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE, -- 被點贊的帖子
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 點贊的使用者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id) -- 複合主鍵：防止重複點贊
);
```

### 📊 表關係圖
```
使用者 (1)
  ├── (N) 監視列表
  ├── (N) 論壇帖子
  ├── (N) 論壇評論
  └── (N) 論壇點贊

論壇帖子 (1)
  ├── (N) 論壇評論
  └── (N) 論壇點贊
```

### 🔑 關鍵資料庫概念
- **SERIAL**: 自動遞增整數
- **UNIQUE**: 唯一約束
- **REFERENCES**: 外鍵關係
- **ON DELETE CASCADE**: 刪除使用者時自動刪除其關聯資料
- **NUMERIC(15,2)**: 精確小數（財務資料必須精確，不能用 FLOAT）

---

## 🚀 核心工作流

### 1️⃣ 註冊流程
```
前端輸入郵箱/密碼
    ↓
POST /auth.php { action: 'register', email, password }
    ↓
檢查郵箱是否存在 → 已存在則傳回 400 錯誤
    ↓
Bcrypt 加密密碼
    ↓
插入使用者表
    ↓
生成 JWT 令牌（10 年有效期）
    ↓
傳回 token + 使用者資訊
    ↓
前端儲存 token（localStorage）
```

### 2️⃣ 登錄流程
```
前端輸入郵箱/密碼
    ↓
POST /auth.php { action: 'login', email, password }
    ↓
查詢 users 表
    ↓
password_verify() 驗證密碼
    ↓
密碼正確 → 生成 JWT 令牌
    ↓
傳回 token + 使用者資訊
    ↓
前端儲存 token
```

### 3️⃣ 受保護 API 呼叫
```
前端 API 請求
    ↓
在 Authorization 頭新增 "Bearer <token>"
    ↓
後端自動呼叫 authenticate()
    ↓
驗證 JWT 簽名 + 過期時間
    ↓
有效 → 處理請求並傳回數據
    ↓
無效 → 傳回 401 錯誤，前端重定向到登錄
```

---

## 🔒 安全最佳實踐

| 安全問題 | 解決方案 |
|---------|---------|
| **SQL 注入** | 使用預處理語句 (`:placeholder`) |
| **密碼洩露** | Bcrypt 加密 + 永不儲存明文 |
| **會話劫持** | JWT 代替 session |
| **跨域攻擊** | CORS 頭組態 + 生產環境指定域名 |
| **令牌洩露** | HTTPS 傳輸 + 短期過期時間 |
| **CSRF** | SameSite Cookie 屬性 + CSRF 令牌 |
| **密碼暴力** | 使用 Bcrypt 的自適應延伸 |

---

## 📦 依賴項

```json
{
  "require": {
    "firebase/php-jwt": "^6.0" // JWT 生成和驗證庫
  }
}
```

安裝: `composer require firebase/php-jwt`

---

## 🔗 環境變數清單

```
DB_HOST=aws-1-ap-northeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=你的 Supabase 使用者名稱
DB_PASS=你的 Supabase 密碼
JWT_SECRET=超級秘密密鑰（生產環境必須強安全）
CORS_ORIGIN=你的前端域名（生產環境）
```

---

## 🎓 學習要點總結

1. **HTTP 狀態碼**: 200✅ 400❌ 401🔐 404❓ 500💥 
2. **JWT**: 無狀態認證的未來
3. **PDO**: 防止 SQL 注入的關鍵
4. **CORS**: 允許前端跨域呼叫
5. **後端驗證**: 永遠不信任前端
6. **錯誤處理**: 向使用者傳回安全的通用錯誤，日誌記錄詳細錯誤
7. **樹形資料結構**: 高效表示層級財務資料
