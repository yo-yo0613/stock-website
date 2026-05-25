<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
http_response_code(200);

echo json_encode([
    "status" => "ok",
    "timestamp" => time(),
    "message" => "Server is awake!"
]);
?>
