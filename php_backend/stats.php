<?php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = get_db_data();
$offsets = $db['offsets'] ?? [];

if ($method === 'GET') {
    echo json_encode(['success' => true, 'offsets' => $offsets]);
    exit();
}

if ($method === 'POST') {
    $input = get_json_input();
    $newOffsets = $input['offsets'] ?? [];

    if (!is_array($newOffsets)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid offsets payload']);
        exit();
    }

    $db['offsets'] = $newOffsets;
    save_db_data($db);

    echo json_encode(['success' => true, 'offsets' => $newOffsets]);
    exit();
}
