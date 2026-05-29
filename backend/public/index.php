<?php


ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


$autoloadPath = __DIR__ . '/../../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    die("Eroare CRITICĂ: Fișierul autoload.php nu a fost găsit la calea: " . $autoloadPath . " . Te rog să rulezi 'composer install'.");
}
require_once $autoloadPath;

use App\Controllers\ReactorController;
use App\Controllers\SensorController;
use App\Controllers\AuthController;
use App\Core\Router;
// use App\Middleware\AdminMiddleware;    // COMENTAT — vezi comentat.md
// use App\Middleware\AuthMiddleware;     // COMENTAT — vezi comentat.md

// --- Configurare CORS și Headere ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gestionarea cererilor de tip preflight (OPTIONS) făcute de browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$uri = rtrim($uri, '/');
if (empty($uri)) {
    $uri = '/'; 
}

try {
    $router = new Router();

  
    $router->post('/api/auth/login', AuthController::class, 'login');
    $router->post('/api/auth/refresh', AuthController::class, 'refresh');
    $router->post('/api/auth/logout', AuthController::class, 'logout');

    $router->post('/api/auth/register', AuthController::class, 'register'); // COMENTAT: [AdminMiddleware::class]
    $router->put('/api/auth/password', AuthController::class, 'updatePassword'); // COMENTAT: [AdminMiddleware::class]

    // Operațiuni critice pe reactoare
    $router->post('/api/reactors', ReactorController::class, 'addReactor'); // COMENTAT: [AdminMiddleware::class]
    $router->put('/api/reactors/{id}', ReactorController::class, 'updateReactor'); // COMENTAT: [AdminMiddleware::class]
    $router->delete('/api/reactors/{id}', ReactorController::class, 'deleteReactor'); // COMENTAT: [AdminMiddleware::class]

    // Operațiuni critice pe senzori
    $router->post('/api/sensors', SensorController::class, 'addSensor'); // COMENTAT: [AdminMiddleware::class]
    $router->put('/api/sensors/{id}', SensorController::class, 'updateSensor'); // COMENTAT: [AdminMiddleware::class]
    $router->delete('/api/sensors/{id}', SensorController::class, 'deleteSensor'); // COMENTAT: [AdminMiddleware::class]


    // ==========================================
    // 3. RUTE GENERALE (Protejate de AuthMiddleware)
    // Orice utilizator logat (viewer, technician, admin) are acces
    // ==========================================
    
    // Vizualizare reactoare
    $router->get('/api/reactors', ReactorController::class, 'getAllReactors'); // COMENTAT: [AuthMiddleware::class]
    $router->get('/api/reactors/{id}', ReactorController::class, 'getReactorById'); // COMENTAT: [AuthMiddleware::class]
    
    // Vizualizare senzori
    $router->get('/api/sensors', SensorController::class, 'getAllSensors'); // COMENTAT: [AuthMiddleware::class]
    $router->get('/api/sensors/{id}', SensorController::class, 'getSensorById'); // COMENTAT: [AuthMiddleware::class]
    
    // Înregistrare date senzor (Aici pe viitor poți folosi un [TechnicianMiddleware::class])
    $router->put('/api/sensors/{id}/data', SensorController::class, 'recordValue'); // COMENTAT: [AuthMiddleware::class]


    // Executarea rutei cerute
    $router->dispatch($uri, $method);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Eroare internă a serverului.",
        "message" => $e->getMessage() 
    ]);
}