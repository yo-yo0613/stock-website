<?php
// backend/api/yahoo_forecast.php
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$symbol = $_GET['symbol'] ?? '';

if (!$symbol) {
    http_response_code(400);
    echo json_encode(["error" => "Missing symbol parameter"]);
    exit;
}

// 1. Fetch Cookie
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://fc.yahoo.com');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
$response = curl_exec($ch);

$cookies = [];
preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
foreach($matches[1] as $item) {
    $cookies[] = $item;
}
$cookieStr = implode('; ', $cookies);

// 2. Fetch Crumb
curl_setopt($ch, CURLOPT_URL, 'https://query1.finance.yahoo.com/v1/test/getcrumb');
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_COOKIE, $cookieStr);
$crumb = curl_exec($ch);

if (!$crumb || strlen($crumb) > 20) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch Yahoo crumb token", "details" => $crumb]);
    curl_close($ch);
    exit;
}

// 3. Fetch Quote Summary Data
$modules = 'incomeStatementHistory,earnings,defaultKeyStatistics,financialData,earningsTrend';
$url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/" . urlencode($symbol) . "?modules=" . $modules . "&crumb=" . $crumb;

curl_setopt($ch, CURLOPT_URL, $url);
$data = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpcode !== 200 || !$data) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch Yahoo data. HTTP Code: " . $httpcode]);
    exit;
}

// Pass through the JSON
echo $data;
