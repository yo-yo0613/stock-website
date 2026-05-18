<?php
// Simple News Proxy Scraper
error_reporting(0); // Suppress DOM warnings for malformed HTML

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$url = $_GET['url'] ?? '';

if (!$url) {
    http_response_code(400);
    echo json_encode(["error" => "Missing URL"]);
    exit;
}

// Use cURL to fetch the HTML content, acting like a real browser
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language: en-US,en;q=0.5',
    'Sec-Fetch-Dest: document',
    'Sec-Fetch-Mode: navigate',
    'Sec-Fetch-Site: none',
    'Sec-Fetch-User: ?1',
    'Upgrade-Insecure-Requests: 1'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$html = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$html || $httpcode !== 200) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch article from source. HTTP Code: " . $httpcode]);
    exit;
}

// Extract the article body
$doc = new DOMDocument();
@$doc->loadHTML($html);
$xpath = new DOMXPath($doc);

// Try multiple common article body class names
$queries = [
    '//div[contains(@class, "caas-body")]',
    '//div[contains(@class, "body yf-")]',
    '//div[contains(@class, "article-body")]',
    '//article',
    '//div[contains(@class, "body")]'
];

$bodyHtml = '';
foreach ($queries as $query) {
    $nodes = $xpath->query($query);
    if ($nodes && $nodes->length > 0) {
        $children = $nodes->item(0)->childNodes;
        foreach ($children as $child) {
            $bodyHtml .= $doc->saveHTML($child);
        }
        break; // Found it, stop searching
    }
}

if ($bodyHtml !== '') {
    // Basic cleanup
    $bodyHtml = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $bodyHtml);
    $bodyHtml = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $bodyHtml);
    $bodyHtml = preg_replace('#<iframe(.*?)></iframe>#is', '', $bodyHtml);
    // Remove Yahoo's "Read more" buttons or readmore divs
    $bodyHtml = preg_replace('#<div class="readmore(.*?)>(.*?)</div>#is', '', $bodyHtml);
    // Remove inline svgs and generic buttons that clutter the view
    $bodyHtml = preg_replace('#<svg(.*?)>(.*?)</svg>#is', '', $bodyHtml);
    $bodyHtml = preg_replace('#<button(.*?)>(.*?)</button>#is', '', $bodyHtml);
    $bodyHtml = preg_replace('#<a href="([^"]+)"([^>]*)>#i', '<a href="$1" target="_blank" rel="noreferrer" class="text-primary hover:underline"$2>', $bodyHtml);

    echo json_encode(["success" => true, "content" => $bodyHtml]);
} else {
    echo json_encode(["error" => "Could not extract article content from page."]);
}

