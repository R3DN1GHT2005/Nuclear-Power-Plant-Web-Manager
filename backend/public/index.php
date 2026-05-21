<?php

// Autoloader-ul Composer care încarcă toate clasele automat
require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\ReactorController;
use App\Controllers\SensorController;
use App\Controllers\AlertController;
use App\Core\Router;

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");


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
    $router->get('/api/reactors', ReactorController::class, 'getAllReactors');
    $router->post('/api/reactors', ReactorController::class, 'addReactor');
    $router->get('/api/reactors/{id}', ReactorController::class, 'getReactorById');
    $router->put('/api/reactors/{id}', ReactorController::class, 'updateReactor');
    $router->delete('/api/reactors/{id}', ReactorController::class, 'deleteReactor');

    $router->get('/api/sensors', SensorController::class, 'getAllSensors');
    $router->post('/api/sensors', SensorController::class, 'addSensor');
    $router->get('/api/sensors/{id}', SensorController::class, 'getSensorById');
    $router->put('/api/sensors/{id}', SensorController::class, 'updateSensor');
    $router->delete('/api/sensors/{id}', SensorController::class, 'deleteSensor');
    $router->put('/api/sensors/{id}/data', SensorController::class, 'recordValue');

    $router->get('/api/alerts', AlertController::class, 'getAllAlerts');
    $router->post('/api/alerts', AlertController::class, 'createAlert');
    $router->get('/api/alerts/{id}', AlertController::class, 'getAlertById');
    $router->put('/api/alerts/{id}', AlertController::class, 'updateAlert');
    $router->delete('/api/alerts/{id}', AlertController::class, 'deleteAlert');

    $router->dispatch($uri, $method);



} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Eroare internă a serverului.",
        "message" => $e->getMessage() // O păstrăm vizibilă doar cât timp suntem în dezvoltare
    ]);
}