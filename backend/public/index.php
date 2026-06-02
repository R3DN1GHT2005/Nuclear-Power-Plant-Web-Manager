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
use App\Controllers\ReactorMaintenanceController;
use App\Controllers\ReportController;
use App\Controllers\UserController; // <-- IMPORTUL NOU
use App\Core\Router;

use App\Middleware\AdminMiddleware;     
use App\Middleware\AuthMiddleware;    
use App\Middleware\SensorMiddleware;  

$allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
    'http://127.0.0.1:8082',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:8082',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Gestionarea cererilor de tip preflight (OPTIONS)
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

    // Rute Publice
    $router->post('/api/auth/login', AuthController::class, 'login');
    $router->post('/api/auth/refresh', AuthController::class, 'refresh');
    $router->post('/api/auth/logout', AuthController::class, 'logout');

    // ==========================================
    // RUTE PROTEJATE DE ADMIN
    // ==========================================
    $router->put('/api/auth/password', AuthController::class, 'updatePassword', [AdminMiddleware::class]); 

    // ── RUTE ADMINISTRARE CONTURI (USERS) ──
    $router->post('/api/users', UserController::class, 'createUser', [AdminMiddleware::class]);
    $router->get('/api/users', UserController::class, 'getAllUsers', [AdminMiddleware::class]);
    $router->get('/api/users/{id}', UserController::class, 'getUserById', [AdminMiddleware::class]);
    $router->put('/api/users/{id}/password', UserController::class, 'updatePassword', [AdminMiddleware::class]);
    $router->put('/api/users/{id}/reactor', UserController::class, 'assignToReactor', [AdminMiddleware::class]);
    $router->delete('/api/users/{id}', UserController::class, 'deleteUser', [AdminMiddleware::class]);
    // ───────────────────────────────────────

    // Operațiuni critice pe reactoare
    $router->post('/api/reactors', ReactorController::class, 'addReactor', [AdminMiddleware::class]); 
    $router->put('/api/reactors/{id}', ReactorController::class, 'updateReactor', [AdminMiddleware::class]); 
    $router->delete('/api/reactors/{id}', ReactorController::class, 'deleteReactor', [AdminMiddleware::class]); 

    //senzori pentru simulator
    $router->get('/api/sensors/config', SensorController::class, 'getConfig', [SensorMiddleware::class]);
    $router->post('/api/sensors/readings', SensorController::class, 'recordReading', [\App\Middleware\SensorMiddleware::class]);

    // Senzori per reactor
    $router->post('/api/reactors/{id}/sensors', SensorController::class, 'addSensorToReactor', [AdminMiddleware::class]); 

    // Operațiuni critice pe senzori
    $router->post('/api/sensors', SensorController::class, 'addSensor', [AdminMiddleware::class]); 
    $router->patch('/api/sensors/{id}', SensorController::class, 'patchSensor', [AdminMiddleware::class]); 
    $router->delete('/api/sensors/{id}', SensorController::class, 'deleteSensor', [AdminMiddleware::class]); 

    // ==========================================
    // RUTE GENERALE (Protejate de AuthMiddleware)

    $router->get('/api/sensors/types', SensorController::class, 'getSensorTypes', [AuthMiddleware::class]);
    $router->get('/api/reactors/{id}/sensors', SensorController::class, 'getSensorsByReactor', [AuthMiddleware::class]); 
    
    // Vizualizare reactoare
    $router->get('/api/reactors', ReactorController::class, 'getAllReactors', [AuthMiddleware::class]); 
    $router->get('/api/reactors/{id}', ReactorController::class, 'getReactorById', [AuthMiddleware::class]); 

    // Rapoarte / statistici
    $router->get('/api/reports/kpi', ReportController::class, 'getKpi', [AuthMiddleware::class]);
    $router->get('/api/reports/efficiency', ReportController::class, 'getEfficiency', [AuthMiddleware::class]);
    $router->get('/api/reports/efficiency/trend', ReportController::class, 'getEfficiencyTrend', [AuthMiddleware::class]);
    $router->get('/api/reports/comparison', ReportController::class, 'getComparison', [AuthMiddleware::class]);
    $router->get('/api/reports/risk-matrix', ReportController::class, 'getRiskMatrix', [AuthMiddleware::class]);
    $router->get('/api/reports/wear', ReportController::class, 'getWear', [AuthMiddleware::class]);
    
    // Vizualizare senzori
    $router->get('/api/sensors', SensorController::class, 'getAllSensors', [AuthMiddleware::class]); 
    $router->get('/api/sensors/{id}', SensorController::class, 'getSensorById', [AuthMiddleware::class]); 
    
    // Înregistrare date senzor
    $router->put('/api/sensors/{id}/data', SensorController::class, 'recordValue', [AuthMiddleware::class]); 

    // ==========================================
    // RUTE MENTENANȚĂ
    // ==========================================

    // Rute pentru Mentenanța Reactorului
    $router->post('/api/reactors/{id}/maintenance/start', ReactorMaintenanceController::class, 'startMaintenance', [AdminMiddleware::class]);
    $router->post('/api/reactors/{id}/maintenance/stop', ReactorMaintenanceController::class, 'stopMaintenance', [AdminMiddleware::class]);
    $router->get('/api/reactors/{id}/maintenance/history', ReactorMaintenanceController::class, 'getHistory');
    
    // START ROUTING
    $router->dispatch($uri, $method);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Eroare internă a serverului.",
        "message" => $e->getMessage() 
    ]);
}