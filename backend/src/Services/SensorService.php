<?php

namespace App\Services;

use App\DTOs\Request\sensor\CreateSensorDTO;
use App\DTOs\Request\sensor\UpdateSensorDTO;

use App\Models\Sensor;
use App\Repositories\SensorRepository;

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


    public function create(CreateSensorDTO $dto): Sensor {
        //TO DO: de adaugat logica de business
        
        return $this->sensorRepository->create($dto);
    }

    public function update(int $id, UpdateSensorDTO $dto): ?Sensor {
        return $this->sensorRepository->update($id, $dto);
    }

    public function recordValue(int $id, float $newValue): bool {
        //TO DO: de adaugat logica de business pentru validare, alerte, etc.
        //ex: un reactor depaseste 600 grade, trimitem o alerta catre operatori
        return $this->sensorRepository->updateValue($id, $newValue);
    }

    public function delete(int $id): bool {
        return $this->sensorRepository->delete($id);
    }
}