/*
 * backend/src/Controllers/AlertController.php
 * AlertController — HTTP endpoint handler exposing alert
 * routes. Parses request data, applies middleware, delegates to
 * the corresponding service, and returns JSON responses.
 */
<?php

namespace App\Controllers;

use App\Core\Response;
use App\Services\AlertService;
use App\Mappers\AlertMapper;
use App\Middleware\AuthMiddleware;
use App\Repositories\ReactorPersonnelRepository; 
use InvalidArgumentException;
use Exception;

class AlertController {
    private AlertService $alertService;

    public function __construct() {
        $this->alertService = new AlertService();
    }

    

    public function getActiveAlerts(): void {
        try {
            $user = AuthMiddleware::getUser();
            $userId = is_object($user) ? 
                ($user->userId ?? $user->id ?? $user->user_id ?? $user->sub ?? null) : 
                ($user['userId'] ?? $user['id'] ?? $user['user_id'] ?? $user['sub'] ?? null);

            $userRole = is_object($user) ? ($user->role ?? 'tehnician') : ($user['role'] ?? 'tehnician');
            
            $userReactorId = null;
            if ($userId && $userRole !== 'admin') {
                $personnelRepo = new ReactorPersonnelRepository();
                $userReactorId = $personnelRepo->getAssignedReactorId((int) $userId);
            }
            $activeAlerts = $this->alertService->getActiveAlertsForUser($userRole, $userReactorId);
            Response::json(AlertMapper::toResponseList($activeAlerts));
            
        } catch (Exception $e) {
            Response::json([
                'error' => 'Eroare la aducerea alertelor active.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    

    public function resolveAlert(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide sau lipsă.'], 400);
            return;
        }

        try {
            $user = AuthMiddleware::getUser();
            $userId = is_object($user) ? 
                ($user->userId ?? $user->id ?? $user->user_id ?? $user->sub ?? null) : 
                ($user['userId'] ?? $user['id'] ?? $user['user_id'] ?? $user['sub'] ?? null);

            $userRole = is_object($user) ? ($user->role ?? 'tehnician') : ($user['role'] ?? 'tehnician');

            if (!$userId) {
                Response::json([
                    'error' => 'Structură JWT necunoscută. Nu am găsit ID-ul: ' . json_encode($user)
                ], 401);
                return;
            }

            $userReactorId = null;
            if ($userRole !== 'admin') {
                $personnelRepo = new ReactorPersonnelRepository();
                $userReactorId = $personnelRepo->getAssignedReactorId((int) $userId);
            }

            $dto = AlertMapper::toResolveRequestDTO($data);
            $this->alertService->resolveAlert($id, $userId, $userRole, $userReactorId, $dto->notes);

            Response::json(['message' => 'Alarma a fost asumată și rezolvată cu succes!']);
            
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
            
        } catch (Exception $e) {
            Response::json([
                'error' => 'Eroare la rezolvarea alarmei.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    

    public function getAlertHistory(): void {
        try {
            $historyAlerts = $this->alertService->getFullAlertHistory();
            Response::json(AlertMapper::toHistoryResponseList($historyAlerts));
            
        } catch (Exception $e) {
            Response::json([
                'error' => 'Eroare la aducerea istoricului general de alerte.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    
    

    public function getAlertHistoryByReactor(int $reactorId): void {
        try {
            $reactorHistory = $this->alertService->getAlertHistoryByReactorId($reactorId);
            Response::json(AlertMapper::toHistoryResponseList($reactorHistory));
            
        } catch (Exception $e) {
            Response::json([
                'error' => 'Eroare la aducerea istoricului pentru reactorul specificat.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}