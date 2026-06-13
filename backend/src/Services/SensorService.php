<?php

/*
 * backend/src/Services/SensorService.php
 * SensorService — implements business logic for sensor
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */


namespace App\Services;

use App\DTOs\Request\Sensor\CreateSensorRequestDTO;
use App\DTOs\Request\Sensor\InsertSensorDTO;
use App\DTOs\Request\Sensor\UpdateSensorRequestDTO;
use App\Models\Sensor;
use App\Repositories\SensorRepository;
use App\DTOs\Request\Sensor\StoreMeasurementDTO;
use App\Enums\AlertSeverity; 

use Exception;

class SensorService {
    private SensorRepository $sensorRepository;
    private AlertService $alertService; 


    public function __construct() {
        $this->sensorRepository = new SensorRepository();
        $this->alertService = new AlertService(); 

    }

    public function getAll(): array {
        return $this->sensorRepository->findAll();
    }

    public function getById(int $id): ?Sensor {
        return $this->sensorRepository->findById($id);
    }

    public function getByReactorId(int $reactorId): array {
        return $this->sensorRepository->findByReactorId($reactorId);
    }

    public function getByType(string $type): array {
        return $this->sensorRepository->findByType($type);
    }

    public function create(int $reactorId, CreateSensorRequestDTO $dto): Sensor {
        $insertDto = new InsertSensorDTO(
            reactor_id: $reactorId,
            sensor_type: $dto->sensor_type,
            unit: $dto->unit,
            min_safe_value: $dto->min_safe_value,
            max_safe_value: $dto->max_safe_value,
            current_value: $dto->current_value ?? ($dto->min_safe_value + $dto->max_safe_value) / 2,
        );

        return $this->sensorRepository->create($insertDto);
    }

    public function update(int $id, UpdateSensorRequestDTO $dto): ?Sensor {
        return $this->sensorRepository->update($id, $dto);
    }

    public function recordValue(StoreMeasurementDTO $dto): bool {
        

        $updated = $this->sensorRepository->updateValue($dto->sensor_id, $dto->value);

        if (!$updated) {
            return false;
        }
        $sensor = $this->getById($dto->sensor_id);
        if (!$sensor) {
            return true; 
        }

        $value = $dto->value;
        $maxSafe = $sensor->getMaxSafeValue();
        $minSafe = $sensor->getMinSafeValue();
        $reactorId = $sensor->getReactorId();
        $sensorType = strtoupper($sensor->getSensorType());
        
        $criticalMax = $maxSafe + abs($maxSafe * 0.15);
        $criticalMin = $minSafe - abs($minSafe * 0.15);

        $severity = null;
        $message = "";

        

        if ($value >= $criticalMax) {
            $severity = AlertSeverity::CRITICAL;
            $message = "CRITIC: $sensorType a atins $value! (Peste limita de $criticalMax). Pericol de avarie!";
        } elseif ($value <= $criticalMin) {
            $severity = AlertSeverity::CRITICAL;
            $message = "CRITIC: $sensorType a scăzut la $value! (Sub limita de $criticalMin). Oprire recomandată!";
        } elseif ($value > $maxSafe) {
            $severity = AlertSeverity::WARNING;
            $message = "Avertisment: $sensorType a depășit limita normală ($value > $maxSafe). Necesită atenție.";
        } elseif ($value < $minSafe) {
            $severity = AlertSeverity::WARNING;
            $message = "Avertisment: $sensorType este sub limita normală ($value < $minSafe). Necesită atenție.";
        }

        

        if ($severity) {
            try {
                $this->alertService->triggerAlert($reactorId, $severity, $message);
            } catch (Exception $e) {
                error_log("Error triggering alert: " . $e->getMessage());
            }
        }

        return true;
    }

    public function delete(int $id): bool {
        return $this->sensorRepository->delete($id);
    }


    public function getLatestReadingsBySensor(int $sensorId, int $limit = 50): array {
        return $this->sensorRepository->findLatestReadingsBySensor($sensorId, $limit);
    }

    public function getLatestReadingsAllSensors(int $limit = 50): array {
        return $this->sensorRepository->findLatestReadingsAllSensors($limit);
    }

    public function getAllWithReactorStatus(): array {
        return $this->sensorRepository->findAllWithReactorStatus();
    }
}