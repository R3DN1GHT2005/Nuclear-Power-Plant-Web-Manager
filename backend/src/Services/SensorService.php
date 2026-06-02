<?php

namespace App\Services;

use App\DTOs\Request\Sensor\CreateSensorRequestDTO;
use App\DTOs\Request\Sensor\InsertSensorDTO;
use App\DTOs\Request\Sensor\UpdateSensorRequestDTO;
use App\Models\Sensor;
use App\Repositories\SensorRepository;
use App\DTOs\Request\Sensor\StoreMeasurementDTO;
use App\Enums\AlertSeverity; // Adăugat
use Exception;

class SensorService {
    private SensorRepository $sensorRepository;
    private AlertService $alertService; // Am injectat AlertService

    public function __construct() {
        $this->sensorRepository = new SensorRepository();
        $this->alertService = new AlertService(); // Inițializare
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
        // 1. Salvăm noua valoare în baza de date
        $updated = $this->sensorRepository->updateValue($dto->sensor_id, $dto->value);

        if (!$updated) {
            return false;
        }

        // 2. Aducem detaliile senzorului pentru a verifica limitele de siguranță
        $sensor = $this->getById($dto->sensor_id);
        if (!$sensor) {
            return true; 
        }

        $value = $dto->value;
        $maxSafe = $sensor->getMaxSafeValue();
        $minSafe = $sensor->getMinSafeValue();
        $reactorId = $sensor->getReactorId();
        $sensorType = strtoupper($sensor->getSensorType());

        // 3. Calculăm limitele CRITICE (15% deviație față de max/min)
        // Folosim abs() pentru a ne asigura că funcționează corect și cu numere negative
        $criticalMax = $maxSafe + abs($maxSafe * 0.15);
        $criticalMin = $minSafe - abs($minSafe * 0.15);

        $severity = null;
        $message = "";

        // 4. Evaluăm logica de alertare (începem cu cel mai grav scenariu)
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

        // 5. Dacă s-a declanșat o alertă, o trimitem către AlertService
        if ($severity) {
            try {
                $this->alertService->triggerAlert($reactorId, $severity, $message);
            } catch (Exception $e) {
            
            }
        }

        return true;
    }

    public function delete(int $id): bool {
        return $this->sensorRepository->delete($id);
    }
}