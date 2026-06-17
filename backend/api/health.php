<?php
// backend/api/health.php
// 用於監控服務 (如 cron-job.org) 定期呼叫，防止 Render 和 Supabase 進入休眠

require_once '../config/db.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    // 執行一個最簡單的查詢，觸發 Supabase 的活動記錄
    $stmt = $pdo->query("SELECT 1");
    if ($stmt) {
        echo json_encode([
            "status" => "ok",
            "message" => "Render and Supabase are both awake!",
            "timestamp" => date("Y-m-d H:i:s")
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to query database"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed",
        "error" => $e->getMessage()
    ]);
}
