<?php
// backend/api/profile.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'middleware.php';

// Authenticate user via JWT
$user = authenticate();
$db = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user profile
    $query = "SELECT id, email, balance, name, bio FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $user->id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Also fetch watchlist symbols
        $wl_query = "SELECT symbol FROM watchlists WHERE user_id = :id";
        $wl_stmt = $db->prepare($wl_query);
        $wl_stmt->bindParam(":id", $user->id);
        $wl_stmt->execute();
        
        $watchlist = [];
        while ($wl_row = $wl_stmt->fetch(PDO::FETCH_ASSOC)) {
            $watchlist[] = $wl_row['symbol'];
        }
        
        // Format the response to match the React frontend's expectations
        echo json_encode([
            "id" => $row['id'],
            "email" => $row['email'],
            "name" => $row['name'],
            "bio" => $row['bio'],
            "balance" => (float)$row['balance'],
            "watchlist" => $watchlist,
            "currency" => "USD"
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update user profile
    $data = json_decode(file_get_contents("php://input"));
    
    $updates = [];
    if (isset($data->balance)) $updates[] = "balance = :balance";
    if (isset($data->name)) $updates[] = "name = :name";
    if (isset($data->bio)) $updates[] = "bio = :bio";
    
    if (count($updates) > 0) {
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        if (isset($data->balance)) $stmt->bindParam(":balance", $data->balance);
        if (isset($data->name)) $stmt->bindParam(":name", $data->name);
        if (isset($data->bio)) $stmt->bindParam(":bio", $data->bio);
        $stmt->bindParam(":id", $user->id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Profile updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update profile."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "No valid data provided for update."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed."]);
}
?>
