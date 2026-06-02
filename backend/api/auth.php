<?php
// 使用者認證 API 端點（註冊 / 登入）

// ===== CORS 標頭設定 =====
// 允許跨域請求（讓 React 前端可以呼叫此 API）
header("Access-Control-Allow-Origin: *"); // 生產環境需改為實際域名
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ===== 處理 CORS 預檢請求 =====
// 瀏覽器在實際 POST 前會先發送 OPTIONS 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== 載入必要模組 =====
require_once '../config/db.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;

// ===== 初始化連接和資料 =====
$db = Database::getConnection(); // 取得資料庫連接
$data = json_decode(file_get_contents("php://input")); // 讀取 POST 請求的 JSON 資料

// ===== 驗證必要欄位 =====
if (!isset($data->action) || !isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Incomplete data. Required: action (login/register), email, password."]);
    exit();
}

$email = trim($data->email);
$password = $data->password;
$action = $data->action; // 'register' 或 'login'

// ===== 註冊流程 =====
if ($action === 'register') {
    // 1️⃣ 檢查郵箱是否已存在
    $check_query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($check_query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Email already exists."]);
        exit();
    }

    // 2️⃣ 使用 Bcrypt 雜湊密碼
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    // 3️⃣ 插入新使用者記錄
    $insert_query = "INSERT INTO users (email, password_hash, balance) VALUES (:email, :password_hash, 100000.00) RETURNING id";
    $stmt = $db->prepare($insert_query);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);
    
    if ($stmt->execute()) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $user_id = $row['id'];
        
        // 4️⃣ 生成 JWT 令牌
        $token = generateJWT($user_id, $email);
        
        http_response_code(201);
        echo json_encode([
            "message" => "User registered successfully.",
            "token" => $token,
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Unable to register user."]);
    }

// ===== 登入流程 =====
} elseif ($action === 'login') {
    // 查詢使用者記錄
    $query = "SELECT id, email, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 驗證密碼
        if (password_verify($password, $row['password_hash'])) {
            // 密碼正確，生成 JWT 令牌
            $token = generateJWT($row['id'], $row['email']);
            
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful.",
                "token" => $token,
                "user" => ["id" => $row['id'], "email" => $row['email']]
            ]);
        } else {
            // 密碼錯誤
            http_response_code(401);
            echo json_encode(["error" => "Invalid password."]);
        }
    } else {
        // 郵箱未找到
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
    }

// ===== 無效的 action 參數 =====
} else {
    http_response_code(400);
    echo json_encode(["error" => "Invalid action."]);
}

/**
 * 生成 JWT 令牌
 * 
 * @param int $user_id 使用者 ID
 * @param string $email 使用者郵箱
 * @return string JWT 令牌
 */
function generateJWT($user_id, $email) {
    // 取得目前時間戳記
    $issuedAt = time();
    
    // JWT 有效期限：7 天
    $expirationTime = $issuedAt + (3600 * 24 * 7);
    
    // 建立令牌負載（包含使用者資訊）
    $payload = array(
        "iat" => $issuedAt, // 發行時間
        "exp" => $expirationTime, // 過期時間
        "data" => array(
            "id" => $user_id,
            "email" => $email
        )
    );
    
    // 使用 JWT_SECRET 密鑰和 HS256 演算法簽署令牌
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}
?>
