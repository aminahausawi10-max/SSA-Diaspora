<?php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = get_db_data();
$news = $db['news'] ?? [];

if ($method === 'GET') {
    echo json_encode(['success' => true, 'news' => $news]);
    exit();
}

if ($method === 'POST') {
    $input = get_json_input();
    $title = $input['title'] ?? null;
    $content = $input['content'] ?? null;

    if (!$title || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content are required.']);
        exit();
    }

    $newItem = [
        'id' => uniqid('news-'),
        'title' => $title,
        'content' => $content,
        'category' => $input['category'] ?? 'Announcement',
        'author' => $input['author'] ?? 'Admin',
        'createdAt' => date('c')
    ];

    array_unshift($news, $newItem);
    $db['news'] = $news;
    save_db_data($db);

    echo json_encode(['success' => true, 'news' => $newItem]);
    exit();
}
