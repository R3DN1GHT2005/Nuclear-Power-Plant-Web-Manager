<?php

namespace App\Controllers;

use App\Core\Response;
use App\DTOs\Request\sensor\CreateSensorDTO;
use App\DTOs\Request\sensor\UpdateSensorDTO;
use App\Mappers\SensorMapper;
use App\Services\SensorService;

class SensorController {
    private SensorService $sensorService;

    public function __construct() {
        $this->sensorService = new SensorService();
    }

    // GET /api/sensors
    public function getAllSensors(): void {
        $sensors = $this->sensorService->getAll();
        Response::json(SensorMapper::toResponseList($sensors));
    }

    // GET /api/sensors/{id}
    public function getSensorById(int $id): void {
        $sensor = $this->sensorService->getById($id);

        if (!$sensor) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        Response::json(SensorMapper::toResponse($sensor));
    }

    // POST /api/sensors
    public function addSensor(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        $dto    = CreateSensorDTO::fromArray($data);
        $sensor = $this->sensorService->create($dto);
        Response::json(SensorMapper::toResponse($sensor), 201);
    }

    // PUT /api/sensors/{id}
    public function updateSensor(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        $dto    = UpdateSensorDTO::fromArray($data);
        $sensor = $this->sensorService->update($id, $dto);

        if (!$sensor) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        Response::json(SensorMapper::toResponse($sensor));
    }

    // DELETE /api/sensors/{id}
    public function deleteSensor(int $id): void {
        $deleted = $this->sensorService->delete($id);

        if (!$deleted) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        Response::json(['message' => 'Senzor șters cu succes']);
    }

    // --- TELEMETRIE (Specifica aparatelor IoT) ---

    // PUT /api/sensors/{id}/data
    public function recordValue(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['value'])) {
            Response::json(['error' => 'Valoarea lipsește din request'], 400);
            return;
        }

        $updated = $this->sensorService->recordValue($id, (float) $data['value']);

        if (!$updated) {
            Response::json(['error' => 'Senzor negăsit sau eroare la actualizare'], 404);
            return;
        }

        Response::json(['message' => 'Citire nouă înregistrată cu succes']);
    }
}