<?php
// backend/api/middleware.php

require_once '../vendor/autoload.php';
require_once '../config/db.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

function authenticate() {
    $headers = apache_request_headers();
    
    // Fallback for Nginx or other servers
    if (!isset($headers['Authorization']) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(["error" => "No authorization token provided."]);
        exit();
    }

    $authHeader = $headers['Authorization'];
    $arr = explode(" ", $authHeader);

    // Ensure token format is "Bearer <token>"
    if (count($arr) !== 2 || $arr[0] !== 'Bearer') {
        http_response_code(401);
        echo json_encode(["error" => "Invalid authorization format. Expected 'Bearer <token>'"]);
        exit();
    }

    $jwt = $arr[1];

    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return $decoded->data; // Returns user object {id, email}
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["error" => "Access denied. " . $e->getMessage()]);
        exit();
    }
}
?>
