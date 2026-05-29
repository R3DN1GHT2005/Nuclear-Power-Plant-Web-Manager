<?php

namespace App\Services;

use App\DTOs\Request\alert\CreateAlertDTO;
use App\DTOs\Request\alert\UpdateAlertDTO;
use App\Models\Alert;
use App\Repositories\AlertRepository;

class AlertService {
    private AlertRepository $alertRepository;

    public function __construct() {
        $this->alertRepository = new AlertRepository();
    }

    public function getAll(): array {
        return $this->alertRepository->getAllAlerts();
    }

    public function getById(int $id): ?Alert {
        return $this->alertRepository->getAlertById($id);
    }

    public function getByReactor(int $reactorId): array {
        return $this->alertRepository->getAlertsByReactor($reactorId);
    }

    public function getBySeverity(string $severity, ?int $reactorId = null): array {
        return $this->alertRepository->getAlertsBySeverity($severity, $reactorId);
    }

    public function getUnresolved(?int $reactorId = null): array {
        return $this->alertRepository->getUnresolvedAlerts($reactorId);
    }

    public function getResolved(?int $reactorId = null): array {
        return $this->alertRepository->getResolvedAlerts($reactorId);
    }

    public function getCritical(?int $reactorId = null): array {
        return $this->alertRepository->getCriticalAlerts($reactorId);
    }

    public function getRecent(int $limit = 10, ?int $reactorId = null): array {
        return $this->alertRepository->getRecentAlerts($limit, $reactorId);
    }

    public function create(CreateAlertDTO $dto): ?Alert {
        return $this->alertRepository->createAlert($dto);
    }

    public function resolve(int $id, UpdateAlertDTO $dto): ?Alert {
        if ($dto->resolved) {
            return $this->alertRepository->resolveAlert($id, $dto->resolved_by);
        }
        return $this->alertRepository->markAlertUnresolved($id);
    }

    public function delete(int $id): bool {
        return $this->alertRepository->deleteAlert($id);
    }
}
