<?php
// Forțăm afișarea oricărei erori
ini_set('display_errors', 1);
error_reporting(E_ALL);

$webhookUrl = "https://discord.com/api/webhooks/1512848358014976073/zF_SgCaIVFvqJWj_4P-SDmYBlhofA_RhvNwjmUhM3gj_4fQKLTTkoruUzvM-Ad0B7Gzi"; // Ex: https://discord.com/api/webhooks/...

echo "1. Începem testul...<br>";

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode(["content" => "🚀 Acesta este un test din PHP!"]),
        'ignore_errors' => true // Foarte important: ne lasă să vedem erorile 400 de la Discord
    ],
    // Asta e "magia" pentru Docker: oprim verificarea SSL temporar
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
];

echo "2. Trimitem request-ul...<br>";
$result = file_get_contents($webhookUrl, false, stream_context_create($options));

echo "3. Răspunsul de la server:<br>";
var_dump($result);

echo "<br><br>4. Headerele HTTP primite:<br>";
var_dump($http_response_header);
?>