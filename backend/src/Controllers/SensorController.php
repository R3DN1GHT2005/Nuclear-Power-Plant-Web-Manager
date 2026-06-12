<?php

/*
 * backend/src/Controllers/SensorController.php
 * SensorController — HTTP endpoint handler exposing sensor
 * routes. Parses request data, applies middleware, delegates to
 * the corresponding service, and returns JSON responses.
 */


namespace App\Controllers;

use App\Core\Response;
use App\DTOs\Request\Sensor\CreateSensorRequestDTO;
use App\DTOs\Request\Sensor\UpdateSensorRequestDTO;
use App\DTOs\Request\Sensor\StoreMeasurementDTO;
use App\Mappers\SensorReadingMapper;
use App\Mappers\SensorMapper;
use App\Services\SensorService;
use App\Mappers\MeasurementMapper;
use App\Mappers\SensorConfigMapper;
use InvalidArgumentException;
use Exception;

class SensorController {
    private SensorService $sensorService;

    public function __construct() {
        $this->sensorService = new SensorService();
    }

    public function getSensorTypes(): void {
        $types = [];
        foreach (\App\Enums\SensorType::cases() as $case) {
            $types[$case->value] = $case->getProfile();
        }
        
        \App\Core\Response::json($types);
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


    

    public function getConfig(): void {
        $sensors = $this->sensorService->getAllWithReactorStatus();
        Response::json(SensorConfigMapper::toResponseList($sensors));
    }

    public function recordReading(): void {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($data)) {
            Response::json(['error' => 'Format JSON invalid.'], 400);
            return;
        }

        try {
            $dto = MeasurementMapper::fromRequest($data);
            $this->sensorService->recordValue($dto);
            
            Response::json(['message' => 'Citire nouă înregistrată cu succes']);
            
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['error' => 'Eroare internă la salvarea datelor.'], 500);
        }
    }

    public function getLatestReadingsBySensor(int $sensorId): void {
        $sensor = $this->sensorService->getById($sensorId);

        if (!$sensor) {
            Response::json(['error' => 'Senzor negăsit'], 404);
            return;
        }

        $readings = $this->sensorService->getLatestReadingsBySensor($sensorId);
        Response::json(SensorReadingMapper::toResponseList($readings));
    }

    public function getLatestReadingsAllSensors(): void {
        $readings = $this->sensorService->getLatestReadingsAllSensors();
        Response::json(SensorReadingMapper::toResponseList($readings));
    }
}
