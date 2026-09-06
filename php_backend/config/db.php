<?php
require_once __DIR__ . '/cors.php';

// Path to persistent data storage
$DATA_FILE = dirname(__DIR__) . '/diaspora_data.json';
if (!file_exists($DATA_FILE)) {
    $DATA_FILE = dirname(__DIR__, 2) . '/diaspora_data.json';
}

function get_db_data() {
    global $DATA_FILE;
    if (!file_exists($DATA_FILE)) {
        $initial = [
            'members' => [],
            'cases' => [],
            'news' => [
                [
                    'id' => 'news-1',
                    'title' => 'SSA Diaspora Support Portal Launched',
                    'content' => 'The official SSA Diaspora engagement platform has launched, providing access to Diaspora IDs, consular assistance, and case referral systems.',
                    'category' => 'Announcement',
                    'createdAt' => date('c'),
                    'author' => 'Super Admin'
                ]
            ],
            'offsets' => []
        ];
        file_put_contents($DATA_FILE, json_encode($initial, JSON_PRETTY_PRINT));
        return $initial;
    }
    $content = @file_get_contents($DATA_FILE);
    $data = json_decode($content, true);
    if (!is_array($data)) {
        $data = ['members' => [], 'cases' => [], 'news' => [], 'offsets' => []];
    }
    return $data;
}

function save_db_data($data) {
    global $DATA_FILE;
    @file_put_contents($DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return true;
}

function get_json_input() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
