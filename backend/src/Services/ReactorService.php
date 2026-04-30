<?php

namespace App\Services;

use App\DTOs\Request\CreateReactorDTO;
use App\Repositories\ReactorRepository;

class ReactorService {
    private ReactorRepository $reactorsRepository;

    public function __construct() {
        $this->reactorsRepository = new ReactorRepository();
    }

    public function getAll(): array {
        return array_map(fn($reactor) => $reactor->toArray(), $this->reactorsRepository->findAll());
    }

    public function getById(int $id): ?array {
        $reactor = $this->reactorsRepository->findById($id);
        return $reactor?->toArray();
    }

    public function create(CreateReactorDTO $dto): array {
        // TODO: validare factorii de risc si stabilitate pentru amplasament dupa coordonate si apel la API extern
        $soilStability = 0.75;
        $seismicRisk   = 0.10;

        $reactor = $this->reactorsRepository->create($dto, $soilStability, $seismicRisk);
        return $reactor->toArray();
    }

    public function delete(int $id): bool {
        return $this->reactorsRepository->delete($id);
    }

    public function update(int $id, UpdateReactorDTO $dto): ?array {
        $reactor = $this->reactorsRepository->update($id, $dto);
        return $reactor?->toArray();
    }
}