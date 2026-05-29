<?php

namespace App\Controllers;

use App\Core\Response;
use App\DTOs\Request\Sensor\CreateSensorRequestDTO;
use App\DTOs\Request\Sensor\UpdateSensorRequestDTO;
use App\Mappers\SensorMapper;
use App\Services\SensorService;

class SensorController {
    private SensorService $sensorService;

    public function __construct() {
        $this->sensorService = new SensorService();
    }

    public function getAllSensors(): void {
        $sensors = $this->sensorService->getAll();
        Response::json(SensorMapper::toResponseList($sensors));
    }

    public function getSensorsByReactor(int $reactorId): void {
        $sensors = $this->sensorService->getByReactorId($reactorId);
        Response::json(SensorMapper::toResponseList($sensors));
    }

    public function getSensorById(int $id): void {
        $sensor = $this->sensorService->getById($id);

        if (!$sensor) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        Response::json(SensorMapper::toResponse($sensor));
    }

    public function addSensor(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['reactor_id'])) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        try {
            $dto = CreateSensorRequestDTO::fromArray($data);
            $sensor = $this->sensorService->create((int) $data['reactor_id'], $dto);
            Response::json(SensorMapper::toResponse($sensor), 201);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
        }
    }

    public function addSensorToReactor(int $reactorId): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        try {
            $dto = CreateSensorRequestDTO::fromArray($data);
            $sensor = $this->sensorService->create($reactorId, $dto);
            Response::json(SensorMapper::toResponse($sensor), 201);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
        }
    }

    public function updateSensor(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        $dto = UpdateSensorRequestDTO::fromArray($data);
        $sensor = $this->sensorService->update($id, $dto);

        if (!$sensor) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        Response::json(SensorMapper::toResponse($sensor));
    }

    public function patchSensor(int $id): void {
        $this->updateSensor($id);
    }

    public function deleteSensor(int $id): void {
        $deleted = $this->sensorService->delete($id);

        if (!$deleted) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        Response::json(['message' => 'Senzor șters cu succes']);
    }

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
