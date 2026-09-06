<?php
require_once __DIR__ . '/../config/db.php';

$input = get_json_input();
$email = strtolower(trim($input['account']['email'] ?? ($input['email'] ?? '')));
$fullName = trim($input['fullName'] ?? '');

if (empty($email) || empty($fullName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Full Name and Email are required.']);
    exit();
}

$db = get_db_data();
$members = $db['members'] ?? [];

// Check if member already exists
$index = -1;
foreach ($members as $i => $m) {
    $mEmail = strtolower($m['account']['email'] ?? ($m['email'] ?? ''));
    if ($mEmail === $email) {
        $index = $i;
        break;
    }
}

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
$diasporaId = 'NIG-DIA-' . str_pad($nextSeq, 6, '0', STR_PAD_LEFT);

$memberData = array_merge($input, [
    'id' => ($index >= 0 ? $members[$index]['id'] : uniqid('mem_')),
    'status' => 'PENDING',
    'diasporaId' => $diasporaId,
    'issueDate' => date('d/m/Y'),
    'isRegistered' => true,
    'createdAt' => ($index >= 0 ? ($members[$index]['createdAt'] ?? date('c')) : date('c')),
    'updatedAt' => date('c')
]);

if ($index >= 0) {
    $members[$index] = $memberData;
} else {
    array_unshift($members, $memberData);
}

$db['members'] = $members;
save_db_data($db);

echo json_encode([
    'success' => true,
    'member' => $memberData
]);
