<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$symbol = isset($_GET['symbol']) ? strtoupper(trim($_GET['symbol'])) : 'AAPL';

// Try to fetch from Yahoo Finance API with browser headers to bypass simple blocks
$url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{$symbol}?modules=incomeStatementHistory";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept: application/json',
    'Connection: keep-alive'
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$realData = null;
if ($httpcode == 200 && $response) {
    $data = json_decode($response, true);
    if (isset($data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0])) {
        $realData = $data['quoteSummary']['result'][0]['incomeStatementHistory']['incomeStatementHistory'][0];
    }
}

// Convert data to a proper Tree Structure for DFS in frontend
// If real data failed (429 or blocked), generate a dynamic tree structure based on the symbol
if ($realData) {
    $tree = [
        "name" => "Total Revenue",
        "value" => $realData['totalRevenue']['raw'] ?? 0,
        "fmt" => $realData['totalRevenue']['fmt'] ?? "0",
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
    // Fallback: Dynamic realistic mock if API blocks us, to ensure the frontend DFS algorithm works
    $hash = md5($symbol);
    $seed = hexdec(substr($hash, 0, 5));
    srand($seed);
    $baseRev = rand(20000, 400000) * 1000000;
    
    $tree = [
        "name" => "Total Revenue",
        "value" => $baseRev,
        "fmt" => "$" . number_format($baseRev / 1000000000, 2) . "B",
        "children" => [
            [
                "name" => "Core Products",
                "value" => $baseRev * 0.65,
                "fmt" => "$" . number_format(($baseRev * 0.65) / 1000000000, 2) . "B",
                "children" => [
                    ["name" => "Hardware", "value" => $baseRev * 0.4, "fmt" => "$" . number_format(($baseRev * 0.4) / 1000000000, 2) . "B", "children" => []],
                    ["name" => "Software Licenses", "value" => $baseRev * 0.25, "fmt" => "$" . number_format(($baseRev * 0.25) / 1000000000, 2) . "B", "children" => []]
                ]
            ],
            [
                "name" => "Services & Subscriptions",
                "value" => $baseRev * 0.35,
                "fmt" => "$" . number_format(($baseRev * 0.35) / 1000000000, 2) . "B",
                "children" => [
                    ["name" => "Cloud Services", "value" => $baseRev * 0.2, "fmt" => "$" . number_format(($baseRev * 0.2) / 1000000000, 2) . "B", "children" => []],
                    ["name" => "Support & Maintenance", "value" => $baseRev * 0.15, "fmt" => "$" . number_format(($baseRev * 0.15) / 1000000000, 2) . "B", "children" => []]
                ]
            ]
        ]
    ];
}

echo json_encode([
    "success" => true,
    "symbol" => $symbol,
    "source" => $realData ? "Yahoo API (Real)" : "Heuristic Model (Mock Fallback)",
    "tree" => $tree
]);
?>
