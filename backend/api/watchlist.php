<?php
// backend/api/watchlist.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'middleware.php';

$user = authenticate();
$db = Database::getConnection();

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add symbol to watchlist
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    $symbol = strtoupper(trim($data->symbol));
    
    $query = "INSERT INTO watchlists (user_id, symbol) VALUES (:user_id, :symbol) ON CONFLICT DO NOTHING";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user->id);
    $stmt->bindParam(":symbol", $symbol);
    
    if ($stmt->execute()) {
        echo json_encode(["message" => "Symbol added to watchlist.", "symbol" => $symbol]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to add symbol."]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Remove symbol from watchlist
    if (!isset($data->symbol)) {
        http_response_code(400);
        echo json_encode(["error" => "Symbol is required."]);
        exit();
    }
    
    $symbol = strtoupper(trim($data->symbol));
    
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

} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed."]);
}
?>
