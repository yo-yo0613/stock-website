<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$user = 'postgres.pezwarnweoafcrxjbdoy';
$pass = 'Yoyo0613@@@@';
$regions = [
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-ap-northeast-1.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-ap-southeast-2.pooler.supabase.com'
];

foreach ($regions as $host) {
    echo "Testing $host... \n";
    $dsn = "pgsql:host=$host;port=5432;dbname=postgres;sslmode=require;connect_timeout=3";
    try {
        $conn = //($dsn, $user, $pass);
        echo "SUCCESS on $host!\n";
        break;
    } catch (PDOException $e) {
        echo "Failed: " . $e->getMessage() . "\n";
    }
    echo "--------------------------\n";
}
?>
