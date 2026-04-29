<?php
error_reporting(E_ALL);
ini_set("display_errors", 1);
$user = "postgres.pezwarnweoafcrxjbdoy";
$pass = "Yoyo0613@@@@";
$host = "aws-1-ap-northeast-1.pooler.supabase.com";
$modes = ["require", "prefer", "disable"];
foreach ($modes as $mode) {
    echo "Testing sslmode=$mode...\n";
    $dsn = "pgsql:host=$host;port=5432;dbname=postgres;sslmode=$mode;options=endpoint=pezwarnweoafcrxjbdoy";
    try {
        $conn = new PDO($dsn, $user, $pass);
        echo "SUCCESS on $mode!\n";
    } catch (PDOException $e) {
        echo "Failed: " . $e->getMessage() . "\n";
    }
}
