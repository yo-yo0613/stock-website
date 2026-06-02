<?php
// 監視列表 API 端點（新增 / 刪除股票）

// ===== CORS 標頭設定 =====
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ===== 處理 CORS 預檢請求 =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== 認證使用者並取得連接 =====
require_once 'middleware.php'; // 引入認證中介軟體
$user = authenticate(); // 驗證 JWT 令牌
$db = Database::getConnection(); // 取得資料庫連接

// 取得請求的 JSON 資料
$data = json_decode(file_get_contents("php://input"));

// ===== POST 請求：新增股票到監視列表 =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 驗證股票代號是否存在
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    // 規範化股票代號：轉大寫並移除空格
    // 例如："aapl  " → "AAPL"
    $symbol = strtoupper(trim($data->symbol));
    
    // 新增到監視列表
    // ON CONFLICT DO NOTHING：若 (user_id, symbol) 已存在，則忽略此插入
    // 防止重複新增及二次點擊錯誤
    $query = "INSERT INTO watchlists (user_id, symbol) VALUES (:user_id, :symbol) ON CONFLICT DO NOTHING";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user->id); // 使用認證令牌中的使用者 ID
    $stmt->bindParam(":symbol", $symbol);
    
    if ($stmt->execute()) {
        // 成功新增或已存在（都不報錯）
        echo json_encode(["message" => "Symbol added to watchlist.", "symbol" => $symbol]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to add symbol."]);
    }

// ===== DELETE 請求：從監視列表移除股票 =====
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // 驗證股票代號是否存在
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    // 規範化股票代號
    $symbol = strtoupper(trim($data->symbol));
    
    // 刪除監視列表中的記錄
    // WHERE 條件同時檢查使用者 ID 和股票代號（確保安全性，只刪除自己的記錄）
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

// ===== 其他 HTTP 方法：不允許 =====
} else {
    http_response_code(405); // 405: 方法不允許
    echo json_encode(["error" => "Method not allowed."]);
}
?>
