<?php
// 使用者個人資料 API 端點（取得 / 更新）

// ===== CORS 標頭設定 =====
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ===== 處理 CORS 預檢請求 =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== 認證使用者 =====
require_once 'middleware.php'; // 引入認證中介軟體
$user = authenticate(); // 驗證 JWT 令牌，若失敗則終止（401 錯誤）
$db = Database::getConnection(); // 取得資料庫連接

// ===== GET 請求：取得使用者個人資料 =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 1️⃣ 查詢使用者基本資訊
    $query = "SELECT id, email, balance, name, bio FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $user->id); // 使用認證令牌中的使用者 ID
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 2️⃣ 取得使用者的關注清單（監視列表）
        $wl_query = "SELECT symbol FROM watchlists WHERE user_id = :id";
        $wl_stmt = $db->prepare($wl_query);
        $wl_stmt->bindParam(":id", $user->id);
        $wl_stmt->execute();
        
        // 3️⃣ 組合所有股票代號到陣列
        $watchlist = [];
        while ($wl_row = $wl_stmt->fetch(PDO::FETCH_ASSOC)) {
            $watchlist[] = $wl_row['symbol'];
        }
        
        // 4️⃣ 回傳格式化為 React 前端預期的 JSON 格式
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
        // 使用者不存在
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
    }

// ===== POST 請求：更新使用者個人資料 =====
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 取得 POST 請求中的 JSON 資料
    $data = json_decode(file_get_contents("php://input"));
    
    // ===== 第 1 步：動態建構 UPDATE 語句 =====
    // 只更新前端提供的欄位（彈性更新）
    $updates = []; // 存儲要更新的欄位
    
    if (isset($data->balance)) $updates[] = "balance = :balance";
    if (isset($data->name)) $updates[] = "name = :name";
    if (isset($data->bio)) $updates[] = "bio = :bio";
    
    // ===== 第 2 步：執行更新（若有欄位需要更新） =====
    if (count($updates) > 0) {
        // 動態組合 UPDATE 語句
        // 例如："UPDATE users SET balance = :balance, name = :name WHERE id = :id"
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        // 綁定參數
        if (isset($data->balance)) $stmt->bindParam(":balance", $data->balance);
        if (isset($data->name)) $stmt->bindParam(":name", $data->name);
        if (isset($data->bio)) $stmt->bindParam(":bio", $data->bio);
        $stmt->bindParam(":id", $user->id); // 只能更新自己的資料
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Profile updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update profile."]);
        }
    } else {
        // 沒有提供有效的更新資料
        http_response_code(400);
        echo json_encode(["error" => "No valid data provided for update."]);
    }

// ===== 其他 HTTP 方法：不允許 =====
} else {
    http_response_code(405); // 405: 方法不允許
    echo json_encode(["error" => "Method not allowed."]);
}
?>
