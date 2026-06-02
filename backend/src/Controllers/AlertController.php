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

    // GET /api/alerts/active
    public function getActiveAlerts(): void {
        try {
            $user = AuthMiddleware::getUser();
            
            // 1. Extragem userId și rolul din token
            $userId = is_object($user) ? 
                ($user->userId ?? $user->id ?? $user->user_id ?? $user->sub ?? null) : 
                ($user['userId'] ?? $user['id'] ?? $user['user_id'] ?? $user['sub'] ?? null);

            $userRole = is_object($user) ? ($user->role ?? 'tehnician') : ($user['role'] ?? 'tehnician');
            
            // 2. Extragem reactorul DIRECT din baza de date folosind noul Repository
            $userReactorId = null;
            if ($userId && $userRole !== 'admin') {
                $personnelRepo = new ReactorPersonnelRepository();
                $userReactorId = $personnelRepo->getAssignedReactorId((int) $userId);
            }

            // 3. Apelăm Serviciul
            $activeAlerts = $this->alertService->getActiveAlertsForUser($userRole, $userReactorId);

            // 4. Trimitem la frontend
            Response::json(AlertMapper::toResponseList($activeAlerts));
            
        } catch (Exception $e) {
            Response::json([
                'error' => 'Eroare la aducerea alertelor active.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/alerts/{id}/resolve
    public function resolveAlert(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide sau lipsă.'], 400);
            return;
        }

        try {
            $user = AuthMiddleware::getUser();
            
            // 1. Extragem userId și rolul
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

            // 2. Extragem reactorul DIRECT din baza de date la fel ca mai sus
            $userReactorId = null;
            if ($userRole !== 'admin') {
                $personnelRepo = new ReactorPersonnelRepository();
                $userReactorId = $personnelRepo->getAssignedReactorId((int) $userId);
            }

            // 3. Validăm și preluăm notițele din request
            $dto = AlertMapper::toResolveRequestDTO($data);
            
            // 4. Trimitem către Service pentru verificare și salvare
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
}