<?php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = get_db_data();
$members = $db['members'] ?? [];

if ($method === 'GET') {
    $email = isset($_GET['email']) ? strtolower(trim($_GET['email'])) : null;
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;

    if ($email) {
        foreach ($members as $m) {
            $mEmail = strtolower($m['account']['email'] ?? ($m['email'] ?? ''));
            if ($mEmail === $email) {
                echo json_encode(['success' => true, 'member' => $m]);
                exit();
            }
        }
        echo json_encode(['success' => false, 'member' => null]);
        exit();
    }

    if ($id) {
        foreach ($members as $m) {
            if ($m['id'] === $id || ($m['diasporaId'] && strtoupper($m['diasporaId']) === strtoupper($id))) {
                echo json_encode(['success' => true, 'member' => $m]);
                exit();
            }
        }
        echo json_encode(['success' => false, 'member' => null]);
        exit();
    }

    echo json_encode(['success' => true, 'members' => $members]);
    exit();
}

if ($method === 'POST') {
    $input = get_json_input();
    $email = strtolower(trim($input['account']['email'] ?? ($input['email'] ?? '')));

    // Calculate next sequence for Diaspora ID
    $nextSeq = 1;
    foreach ($members as $m) {
        if (!empty($m['diasporaId'])) {
            $parts = explode('-', $m['diasporaId']);
            $num = intval(end($parts));
            if ($num > 0 && $num < 100000 && $num >= $nextSeq) {
                $nextSeq = $num + 1;
            }
        }
    }
    $diasporaId = $input['diasporaId'] ?? ('NIG-DIA-' . str_pad($nextSeq, 6, '0', STR_PAD_LEFT));

    $newMember = array_merge($input, [
        'id' => uniqid('mem_'),
        'diasporaId' => $diasporaId,
        'status' => $input['status'] ?? 'PENDING',
        'createdAt' => date('c')
    ]);

    array_unshift($members, $newMember);
    $db['members'] = $members;
    save_db_data($db);

    echo json_encode(['success' => true, 'member' => $newMember]);
    exit();
}

if ($method === 'PUT') {
    $input = get_json_input();
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Member ID is required.']);
        exit();
    }

    $updatedMember = null;
    foreach ($members as $i => $m) {
        if ($m['id'] === $id || strtolower($m['account']['email'] ?? ($m['email'] ?? '')) === strtolower($id)) {
            $members[$i] = array_merge($m, $input);
            $members[$i]['updatedAt'] = date('c');
            $updatedMember = $members[$i];
            break;
        }
    }

    if ($updatedMember) {
        $db['members'] = $members;
        save_db_data($db);
        echo json_encode(['success' => true, 'member' => $updatedMember]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Member not found.']);
    }
    exit();
}

if ($method === 'DELETE') {
    $input = get_json_input();
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Member ID is required.']);
        exit();
    }

    $filtered = array_values(array_filter($members, function($m) use ($id) {
        return $m['id'] !== $id;
    }));

    $db['members'] = $filtered;
    save_db_data($db);

    echo json_encode(['success' => true]);
    exit();
}
