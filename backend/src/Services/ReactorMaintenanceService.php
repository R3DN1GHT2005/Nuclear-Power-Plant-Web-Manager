<?php

/*
 * backend/src/Services/ReactorMaintenanceService.php
 * ReactorMaintenanceService — implements business logic for reactor maintenance
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */


namespace App\Services;

use App\DTOs\Request\Maintenance\StartMaintenanceRequestDTO;
use App\Repositories\ReactorMaintenanceRepository;
use Exception;

class ReactorMaintenanceService {
    private ReactorMaintenanceRepository $repository;

    public function __construct() {
        $this->repository = new ReactorMaintenanceRepository();
    }

    public function startMaintenance(int $reactorId, StartMaintenanceRequestDTO $dto): void {
        try {
            $this->repository->beginTransaction();

            $this->repository->insertMaintenanceLog($reactorId, $dto->estimated_end_date, $dto->reason);
            $this->repository->updateReactorStatus($reactorId, 'Mentenanță', 0);

            $this->repository->commit();
        } catch (Exception $e) {
            if ($this->repository->inTransaction()) {
                $this->repository->rollBack();
            }
            throw new Exception("Eroare la pornirea mentenanței: " . $e->getMessage());
        }
    }

    public function stopMaintenance(int $reactorId): void {
        try {
            $this->repository->beginTransaction();

            $this->repository->markMaintenanceCompleted($reactorId);
            $this->repository->updateReactorStatus($reactorId, 'Activ');

            $this->repository->commit();
        } catch (Exception $e) {
            if ($this->repository->inTransaction()) {
                $this->repository->rollBack();
            }
            throw new Exception("Eroare la oprirea mentenanței: " . $e->getMessage());
        }
    }

    public function getReactorHistory(int $reactorId): array {
        return $this->repository->getHistoryByReactor($reactorId);
    }
}