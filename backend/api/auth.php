<?php
// backend/api/auth.php

// CORS Headers - Allow your React frontend to communicate with this API
header("Access-Control-Allow-Origin: *"); // For production, change * to your actual domain (e.g., https://your-vercel-app.com)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';
// Make sure to run `composer require firebase/php-jwt` in the backend folder
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;

// Get Database Connection
$db = Database::getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->action) || !isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Incomplete data. Required: action (login/register), email, password."]);
    exit();
}

$email = trim($data->email);
$password = $data->password;
$action = $data->action;

if ($action === 'register') {
    // 1. Check if user already exists
    $check_query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($check_query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Email already exists."]);
        exit();
    }

    // 2. Hash the password
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    // 3. Insert new user
    $insert_query = "INSERT INTO users (email, password_hash, balance) VALUES (:email, :password_hash, 100000.00) RETURNING id";
    $stmt = $db->prepare($insert_query);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);
    
    if ($stmt->execute()) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $user_id = $row['id'];
        
        // Generate JWT
        $token = generateJWT($user_id, $email);
        
        http_response_code(201);
        echo json_encode([
            "message" => "User registered successfully.",
            "token" => $token,
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Unable to register user."]);
    }

} elseif ($action === 'login') {
    
    $query = "SELECT id, email, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password
        if (password_verify($password, $row['password_hash'])) {
            // Password is correct, generate JWT
            $token = generateJWT($row['id'], $row['email']);
            
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful.",
                "token" => $token,
                "user" => ["id" => $row['id'], "email" => $row['email']]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid password."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found."]);
    }

} else {
    http_response_code(400);
    echo json_encode(["error" => "Invalid action."]);
}

function generateJWT($user_id, $email) {
    $issuedAt = time();
    $expirationTime = $issuedAt + 3600 * 24 * 7;  // jwt valid for 7 days
    
    $payload = array(
        "iat" => $issuedAt,
        "exp" => $expirationTime,
        "data" => array(
            "id" => $user_id,
            "email" => $email
        )
    );
    
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}
?>
