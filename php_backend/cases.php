<?php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = get_db_data();
$cases = $db['cases'] ?? [];

if ($method === 'GET') {
    $email = isset($_GET['email']) ? strtolower(trim($_GET['email'])) : null;

    if ($email) {
        $filtered = array_values(array_filter($cases, function($c) use ($email) {
            return strtolower($c['memberId'] ?? '') === $email;
        }));
        echo json_encode(['success' => true, 'cases' => $filtered]);
        exit();
    }

    echo json_encode(['success' => true, 'cases' => $cases]);
    exit();
}

if ($method === 'POST') {
    $input = get_json_input();
    $memberId = $input['memberId'] ?? null;
    $category = $input['category'] ?? null;
    $description = $input['description'] ?? null;

    if (!$memberId || !$category || !$description) {
        http_response_code(400);
        echo json_encode(['error' => 'Required fields (memberId, category, description) are missing.']);
        exit();
    }

    // Sequence calculation
    $nextSeq = 1;
    foreach ($cases as $c) {
        if (!empty($c['caseNumber'])) {
            $parts = explode('-', $c['caseNumber']);
            $num = intval(end($parts));
            if ($num > 0 && $num >= $nextSeq) {
                $nextSeq = $num + 1;
            }
        }
    }
    $caseNumber = 'SSA-CASE-2026-' . str_pad($nextSeq, 6, '0', STR_PAD_LEFT);

    $newCase = [
        'id' => uniqid('case_'),
        'caseNumber' => $caseNumber,
        'memberId' => $memberId,
        'memberName' => $input['memberName'] ?? 'Anonymous Member',
        'category' => $category,
        'description' => $description,
        'phoneNumber' => $input['phoneNumber'] ?? '',
        'location' => $input['location'] ?? '',
        'mediaUrls' => $input['mediaUrls'] ?? [],
        'status' => 'SUBMITTED',
        'referredAgency' => null,
        'isUrgent' => !empty($input['isUrgent']) || $category === 'Emergency',
        'country' => $input['country'] ?? 'Nigeria',
        'createdAt' => date('c'),
        'updatedAt' => date('c'),
        'history' => [
            [
                'status' => 'SUBMITTED',
                'note' => 'Case submitted successfully via Diaspora Platform.',
                'updatedBy' => $input['memberName'] ?? 'System',
                'createdAt' => date('c')
            ]
        ]
    ];

    array_unshift($cases, $newCase);
    $db['cases'] = $cases;
    save_db_data($db);

    echo json_encode(['success' => true, 'case' => $newCase]);
    exit();
}

if ($method === 'PUT') {
    $input = get_json_input();
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Case ID is required.']);
        exit();
    }

    $updatedCase = null;
    foreach ($cases as $i => $c) {
        if ($c['id'] === $id || ($c['caseNumber'] ?? '') === $id) {
            if (!empty($input['status'])) $cases[$i]['status'] = $input['status'];
            if (!empty($input['referredAgency'])) $cases[$i]['referredAgency'] = $input['referredAgency'];
            if (isset($input['isUrgent'])) $cases[$i]['isUrgent'] = $input['isUrgent'];
            
            $cases[$i]['updatedAt'] = date('c');

            if (!empty($input['note'])) {
                if (!isset($cases[$i]['history'])) $cases[$i]['history'] = [];
                array_unshift($cases[$i]['history'], [
                    'status' => $input['status'] ?? $cases[$i]['status'],
                    'note' => $input['note'],
                    'updatedBy' => $input['updatedBy'] ?? 'Admin Staff',
                    'createdAt' => date('c')
                ]);
            }
            $updatedCase = $cases[$i];
            break;
        }
    }

    if ($updatedCase) {
        $db['cases'] = $cases;
        save_db_data($db);
        echo json_encode(['success' => true, 'case' => $updatedCase]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Case not found.']);
    }
    exit();
}
