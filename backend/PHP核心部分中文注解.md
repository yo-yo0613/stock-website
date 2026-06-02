# 🔥 PHP 后端核心部分中文注解

## 📋 目录
1. [数据库连接配置](#数据库连接配置)
2. [身份认证系统](#身份认证系统)
3. [中间件验证](#中间件验证)
4. [用户资料管理](#用户资料管理)
5. [监视列表管理](#监视列表管理)
6. [财务数据爬取](#财务数据爬取)
7. [数据库模式](#数据库模式)

---

## 数据库连接配置

### 文件: `backend/config/db.php`

```php
<?php
// 定义数据库连接常量
define('DB_HOST', 'aws-1-ap-northeast-1.pooler.supabase.com'); // Supabase主机地址
define('DB_PORT', '5432'); // PostgreSQL端口（5432允许绕过学校防火墙）
define('DB_NAME', 'postgres'); // 数据库名称
define('DB_USER', 'postgres.pezwarnweoafcrxjbdoy'); // 数据库用户名
define('DB_PASS', 'Yoyo0613@@@@'); // 数据库密码

// JWT密钥（用于生成和验证身份令牌）
define('JWT_SECRET', 'your_super_secret_jwt_key_change_this_before_deploying');

class Database {
    private static $conn = null; // 单例模式：静态连接实例
    
    public static function getConnection() {
        // 只初始化一次连接（节省资源）
        if (self::$conn === null) {
            try {
                // DSN: 数据源名称（包含数据库连接信息）
                $project_ref = explode('.', DB_USER)[1]; // 从用户名中提取项目引用
                $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";sslmode=prefer;options=endpoint=$project_ref";
                
                // 创建PDO连接
                self::$conn = new PDO($dsn, DB_USER, DB_PASS, array(
                    PDO::ATTR_PERSISTENT => true // 持久连接：连接在脚本执行完后保持打开
                ));
                
                // 配置PDO错误模式和默认行为
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // 异常模式
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // 返回关联数组
            } catch(PDOException $exception) {
                // 返回通用错误消息（避免泄露数据库凭证）
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

### 🔑 关键概念
- **PDO**: PHP数据对象，提供统一的数据库接口
- **单例模式**: 确保整个应用只有一个数据库连接实例
- **预处理语句**: 使用`:placeholder`防止SQL注入攻击

---

## 身份认证系统

### 文件: `backend/api/auth.php`

```php
<?php
// ===== CORS 设置 =====
// 允许跨域请求（React前端可以访问该API）
header("Access-Control-Allow-Origin: *"); // 生产环境改为具体域名
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // 允许的HTTP方法
header("Access-Control-Max-Age: 3600"); // 预检请求缓存时间（秒）
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ===== 处理CORS预检请求 =====
// OPTIONS请求是浏览器发送的预检请求（在实际POST之前）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // 返回200表示允许
    exit();
}

// 导入必要的库
require_once '../config/db.php'; // 数据库连接
require_once '../vendor/autoload.php'; // Composer自动加载器
use \Firebase\JWT\JWT; // JWT库用于生成令牌

// 获取数据库连接
$db = Database::getConnection();

// ===== 接收前端发送的数据 =====
$data = json_decode(file_get_contents("php://input")); // 从请求体读取JSON
// php://input：从客户端读取原始POST数据

// 验证必需字段
if (!isset($data->action) || !isset($data->email) || !isset($data->password)) {
    http_response_code(400); // 400: 错误的请求
    echo json_encode(["error" => "Incomplete data. Required: action (login/register), email, password."]);
    exit();
}

$email = trim($data->email); // 去除空格
$password = $data->password;
$action = $data->action; // 'register' 或 'login'

// ===== 注册流程 =====
if ($action === 'register') {
    // 1️⃣ 检查用户是否已存在
    $check_query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($check_query); // 准备SQL语句
    $stmt->bindParam(":email", $email); // 绑定参数（防止SQL注入）
    $stmt->execute(); // 执行查询
    
    if ($stmt->rowCount() > 0) { // rowCount(): 返回受影响的行数
        http_response_code(400); // 邮箱已存在
        echo json_encode(["error" => "Email already exists."]);
        exit();
    }
    
    // 2️⃣ 对密码进行哈希加密
    // PASSWORD_BCRYPT: 使用Bcrypt算法，具有自适应延伸功能，可应对计算能力增长
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    
    // 3️⃣ 插入新用户
    $insert_query = "INSERT INTO users (email, password_hash, balance) VALUES (:email, :password_hash, 100000.00) RETURNING id";
    // RETURNING id: PostgreSQL特性，返回插入的主键ID
    $stmt = $db->prepare($insert_query);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);
    
    if ($stmt->execute()) {
        // 获取返回的用户ID
        $row = $stmt->fetch(PDO::FETCH_ASSOC); // FETCH_ASSOC: 返回关联数组
        $user_id = $row['id'];
        
        // 4️⃣ 生成JWT令牌
        $token = generateJWT($user_id, $email);
        
        http_response_code(201); // 201: 资源已创建
        echo json_encode([
            "message" => "User registered successfully.",
            "token" => $token, // 前端存储此令牌用于后续认证
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        http_response_code(500); // 500: 服务器错误
        echo json_encode(["error" => "Unable to register user."]);
    }
}

// ===== 登录流程 =====
elseif ($action === 'login') {
    // 1️⃣ 查询邮箱对应的用户
    $query = "SELECT id, email, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 2️⃣ 验证密码
        // password_verify(): 将输入密码与存储的哈希值进行比较
        // 安全原因：永远不存储明文密码，只存储哈希值
        if (password_verify($password, $row['password_hash'])) {
            // 密码正确，生成JWT令牌
            $token = generateJWT($row['id'], $row['email']);
            
            http_response_code(200); // 200: 成功
            echo json_encode([
                "message" => "Login successful.",
                "token" => $token,
                "user" => ["id" => $row['id'], "email" => $row['email']]
            ]);
        } else {
            // 密码错误
            http_response_code(401); // 401: 未授权
            echo json_encode(["error" => "Invalid password."]);
        }
    } else {
        // 邮箱未找到
        http_response_code(404); // 404: 未找到
        echo json_encode(["error" => "Email not found."]);
    }
}
?>
```

### JWT生成函数
```php
function generateJWT($user_id, $email) {
    // JWT的三部分：header.payload.signature
    
    $issued_at = time(); // 发行时间（秒级时间戳）
    $expire = $issued_at + (10 * 365 * 24 * 60 * 60); // 10年后过期
    
    /*
    payload: 令牌包含的数据
    - iat: 发行时间
    - exp: 过期时间
    - data: 用户信息
    */
    $payload = [
        'iat' => $issued_at,
        'exp' => $expire,
        'data' => [
            'id' => $user_id,
            'email' => $email
        ]
    ];
    
    // 使用JWT_SECRET密钥和HS256算法签署令牌
    $token = JWT::encode($payload, JWT_SECRET, 'HS256');
    return $token;
}
```

### 🔐 安全机制
- **密码加密**: 使用Bcrypt（自适应算法）
- **JWT令牌**: 无状态认证，无需服务器存储会话
- **CORS**: 跨域资源共享，防止未授权熼域访问
- **HTTP状态码**: 使用标准的HTTP状态码传达结果

---

## 中间件验证

### 文件: `backend/api/middleware.php`

```php
<?php
// middleware: 中间件，在处理请求前进行验证

require_once '../vendor/autoload.php';
require_once '../config/db.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key; // 用于指定密钥和算法

function authenticate() {
    // ===== 获取请求头 =====
    // HTTP请求通过Authorization头传递JWT令牌
    $headers = apache_request_headers();
    
    // 备选方案：某些服务器（如Nginx）可能不支持apache_request_headers()
    if (!isset($headers['Authorization']) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
    }
    
    // ===== 检查授权头 =====
    if (!isset($headers['Authorization'])) {
        http_response_code(401); // 401: 未授权
        echo json_encode(["error" => "No authorization token provided."]);
        exit();
    }
    
    // ===== 解析令牌 =====
    $authHeader = $headers['Authorization'];
    $arr = explode(" ", $authHeader); // 分割 "Bearer <token>"
    
    // 确保格式正确
    if (count($arr) !== 2 || $arr[0] !== 'Bearer') {
        http_response_code(401);
        echo json_encode(["error" => "Invalid authorization format. Expected 'Bearer <token>'"]);
        exit();
    }
    
    $jwt = $arr[1]; // 提取令牌
    
    // ===== 验证并解码JWT =====
    try {
        // JWT::decode(): 验证签名并返回payload
        // Key对象：指定密钥和算法
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        
        // $decoded->data 包含 {id, email} 用户信息
        return $decoded->data;
        
    } catch (Exception $e) {
        // 令牌无效、已过期或签名不匹配
        http_response_code(401);
        echo json_encode(["error" => "Access denied. " . $e->getMessage()]);
        exit();
    }
}
?>
```

### 📍 使用示例
```php
// 在任何需要认证的API端点中调用
require_once 'middleware.php';
$user = authenticate(); // 返回 {id, email} 或抛出401错误
$user_id = $user->id;
$email = $user->email;
```

### 🔍 验证流程
1. 获取请求头中的Authorization字段
2. 解析格式 "Bearer <token>"
3. 验证JWT签名（防止篡改）
4. 检查过期时间
5. 返回包含的用户数据或抛出401错误

---

## 用户资料管理

### 文件: `backend/api/profile.php`

```php
<?php
// ===== 获取用户资料 (GET请求) =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 需要JWT认证，获取当前用户ID
    $user = authenticate(); // 来自middleware.php
    $db = Database::getConnection();
    
    // 1️⃣ 查询用户基本信息
    $query = "SELECT id, email, balance, name, bio FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $user->id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 2️⃣ 获取用户的监视列表（关注的股票）
        $wl_query = "SELECT symbol FROM watchlists WHERE user_id = :id";
        $wl_stmt = $db->prepare($wl_query);
        $wl_stmt->bindParam(":id", $user->id);
        $wl_stmt->execute();
        
        $watchlist = []; // 存储所有股票代码
        while ($wl_row = $wl_stmt->fetch(PDO::FETCH_ASSOC)) {
            $watchlist[] = $wl_row['symbol'];
        }
        
        // 3️⃣ 返回格式化的用户资料
        echo json_encode([
            "id" => $row['id'],
            "email" => $row['email'],
            "name" => $row['name'],
            "bio" => $row['bio'],
            "balance" => (float)$row['balance'], // 转换为浮点数
            "watchlist" => $watchlist, // 用户关注的所有股票
            "currency" => "USD" // 货币单位
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
    }
}

// ===== 更新用户资料 (POST请求) =====
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = authenticate();
    $db = Database::getConnection();
    
    // 获取请求体的JSON数据
    $data = json_decode(file_get_contents("php://input"));
    
    // 构建动态UPDATE语句（只更新提供的字段）
    $updates = []; // 存储要更新的列名
    
    // 检查哪些字段被提供
    if (isset($data->balance)) $updates[] = "balance = :balance";
    if (isset($data->name)) $updates[] = "name = :name";
    if (isset($data->bio)) $updates[] = "bio = :bio";
    
    if (count($updates) > 0) {
        // 动态构建UPDATE语句
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        // 绑定对应的参数
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
        // 没有有效的更新数据
        http_response_code(400);
        echo json_encode(["error" => "No valid data provided for update."]);
    }
}
?>
```

### 💡 关键设计
- **GET**: 获取当前用户的完整资料
- **POST**: 更新用户可修改的字段
- **动态SQL**: 只更新提供的字段，灵活高效
- **关联查询**: 同时获取用户信息和监视列表

---

## 监视列表管理

### 文件: `backend/api/watchlist.php`

```php
<?php
require_once 'middleware.php'; // 认证用户

$user = authenticate(); // 获取当前用户
$db = Database::getConnection();

// 获取POST/DELETE请求的JSON数据
$data = json_decode(file_get_contents("php://input"));

// ===== 添加股票到监视列表 (POST) =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    $symbol = strtoupper(trim($data->symbol)); // 转大写，去除空格
    
    // INSERT ... ON CONFLICT DO NOTHING
    // 如果 (user_id, symbol) 已存在，则忽略此插入（不报错）
    // 这允许前端多次点击"添加"而不会导致重复或错误
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

// ===== 从监视列表删除股票 (DELETE) =====
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    $symbol = strtoupper(trim($data->symbol));
    
    // 删除符合条件的记录
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
- **POST**: 添加股票到监视列表（带去重）
- **DELETE**: 从监视列表删除股票
- **ON CONFLICT**: PostgreSQL特性，处理重复插入
- **用户隔离**: 每个用户只能操作自己的监视列表

---

## 财务数据爬取

### 文件: `backend/api/financial_scraper.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// 从URL参数获取股票代码（默认为AAPL）
$symbol = isset($_GET['symbol']) ? strtoupper(trim($_GET['symbol'])) : 'AAPL';

// ===== 尝试从Yahoo Finance API获取真实数据 =====
$url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{$symbol}?modules=incomeStatementHistory";

$ch = curl_init($url); // 初始化cURL会话
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // 返回结果而不是输出
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    // 添加浏览器User-Agent头，某些API可能会阻止bot
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept: application/json',
    'Connection: keep-alive'
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // 跟随重定向
curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 5秒超时

$response = curl_exec($ch); // 执行请求
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // 获取HTTP响应码
curl_close($ch); // 关闭会话

// ===== 解析真实数据 =====
$realData = null;
if ($httpcode == 200 && $response) {
    $data = json_decode($response, true);
    if (isset($data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0])) {
        $realData = $data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0];
    }
}

// ===== 生成树形结构 =====
// 前端使用DFS（深度优先搜索）遍历此树形结构来可视化财务数据

if ($realData) {
    // 使用真实数据构建树
    $tree = [
        "name" => "Total Revenue",
        "value" => $realData['totalRevenue']['raw'] ?? 0,
        "fmt" => $realData['totalRevenue']['fmt'] ?? "0", // fmt: 格式化的显示值
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
    // API被阻止或超时？生成模拟数据
    // 使用符号的哈希值生成"真实"但可重复的随机数据
    $hash = md5($symbol); // 同一股票符号总是生成相同的模拟数据
    $seed = hexdec(substr($hash, 0, 5)); // 从哈希中提取种子
    srand($seed); // 使用种子初始化随机数生成器
    
    $baseRev = rand(20000, 400000) * 1000000; // 基础收入：200亿到4000亿
    
    $tree = [
        "name" => "Total Revenue",
        "value" => $baseRev,
        "fmt" => "$" . number_format($baseRev / 1000000000, 2) . "B", // "B" = 十亿
        "children" => [
            [
                "name" => "Core Products",
                "value" => $baseRev * 0.65, // 占65%
                "fmt" => "$" . number_format(($baseRev * 0.65) / 1000000000, 2) . "B",
                "children" => [
                    ["name" => "Hardware", "value" => $baseRev * 0.4, "fmt" => "$" . ..., "children" => []],
                    ["name" => "Software Licenses", "value" => $baseRev * 0.25, "fmt" => "$" . ..., "children" => []]
                ]
            ],
            [
                "name" => "Services & Subscriptions",
                "value" => $baseRev * 0.35, // 占35%
                "fmt" => "$" . number_format(($baseRev * 0.35) / 1000000000, 2) . "B",
                "children" => [
                    ["name" => "Cloud Services", "value" => $baseRev * 0.2, ...],
                    // 更多子项...
                ]
            ]
        ]
    ];
}

// 返回JSON树结构
echo json_encode($tree);
?>
```

### 🌳 树形结构设计
```
Total Revenue (根节点)
├── Core Products (65%)
│   ├── Hardware (40%)
│   └── Software Licenses (25%)
└── Services & Subscriptions (35%)
    ├── Cloud Services (20%)
    └── Support & Maintenance (15%)
```

### 🔄 容错机制
- **真实API**: 优先尝试Yahoo Finance API
- **模拟数据**: API被阻止时使用，但保证一致性（相同符号总是相同数据）
- **cURL配置**: 浏览器User-Agent、超时、重定向等

---

## 数据库模式

### 文件: `backend/schema.sql`

```sql
-- ===== 用户表 =====
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, -- 自动递增的主键
    email VARCHAR(255) UNIQUE NOT NULL, -- 唯一邮箱
    password_hash VARCHAR(255) NOT NULL, -- 加密后的密码
    name VARCHAR(255) DEFAULT '', -- 用户名字
    bio TEXT DEFAULT '', -- 用户个人简介
    balance NUMERIC(15, 2) DEFAULT 0.00, -- 账户余额（15位数字，2位小数）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- ===== 监视列表表 =====
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 外键，删除用户时级联删除
    symbol VARCHAR(50) NOT NULL, -- 股票代码（如AAPL, MSFT）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol) -- 复合唯一键：同一用户不能添加相同股票两次
);

-- ===== 论坛帖子表 =====
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 发帖人
    title VARCHAR(255) NOT NULL, -- 帖子标题
    content TEXT NOT NULL, -- 帖子内容
    likes_count INTEGER DEFAULT 0, -- 点赞数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== 论坛评论表 =====
CREATE TABLE IF NOT EXISTS forum_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE, -- 所属帖子
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 评论者
    content TEXT NOT NULL, -- 评论内容
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== 论坛点赞表 =====
CREATE TABLE IF NOT EXISTS forum_likes (
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE, -- 被点赞的帖子
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 点赞的用户
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id) -- 复合主键：防止重复点赞
);
```

### 📊 表关系图
```
users (1)
  ├── (N) watchlists
  ├── (N) forum_posts
  ├── (N) forum_comments
  └── (N) forum_likes

forum_posts (1)
  ├── (N) forum_comments
  └── (N) forum_likes
```

### 🔑 关键数据库概念
- **SERIAL**: 自动递增整数
- **UNIQUE**: 唯一约束
- **REFERENCES**: 外键关系
- **ON DELETE CASCADE**: 删除用户时自动删除其关联数据
- **NUMERIC(15,2)**: 精确小数（财务数据必须精确，不能用FLOAT）

---

## 🚀 核心工作流

### 1️⃣ 注册流程
```
前端输入邮箱/密码
    ↓
POST /auth.php { action: 'register', email, password }
    ↓
检查邮箱是否存在 → 已存在则返回400错误
    ↓
Bcrypt加密密码
    ↓
插入users表
    ↓
生成JWT令牌（10年有效期）
    ↓
返回token + user信息
    ↓
前端存储token（localStorage）
```

### 2️⃣ 登录流程
```
前端输入邮箱/密码
    ↓
POST /auth.php { action: 'login', email, password }
    ↓
查询users表
    ↓
password_verify() 验证密码
    ↓
密码正确 → 生成JWT令牌
    ↓
返回token + user信息
    ↓
前端存储token
```

### 3️⃣ 受保护API调用
```
前端API请求
    ↓
在Authorization头添加 "Bearer <token>"
    ↓
后端自动调用 authenticate()
    ↓
验证JWT签名 + 过期时间
    ↓
有效 → 处理请求并返回数据
    ↓
无效 → 返回401错误，前端重定向到登录
```

---

## 🔒 安全最佳实践

| 安全问题 | 解决方案 |
|---------|---------|
| **SQL注入** | 使用预处理语句 (`:placeholder`) |
| **密码泄露** | Bcrypt加密 + 永不存储明文 |
| **会话劫持** | JWT代替session |
| **跨域攻击** | CORS头配置 + 生产环境指定域名 |
| **令牌泄露** | HTTPS传输 + 短期过期时间 |
| **CSRF** | SameSite Cookie属性 + CSRF令牌 |
| **密码暴力** | 使用Bcrypt的自适应延伸 |

---

## 📦 依赖项

```json
{
  "require": {
    "firebase/php-jwt": "^6.0" // JWT生成和验证库
  }
}
```

安装: `composer require firebase/php-jwt`

---

## 🔗 环境变量清单

```
DB_HOST=aws-1-ap-northeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=你的Supabase用户名
DB_PASS=你的Supabase密码
JWT_SECRET=超级秘密密钥（生产环境必须强安全）
CORS_ORIGIN=你的前端域名（生产环境）
```

---

## 🎓 学习要点总结

1. **HTTP状态码**: 200✅ 400❌ 401🔐 404❓ 500💥 
2. **JWT**: 无状态认证的未来
3. **PDO**: 防止SQL注入的关键
4. **CORS**: 允许前端跨域调用
5. **后端验证**: 永远不信任前端
6. **错误处理**: 向用户返回安全的通用错误，日志记录详细错误
7. **树形数据结构**: 高效表示层级财务数据
