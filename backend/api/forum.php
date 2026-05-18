<?php
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config/db.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$user = authenticate();
$conn = Database::getConnection();

$action = $_GET['action'] ?? '';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'list') {
            $q = $_GET['q'] ?? '';
            $tag = $_GET['tag'] ?? '';
            
            $whereClause = "1=1";
            $params = [];
            
            if ($q) {
                $whereClause .= " AND (p.title LIKE ? OR p.content LIKE ?)";
                $params[] = "%$q%";
                $params[] = "%$q%";
            }
            if ($tag) {
                $whereClause .= " AND p.content LIKE ?";
                $params[] = "%#$tag%";
            }

            // Fetch posts with author name and comment count
            $stmt = $conn->prepare("
                SELECT p.id, p.title, p.content, p.likes_count, p.created_at, u.email as author, p.user_id,
                       (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count,
                       EXISTS(SELECT 1 FROM forum_likes WHERE post_id = p.id AND user_id = ?) as user_liked
                FROM forum_posts p
                JOIN users u ON p.user_id = u.id
                WHERE $whereClause
                ORDER BY p.created_at DESC
            ");
            $allParams = array_merge([$user->id], $params);
            $stmt->execute($allParams);
            echo json_encode($stmt->fetchAll());
        } elseif ($action === 'get_post') {
            $postId = $_GET['id'] ?? 0;
            $stmt = $conn->prepare("
                SELECT p.id, p.title, p.content, p.likes_count, p.created_at, u.email as author, p.user_id,
                       EXISTS(SELECT 1 FROM forum_likes WHERE post_id = p.id AND user_id = ?) as user_liked
                FROM forum_posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            ");
            $stmt->execute([$user->id, $postId]);
            $post = $stmt->fetch();

            if (!$post) {
                http_response_code(404);
                echo json_encode(["error" => "Post not found"]);
                exit;
            }

            // Fetch comments
            $stmt = $conn->prepare("
                SELECT c.id, c.content, c.created_at, u.email as author, c.user_id
                FROM forum_comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC
            ");
            $stmt->execute([$postId]);
            $comments = $stmt->fetchAll();

            $post['comments'] = $comments;
            echo json_encode($post);
        } elseif ($action === 'get_user_profile') {
            $userId = $_GET['user_id'] ?? 0;
            $stmt = $conn->prepare("SELECT id, email, name, bio, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $userProfile = $stmt->fetch();
            if (!$userProfile) {
                http_response_code(404);
                echo json_encode(["error" => "User not found"]);
                exit;
            }
            
            // fetch posts
            $stmt = $conn->prepare("
                SELECT p.id, p.title, p.content, p.likes_count, p.created_at, u.email as author, p.user_id,
                       (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count,
                       EXISTS(SELECT 1 FROM forum_likes WHERE post_id = p.id AND user_id = ?) as user_liked
                FROM forum_posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([$user->id, $userId]);
            $posts = $stmt->fetchAll();
            $userProfile['posts'] = $posts;
            
            echo json_encode($userProfile);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if ($action === 'create') {
            $title = $input['title'] ?? ''; // Optional now
            $content = $input['content'] ?? '';
            if (!$content) {
                http_response_code(400);
                echo json_encode(["error" => "Content required"]);
                exit;
            }
            $stmt = $conn->prepare("INSERT INTO forum_posts (user_id, title, content) VALUES (?, ?, ?)");
            $stmt->execute([$user->id, $title, $content]);
            echo json_encode(["success" => true, "id" => $conn->lastInsertId()]);
        } elseif ($action === 'comment') {
            $postId = $input['post_id'] ?? 0;
            $content = $input['content'] ?? '';
            if (!$postId || !$content) {
                http_response_code(400);
                echo json_encode(["error" => "Post ID and content required"]);
                exit;
            }
            $stmt = $conn->prepare("INSERT INTO forum_comments (post_id, user_id, content) VALUES (?, ?, ?)");
            $stmt->execute([$postId, $user->id, $content]);
            echo json_encode(["success" => true]);
        } elseif ($action === 'edit_post') {
            $postId = $input['id'] ?? 0;
            $content = $input['content'] ?? '';
            if (!$postId || !$content) {
                http_response_code(400);
                echo json_encode(["error" => "Post ID and content required"]);
                exit;
            }
            $stmt = $conn->prepare("UPDATE forum_posts SET content = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$content, $postId, $user->id]);
            echo json_encode(["success" => true]);
        } elseif ($action === 'delete_post') {
            $postId = $input['id'] ?? 0;
            $stmt = $conn->prepare("DELETE FROM forum_posts WHERE id = ? AND user_id = ?");
            $stmt->execute([$postId, $user->id]);
            echo json_encode(["success" => true]);
        } elseif ($action === 'edit_comment') {
            $commentId = $input['id'] ?? 0;
            $content = $input['content'] ?? '';
            if (!$commentId || !$content) {
                http_response_code(400);
                echo json_encode(["error" => "Comment ID and content required"]);
                exit;
            }
            $stmt = $conn->prepare("UPDATE forum_comments SET content = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$content, $commentId, $user->id]);
            echo json_encode(["success" => true]);
        } elseif ($action === 'delete_comment') {
            $commentId = $input['id'] ?? 0;
            $stmt = $conn->prepare("DELETE FROM forum_comments WHERE id = ? AND user_id = ?");
            $stmt->execute([$commentId, $user->id]);
            echo json_encode(["success" => true]);
        } elseif ($action === 'like') {
            $postId = $input['post_id'] ?? 0;
            if (!$postId) {
                http_response_code(400);
                echo json_encode(["error" => "Post ID required"]);
                exit;
            }
            
            // Check if already liked
            $stmt = $conn->prepare("SELECT 1 FROM forum_likes WHERE post_id = ? AND user_id = ?");
            $stmt->execute([$postId, $user->id]);
            $liked = $stmt->fetch();

            if ($liked) {
                // Unlike
                $conn->prepare("DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?")->execute([$postId, $user->id]);
                $conn->prepare("UPDATE forum_posts SET likes_count = likes_count - 1 WHERE id = ?")->execute([$postId]);
                echo json_encode(["success" => true, "liked" => false]);
            } else {
                // Like
                $conn->prepare("INSERT INTO forum_likes (post_id, user_id) VALUES (?, ?)")->execute([$postId, $user->id]);
                $conn->prepare("UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = ?")->execute([$postId]);
                echo json_encode(["success" => true, "liked" => true]);
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
