<?php
require_once __DIR__ . '/../config/db.php';

$input = get_json_input();
$email = strtolower(trim($input['email'] ?? ''));
$password = trim($input['password'] ?? '');

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required.']);
    exit();
}

// Predefined Staff Accounts
$STAFF_ACCOUNTS = [
    'admin@ssa.gov.ng' => [
        'fullName' => 'Super Administrator',
        'role' => 'SUPER_ADMIN',
        'password' => 'admin123',
        'department' => 'Executive Office'
    ],
    'desk.uk@ssa.gov.ng' => [
        'fullName' => 'UK Country Desk Officer',
        'role' => 'COUNTRY_DESK_OFFICER',
        'countryDesk' => 'United Kingdom',
        'password' => 'desk123',
        'department' => 'Europe Desk'
    ],
    'desk.us@ssa.gov.ng' => [
        'fullName' => 'US Country Desk Officer',
        'role' => 'COUNTRY_DESK_OFFICER',
        'countryDesk' => 'United States',
        'password' => 'desk123',
        'department' => 'Americas Desk'
    ],
    'desk.canada@ssa.gov.ng' => [
        'fullName' => 'Canada Country Desk Officer',
        'role' => 'COUNTRY_DESK_OFFICER',
        'countryDesk' => 'Canada',
        'password' => 'desk123',
        'department' => 'Americas Desk'
    ],
    'desk.uae@ssa.gov.ng' => [
        'fullName' => 'UAE Country Desk Officer',
        'role' => 'COUNTRY_DESK_OFFICER',
        'countryDesk' => 'United Arab Emirates',
        'password' => 'desk123',
        'department' => 'Middle East Desk'
    ],
    'desk.saudi@ssa.gov.ng' => [
        'fullName' => 'Saudi Arabia Country Desk Officer',
        'role' => 'COUNTRY_DESK_OFFICER',
        'countryDesk' => 'Saudi Arabia',
        'password' => 'desk123',
        'department' => 'Middle East Desk'
    ],
    'desk.southafrica@ssa.gov.ng' => [
        'fullName' => 'South Africa Country Desk Officer',
        'role' => 'COUNTRY_DESK_OFFICER',
        'countryDesk' => 'South Africa',
        'password' => 'desk123',
        'department' => 'Africa Desk'
    ]
];

// Check if staff login
if (isset($STAFF_ACCOUNTS[$email])) {
    $staff = $STAFF_ACCOUNTS[$email];
    if (!empty($password) && $password !== $staff['password']) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid staff password.']);
        exit();
    }
    echo json_encode([
        'success' => true,
        'userType' => 'STAFF',
        'user' => [
            'id' => 'staff-' . md5($email),
            'email' => $email,
            'fullName' => $staff['fullName'],
            'role' => $staff['role'],
            'countryDesk' => $staff['countryDesk'] ?? null,
            'department' => $staff['department'] ?? 'Headquarters'
        ]
    ]);
    exit();
}

// Member login
$db = get_db_data();
$members = $db['members'] ?? [];
$found = null;

foreach ($members as $m) {
    $mEmail = strtolower($m['account']['email'] ?? ($m['email'] ?? ''));
    if ($mEmail === $email) {
        $found = $m;
        break;
    }
}

if ($found) {
    echo json_encode([
        'success' => true,
        'userType' => 'MEMBER',
        'user' => array_merge($found, ['isRegistered' => true])
    ]);
} else {
    // Return temporary session for pending registration
    echo json_encode([
        'success' => true,
        'userType' => 'MEMBER',
        'user' => [
            'id' => 'temp-' . uniqid(),
            'email' => $email,
            'fullName' => explode('@', $email)[0],
            'isRegistered' => false,
            'status' => 'PENDING',
            'diasporaId' => null,
            'createdAt' => date('c')
        ]
    ]);
}
