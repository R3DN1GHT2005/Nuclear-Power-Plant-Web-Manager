<?php

namespace App\Services;

use App\DTOs\Request\Sensor\CreateSensorRequestDTO;
use App\DTOs\Request\Sensor\InsertSensorDTO;
use App\DTOs\Request\Sensor\UpdateSensorRequestDTO;
use App\Models\Sensor;
use App\Repositories\SensorRepository;
use App\DTOs\Request\Sensor\StoreMeasurementDTO;

class SensorService {
    private SensorRepository $sensorRepository;

    public function __construct() {
        $this->sensorRepository = new SensorRepository();
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
        return $this->sensorRepository->updateValue($dto->sensor_id, $dto->value);
    }

    public function delete(int $id): bool {
        return $this->sensorRepository->delete($id);
    }
}
