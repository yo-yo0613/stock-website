<?php
// backend/config/db.php

// TODO: Replace these with your actual Supabase PostgreSQL connection details.
// You can find these in Supabase Dashboard -> Project Settings -> Database -> Connection string (URI)
define('DB_HOST', 'aws-1-ap-northeast-1.pooler.supabase.com'); // e.g. aws-0-ap-southeast-1.pooler.supabase.com
define('DB_PORT', '5432'); // Change to 5432 to bypass school firewalls blocking 6543
define('DB_NAME', 'postgres');
define('DB_USER', 'postgres.pezwarnweoafcrxjbdoy'); // Replace with your actual username
define('DB_PASS', 'Yoyo0613@@@@'); // Replace with your actual database password

// JWT Secret Key (Keep this extremely safe! Do not share it!)
define('JWT_SECRET', 'your_super_secret_jwt_key_change_this_before_deploying');

class Database {
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn === null) {
            try {
                // Adding options=endpoint=[project_ref] to bypass Windows PHP SNI issues with Supabase
                $project_ref = explode('.', DB_USER)[1]; 
                $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";sslmode=prefer;options=endpoint=$project_ref";
                self::$conn = new PDO($dsn, DB_USER, DB_PASS);
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch(PDOException $exception) {
                // Return a generic error message so we don't leak DB credentials in the error
                http_response_code(500);
                echo json_encode(["error" => "Database connection error: " . $exception->getMessage()]);
                exit;
            }
        }
        return self::$conn;
    }
}
?>
