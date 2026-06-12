/*
 * backend/src/Controllers/ReactorMaintenanceController.php
 * ReactorMaintenanceController — HTTP endpoint handler exposing reactor maintenance
 * routes. Parses request data, applies middleware, delegates to
 * the corresponding service, and returns JSON responses.
 */
<?php

namespace App\Controllers;



require_once __DIR__ . '/../Mappers/ReactorMaintenanceMapper.php';

use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Repositories\ReactorPersonnelRepository;
use App\Services\ReactorMaintenanceService;
use App\Mappers\ReactorMaintenanceMapper;
use InvalidArgumentException;
use Exception;

class ReactorMaintenanceController {
    private ReactorMaintenanceService $maintenanceService;

    public function __construct() {
        $this->maintenanceService = new ReactorMaintenanceService();
    }

    private function checkReactorAccess(int $reactorId): void {
        $user = AuthMiddleware::getUser();
        $role = $user->role ?? '';
        if ($role !== 'admin') {
            $userId = $user->userId ?? null;
            if ($userId) {
                $personnelRepo = new ReactorPersonnelRepository();
                $assignedReactorId = $personnelRepo->getAssignedReactorId($userId);
                if ($assignedReactorId !== $reactorId) {
                    Response::json(['error' => 'Nu ai acces la acest reactor'], 403);
                    exit;
                }
            }
        }
    }

    public function startMaintenance(int $reactorId): void {
        $this->checkReactorAccess($reactorId);
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        try {
            $dto = ReactorMaintenanceMapper::fromArray($data);
            $this->maintenanceService->startMaintenance($reactorId, $dto);
            
            Response::json(['message' => 'Reactorul a intrat în mentenanță'], 201);
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    public function stopMaintenance(int $reactorId): void {
        $this->checkReactorAccess($reactorId);
        try {
            $this->maintenanceService->stopMaintenance($reactorId);
            
            Response::json(['message' => 'Mentenanța a fost finalizată. Reactorul este activ.']);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    public function getHistory(int $reactorId): void {
        try {
            $historyModels = $this->maintenanceService->getReactorHistory($reactorId);
            
            Response::json(ReactorMaintenanceMapper::toResponseList($historyModels));
        } catch (Exception $e) {
            Response::json(['error' => 'Eroare la aducerea istoricului.'], 500);
        }
    }
}