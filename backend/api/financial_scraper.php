<?php
// 財務數據爬取 API - 從 Yahoo Finance 取得或生成股票財務資訊

// ===== 回應標頭設定 =====
header('Content-Type: application/json'); // 回應格式為 JSON
header('Access-Control-Allow-Origin: *'); // 允許跨域請求

// ===== 第 1 步：取得並規範化股票代號 =====
// 查詢參數格式：?symbol=AAPL
// 預設值：AAPL（蘋果公司）
$symbol = isset($_GET['symbol']) ? strtoupper(trim($_GET['symbol'])) : 'AAPL';

// ===== 第 2 步：準備 cURL 請求 =====
// 嘗試從 Yahoo Finance API 取得真實財務數據
$url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{$symbol}?modules=incomeStatementHistory";

// 初始化 cURL 會話
$ch = curl_init($url);

// cURL 選項設定
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // 傳回回應而不是直接輸出
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    // 設定 User-Agent 為瀏覽器特徵，繞過某些簡單的反爬蟲機制
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept: application/json',
    'Connection: keep-alive'
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // 跟隨重定向（HTTP 301, 302 等）
curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 5 秒超時限制

// ===== 第 3 步：執行 cURL 請求 =====
$response = curl_exec($ch); // 執行請求並取得回應
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // 取得 HTTP 狀態碼
curl_close($ch); // 關閉 cURL 會話

// ===== 第 4 步：解析真實數據 =====
$realData = null;
if ($httpcode == 200 && $response) {
    // HTTP 200：請求成功
    $data = json_decode($response, true); // 將 JSON 回應轉為 PHP 陣列
    
    // 導航複雜的嵌套結構
    // 路徑：quoteSummary → result → [0] → incomeStatementHistory → incomeStatementHistory → [0]
    if (isset($data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0])) {
        $realData = $data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0];
    }
}

// ===== 第 5 步：構建樹形結構（用於前端 DFS 演算法） =====
// 前端使用深度優先搜尋 (Depth-First Search) 遍歷此樹來可視化財務數據

if ($realData) {
    // ===== 情況 A：使用真實 API 數據 =====
    $tree = [
        "name" => "Total Revenue", // 總收入（根節點）
        "value" => $realData['totalRevenue']['raw'] ?? 0, // 原始數值（用於計算）
        "fmt" => $realData['totalRevenue']['fmt'] ?? "0", // 格式化數值（用於顯示）
        "children" => [
            [
                "name" => "Operating Income", // 營運收入
                "value" => $realData['operatingIncome']['raw'] ?? 0,
                "fmt" => $realData['operatingIncome']['fmt'] ?? "0",
                "children" => []
            ],
            [
                "name" => "Cost of Revenue", // 收入成本
                "value" => $realData['costOfRevenue']['raw'] ?? 0,
                "fmt" => $realData['costOfRevenue']['fmt'] ?? "0",
                "children" => []
            ]
        ]
    ];
    
} else {
    // ===== 情況 B：API 被阻止或超時，生成模擬數據 =====
    // 原因：
    // - Yahoo Finance 返回 429（太多請求）
    // - 伺服器被阻止
    // - 網路超時
    
    // 使用股票代號生成可重複的隨機數據
    // 同一股票符號總是生成相同的模擬數據（一致性）
    $hash = md5($symbol); // 對股票代號進行 MD5 雜湊
    $seed = hexdec(substr($hash, 0, 5)); // 從雜湊提取前 5 個十六進制字符作為種子
    srand($seed); // 初始化隨機數生成器（使用種子保證可重複）
    
    // 生成基礎收入：2000 億到 4000 億美元
    $baseRev = rand(20000, 400000) * 1000000;
    
    // ===== 構建多層級樹形結構 =====
    // 層級：
    // - 根：总收入 (100%)
    //   - 核心產品 (65%)
    //     - 硬體 (40%)
    //     - 軟體授權 (25%)
    //   - 服務與訂閱 (35%)
    //     - 雲服務 (20%)
    //     - 支援與維護 (15%)
    
    $tree = [
        "name" => "Total Revenue",
        "value" => $baseRev,
        "fmt" => "$" . number_format($baseRev / 1000000000, 2) . "B", // "B" 表示十億
        "children" => [
            [
                "name" => "Core Products", // 佔總收入的 65%
                "value" => $baseRev * 0.65,
                "fmt" => "$" . number_format(($baseRev * 0.65) / 1000000000, 2) . "B",
                "children" => [
                    [
                        "name" => "Hardware", // 佔核心產品的 40%
                        "value" => $baseRev * 0.4,
                        "fmt" => "$" . number_format(($baseRev * 0.4) / 1000000000, 2) . "B",
                        "children" => []
                    ],
                    [
                        "name" => "Software Licenses", // 佔核心產品的 25%
                        "value" => $baseRev * 0.25,
                        "fmt" => "$" . number_format(($baseRev * 0.25) / 1000000000, 2) . "B",
                        "children" => []
                    ]
                ]
            ],
            [
                "name" => "Services & Subscriptions", // 佔總收入的 35%
                "value" => $baseRev * 0.35,
                "fmt" => "$" . number_format(($baseRev * 0.35) / 1000000000, 2) . "B",
                "children" => [
                    [
                        "name" => "Cloud Services", // 佔服務的 20%
                        "value" => $baseRev * 0.2,
                        "fmt" => "$" . number_format(($baseRev * 0.2) / 1000000000, 2) . "B",
                        "children" => []
                    ],
                    [
                        "name" => "Support & Maintenance", // 佔服務的 15%
                        "value" => $baseRev * 0.15,
                        "fmt" => "$" . number_format(($baseRev * 0.15) / 1000000000, 2) . "B",
                        "children" => []
                    ]
                ]
            ]
        ]
    ];
}

// ===== 第 6 步：構建最終回應並傳回 JSON =====
echo json_encode([
    "success" => true,
    "symbol" => $symbol, // 查詢的股票代號
    "source" => $realData ? "Yahoo API (Real)" : "Heuristic Model (Mock Fallback)", // 數據來源說明
    "tree" => $tree // 樹形財務結構
]);
?>
