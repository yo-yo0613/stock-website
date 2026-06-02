<?php
// 資料庫連接組態檔

// ===== Supabase PostgreSQL 連接參數 =====
define('DB_HOST', 'aws-1-ap-northeast-1.pooler.supabase.com'); // 資料庫伺服器位址
define('DB_PORT', '5432'); // PostgreSQL 埠號（5432 可繞過防火牆）
define('DB_NAME', 'postgres'); // 資料庫名稱
define('DB_USER', 'postgres.pezwarnweoafcrxjbdoy'); // 資料庫使用者名稱
define('DB_PASS', 'Yoyo0613@@@@'); // 資料庫密碼

// ===== JWT 密鑰（用於生成和驗證使用者令牌）=====
define('JWT_SECRET', 'your_super_secret_jwt_key_change_this_before_deploying'); // ⚠️ 生產環境必須修改

class Database {
    private static $conn = null; // 單例模式：存儲資料庫連接

    public static function getConnection() {
        // 如果連接不存在，則建立新連接
        if (self::$conn === null) {
            try {
                // 從使用者名稱中提取項目引用
                $project_ref = explode('.', DB_USER)[1];
                
                // 構建資料來源名稱(DSN)：PostgreSQL 連接字串
                $dsn = "pgsql:host=" . DB_HOST . 
                       ";port=" . DB_PORT . 
                       ";dbname=" . DB_NAME . 
                       ";sslmode=prefer;options=endpoint=$project_ref";
                
                // 建立 PDO 連接物件
                self::$conn = new PDO($dsn, DB_USER, DB_PASS, array(
                    PDO::ATTR_PERSISTENT => true // 持久連接組態
                ));
                
                // 組態 PDO 錯誤處理模式（異常模式）
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // 組態查詢結果傳回格式（關聯陣列）
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
            } catch(PDOException $exception) {
                // 連接失敗處理
                http_response_code(500);
                echo json_encode(["error" => "Database connection error: " . $exception->getMessage()]);
                exit;
            }
        }
        
        // 傳回資料庫連接物件（單例）
        return self::$conn;
    }
}
?>
