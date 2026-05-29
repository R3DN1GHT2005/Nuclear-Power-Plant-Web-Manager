<?php

namespace App\Services;

use App\DTOs\Request\reactor\CreateReactorDTO;
use App\DTOs\Request\reactor\UpdateReactorDTO;
use App\Models\Reactor;
use App\Repositories\ReactorRepository;
use App\Repositories\SensorRepository;
use App\Validators\Reactors\ValidatorFactory;
class ReactorService {
    private ReactorRepository $reactorsRepository;
    private SensorRepository $sensorRepository;

    public function __construct() {
        $this->reactorsRepository = new ReactorRepository();
        $this->sensorRepository = new SensorRepository();
    }

    public function getAll(): array {
       $reactors = $this->reactorsRepository->findAll();
        foreach ($reactors as $reactor) {
            $sensors = $this->sensorRepository->findByReactorId($reactor->getId());
            $reactor->setSensors($sensors);
        }

        return $reactors;
    }

    public function getById(int $id): ?Reactor {
        $reactor = $this->reactorsRepository->findById($id);
        if ($reactor) {
            $sensors = $this->sensorRepository->findByReactorId($reactor->getId());
            $reactor->setSensors($sensors);
        }
        return $reactor;
    }

    public function create(CreateReactorDTO $dto): Reactor {
        $dto->seismic_risk = $this->usgsApi->getSeismicRisk($dto->latitude, $dto->longitude);
        $dto->elevation_meters = $this->elevationApi->getElevation($dto->latitude, $dto->longitude);
        $dto->distance_to_nearest_city_km = $this->overpassApi->getDistanceToCity($dto->latitude, $dto->longitude);
        $dto->cooling_water_source = $this->overpassApi->getNearestWaterSource($dto->latitude, $dto->longitude);
        $validator = ValidatorFactory::getValidator($dto->reactor_type);
        $validator->validate($dto);
        return $this->reactorsRepository->create($dto);
    }

    public function update(int $id, UpdateReactorDTO $dto): ?Reactor {
        return $this->reactorsRepository->update($id, $dto);
    }

    public function delete(int $id): bool {
        return $this->reactorsRepository->delete($id);
    }
}