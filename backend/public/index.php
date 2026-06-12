<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- REZOLVAREA EROARII DE AUTOLOAD ---
// Verificăm pe rând unde se află folderul vendor (pe Render sau pe Local)
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    // Calea pe serverul Render (vendor este fix lângă public)
    require_once __DIR__ . '/../vendor/autoload.php';
} elseif (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    // Calea pentru mediul tău de dezvoltare local
    require_once __DIR__ . '/../../vendor/autoload.php';
} else {
    die("Eroare CRITICĂ: Fișierul autoload.php nu a fost găsit nicăieri. Te rog să rulezi 'composer install'.");
}
// ---------------------------------------

use App\Controllers\ReactorController;
use App\Controllers\SensorController;
use App\Controllers\AuthController;
use App\Controllers\ReactorMaintenanceController;
use App\Controllers\UserController;
use App\Controllers\AlertController;
use App\Controllers\ReportController;
use App\Controllers\RssController;
use App\Core\Router;

use App\Middleware\AdminMiddleware;     
use App\Middleware\AuthMiddleware;    
use App\Middleware\ManagerOrAdminMiddleware;    
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
    $router->get('/api/auth/me', AuthController::class, 'me', [AuthMiddleware::class]);
    
    $router->post('/api/users', UserController::class, 'createUser', [AdminMiddleware::class]);
    $router->get('/api/users', UserController::class, 'getAllUsers', [AdminMiddleware::class]);
    $router->get('/api/users/{id}', UserController::class, 'getUserById', [AdminMiddleware::class]);
    $router->put('/api/users/{id}/password', UserController::class, 'updatePassword', [AdminMiddleware::class]);
    $router->put('/api/users/{id}/reactor', UserController::class, 'assignToReactor', [ManagerOrAdminMiddleware::class]);
    $router->delete('/api/users/{id}', UserController::class, 'deleteUser', [AdminMiddleware::class]);
    $router->get('/api/users/technicians', UserController::class, 'getTechnicians', [ManagerOrAdminMiddleware::class]);
    
    $router->post('/api/user/rss-token/regenerate', UserController::class, 'regenerateRssToken', [AuthMiddleware::class]);

    $router->get('/api/reactors/active', ReactorController::class, 'getActiveReactors', [SensorMiddleware::class]);
    $router->get('/api/reactors', ReactorController::class, 'getAllReactors', [AuthMiddleware::class]); 
    $router->get('/api/reactors/my', ReactorController::class, 'getMyReactor', [AuthMiddleware::class]);
    $router->post('/api/reactors', ReactorController::class, 'addReactor', [AdminMiddleware::class]); 
    
    $router->get('/api/reactors/status/{id}', ReactorController::class, 'getReactorStatus', [SensorMiddleware::class]);
    $router->get('/api/reactors/by-mac/{mac}', ReactorController::class, 'getReactorByMac', [SensorMiddleware::class]);
    $router->get('/api/reactors/{id}', ReactorController::class, 'getReactorById', [AuthMiddleware::class]); 
    $router->put('/api/reactors/{id}', ReactorController::class, 'updateReactor', [AdminMiddleware::class]); 
    $router->delete('/api/reactors/{id}', ReactorController::class, 'deleteReactor', [AdminMiddleware::class]); 
    $router->patch('/api/reactors/{id}/statusESP', ReactorController::class, 'updateStatusESP', [SensorMiddleware::class]);
    $router->patch('/api/reactors/{id}/status', ReactorController::class, 'updateStatus', [AuthMiddleware::class]);
    $router->patch('/api/reactors/{id}/efficiency', ReactorController::class, 'updateEfficiency', [SensorMiddleware::class]);
    
    $router->post('/api/reactors/{id}/maintenance/start', ReactorMaintenanceController::class, 'startMaintenance', [ManagerOrAdminMiddleware::class]);
    $router->post('/api/reactors/{id}/maintenance/stop', ReactorMaintenanceController::class, 'stopMaintenance', [ManagerOrAdminMiddleware::class]);
    $router->get('/api/reactors/{id}/personnel', ReactorController::class, 'getPersonnel', [ManagerOrAdminMiddleware::class]);
    $router->get('/api/reactors/{id}/maintenance/history', ReactorMaintenanceController::class, 'getHistory');
    $router->get('/api/reactors/{id}/sensors', SensorController::class, 'getSensorsByReactor', [AuthMiddleware::class]); 
    $router->post('/api/reactors/{id}/sensors', SensorController::class, 'addSensorToReactor', [AdminMiddleware::class]); 

    $router->get('/api/sensors/config', SensorController::class, 'getConfig', [SensorMiddleware::class]);
    $router->post('/api/sensors/readings', SensorController::class, 'recordReading', [SensorMiddleware::class]);
    $router->get('/api/sensors/readings/all', SensorController::class, 'getLatestReadingsAllSensors', [AuthMiddleware::class]);
    $router->get('/api/sensors/types', SensorController::class, 'getSensorTypes', [AuthMiddleware::class]);
    $router->get('/api/sensors', SensorController::class, 'getAllSensors', [AuthMiddleware::class]); 
    $router->post('/api/sensors', SensorController::class, 'addSensor', [AdminMiddleware::class]); 
    
    $router->get('/api/sensors/{id}', SensorController::class, 'getSensorById', [AuthMiddleware::class]); 
    $router->get('/api/sensors/{id}/readings', SensorController::class, 'getLatestReadingsBySensor', [AuthMiddleware::class]);
    $router->patch('/api/sensors/{id}', SensorController::class, 'patchSensor', [AdminMiddleware::class]); 
    $router->put('/api/sensors/{id}/data', SensorController::class, 'recordValue', [AuthMiddleware::class]); 
    $router->delete('/api/sensors/{id}', SensorController::class, 'deleteSensor', [AdminMiddleware::class]); 

    $router->get('/api/alerts/active', AlertController::class, 'getActiveAlerts', [AuthMiddleware::class]);
    $router->get('/api/alerts/history', AlertController::class, 'getAlertHistory', [AdminMiddleware::class]);
    $router->get('/api/alerts/history/reactor/{id}', AlertController::class, 'getAlertHistoryByReactor', [AuthMiddleware::class]);
    $router->post('/api/alerts/{id}/resolve', AlertController::class, 'resolveAlert', [AuthMiddleware::class]);

    $router->get('/api/reports/kpi', ReportController::class, 'getKpi', [AuthMiddleware::class]);
    $router->get('/api/reports/efficiency', ReportController::class, 'getEfficiency', [AuthMiddleware::class]);
    $router->get('/api/reports/efficiency/trend', ReportController::class, 'getEfficiencyTrend', [AuthMiddleware::class]);
    $router->get('/api/reports/comparison', ReportController::class, 'getComparison', [AuthMiddleware::class]);
    $router->get('/api/reports/risk-matrix', ReportController::class, 'getRiskMatrix', [AuthMiddleware::class]);
    $router->get('/api/reports/wear', ReportController::class, 'getWear', [AuthMiddleware::class]);

    $router->get('/api/rss/alerts', RssController::class, 'getFeed');
    $router->get('/api/rss/token', RssController::class, 'getToken', [AuthMiddleware::class]);
    
    $router->dispatch($uri, $method);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Eroare internă a serverului.",
        "message" => $e->getMessage() 
    ]);
}