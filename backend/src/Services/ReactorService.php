<?php

namespace App\Services;

use App\DTOs\Request\CreateReactorDTO;
use App\DTOs\Request\UpdateReactorDTO;
use App\Models\Reactor;
use App\Repositories\ReactorRepository;

class ReactorService {
    private ReactorRepository $reactorsRepository;

    public function __construct() {
        $this->reactorsRepository = new ReactorRepository();
    }

    public function getAll(): array {
        return $this->reactorsRepository->findAll(); // Reactor[]
    }

    public function getById(int $id): ?Reactor {
        return $this->reactorsRepository->findById($id);
    }

    public function create(CreateReactorDTO $dto): Reactor {
        // TODO: inlocuit cu GeoService cand alegi API-urile
        $soilStability = 0.75;
        $seismicRisk   = 0.10;
        return $this->reactorsRepository->create($dto, $soilStability, $seismicRisk);
    }

    public function update(int $id, UpdateReactorDTO $dto): ?Reactor {
        return $this->reactorsRepository->update($id, $dto);
    }

    public function delete(int $id): bool {
        return $this->reactorsRepository->delete($id);
    }
}