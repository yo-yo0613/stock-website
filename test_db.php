<?php require 'backend/config/db.php'; $c=Database::getConnection(); $s=$c->query('SELECT * FROM forum_posts'); print_r($s->fetchAll());
