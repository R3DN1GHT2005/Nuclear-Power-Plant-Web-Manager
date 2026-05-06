<?php

// Autoloader-ul Composer care încarcă toate clasele automat
require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\ReactorController;

// Setăm headerele globale pentru API (CORS și JSON)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Dacă este un request de tip OPTIONS (Preflight de la browser), ieșim direct
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Preluăm metoda (GET, POST etc.) și URL-ul cerut
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Truc: Eliminăm slash-ul de la final, dacă utilizatorul l-a pus din greșeală
// Ex: /api/reactors/ devine /api/reactors
$uri = rtrim($uri, '/');


// --- RUTAREA API ---

// 1. Rutele generale (FĂRĂ ID în URL)
if ($uri === '/api/reactors') {
    $controller = new ReactorController();
    
    if ($method === 'GET') {
        $controller->getAllReactors();
    } 
    else if ($method === 'POST') {
        $controller->addReactor();
    } 
    else {
        http_response_code(405);
        echo json_encode(["error" => "Metodă nepermisă."]);
    }
} 
// 2. Rutele specifice unui singur element (CU ID în URL, ex: /api/reactors/1)
else if (preg_match('/^\/api\/reactors\/(\d+)$/', $uri, $matches)) {
    // $matches[1] captează numărul (ID-ul) din URL
    $id = (int) $matches[1];
    $controller = new ReactorController();

    if ($method === 'GET') {
        $controller->getReactorById($id);
    } 
    else if ($method === 'PUT') {
        $controller->updateReactor($id);
    } 
    else if ($method === 'DELETE') {
        $controller->deleteReactor($id);
    } 
    else {
        http_response_code(405);
        echo json_encode(["error" => "Metodă nepermisă."]);
    }
} 
// 3. Orice altă rută ajunge aici
else {
    http_response_code(404);
    echo json_encode([
        "error" => "Endpoint-ul nu a fost găsit.",
        "url_primit" => $uri // Afișăm URL-ul primit pentru a te ajuta la debugging
    ]);
}