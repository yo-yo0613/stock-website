<?php
require_once __DIR__ . '/config/db.php';
$db = Database::getConnection();
try {
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT ''");
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''");
    echo "Migration successful\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
