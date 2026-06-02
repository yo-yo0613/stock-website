<?php
// 認證中介軟體 - 驗證 JWT 令牌

// ===== 載入必要模組 =====
require_once '../vendor/autoload.php';
require_once '../config/db.php';
use \Firebase\JWT\JWT; // JWT 解碼類別
use \Firebase\JWT\Key; // JWT 密鑰類別

/**
 * authenticate() 函式
 * 
 * 功能：
 * - 從 HTTP 請求頭提取 JWT 令牌
 * - 驗證令牌簽名和有效期
 * - 提取並傳回使用者資訊
 * 
 * @return stdClass 使用者物件 {id, email}
 * @throws 若令牌無效或過期，終止執行並傳回 401 錯誤
 * 
 * 使用方式：
 * require_once 'middleware.php';
 * $user = authenticate(); // 自動驗證，若失敗則終止
 * $user_id = $user->id;
 * $email = $user->email;
 */
function authenticate() {
    // ===== 第 1 步：取得請求標頭 =====
    // 從 HTTP 請求頭中讀取所有標頭
    $headers = apache_request_headers();
    
    // ===== 相容性處理（Nginx 伺服器） =====
    // 某些伺服器環境（如 Nginx）不支援 apache_request_headers()
    // 改為從 $_SERVER['HTTP_AUTHORIZATION'] 讀取
    if (!isset($headers['Authorization']) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
    }

    // ===== 檢查授權標頭是否存在 =====
    if (!isset($headers['Authorization'])) {
        // 401: 未授權（沒有提供令牌）
        http_response_code(401);
        echo json_encode(["error" => "No authorization token provided."]);
        exit();
    }

    // ===== 第 2 步：解析授權標頭 =====
    // 預期格式："Bearer <token>"
    // 例如："Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    $authHeader = $headers['Authorization'];
    $arr = explode(" ", $authHeader); // 用空格分割成兩部分

    // ===== 驗證格式正確性 =====
    // 檢查：
    // 1. 長度是否為 2（"Bearer" 和 "<token>"）
    // 2. 第一部分是否為 "Bearer"
    if (count($arr) !== 2 || $arr[0] !== 'Bearer') {
        http_response_code(401);
        echo json_encode(["error" => "Invalid authorization format. Expected 'Bearer <token>'"]);
        exit();
    }

    // 提取令牌部分
    $jwt = $arr[1];

    // ===== 第 3 步：驗證並解碼 JWT =====
    try {
        /**
         * JWT::decode() 方法：
         * 參數 1：$jwt - 要驗證的令牌字串
         * 參數 2：new Key(...) - 用於驗證簽名的密鑰物件
         *   - JWT_SECRET - 簽署令牌時使用的同一個密鑰
         *   - 'HS256' - 雜湊演算法
         * 
         * 驗證步驟：
         * 1. 檢查令牌簽名是否有效（用 JWT_SECRET 驗證）
         * 2. 檢查令牌是否過期（比較 exp 時間戳記）
         * 3. 解碼令牌中的資料
         * 
         * 若驗證失敗（簽名無效、過期等），拋出異常
         */
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        
        // 傳回使用者物件 {id, email}
        // 這是令牌生成時存放在 payload.data 中的資訊
        return $decoded->data;
        
    } catch (Exception $e) {
        // 驗證失敗的原因：
        // - 簽名無效（令牌被篡改）
        // - 令牌已過期
        // - 使用了錯誤的 JWT_SECRET
        // - 令牌格式不正確
        
        http_response_code(401);
        echo json_encode(["error" => "Access denied. " . $e->getMessage()]);
        exit();
    }
}
?>
