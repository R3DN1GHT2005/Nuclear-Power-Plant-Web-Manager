<?php

namespace App\Controllers;

use App\Core\Response;
use App\DTOs\Request\alert\CreateAlertDTO;
use App\DTOs\Request\alert\UpdateAlertDTO;
use App\Mappers\AlertMapper;
use App\Services\AlertService;

class AlertController {
    private AlertService $alertService;

    public function __construct() {
        $this->alertService = new AlertService();
    }

    // GET /api/alerts
    public function getAllAlerts(): void {
        $reactorId = isset($_GET['reactor_id']) ? (int) $_GET['reactor_id'] : null;
        $severity = $_GET['severity'] ?? null;
        $resolved = isset($_GET['resolved']) ? (bool) $_GET['resolved'] : null;
        $critical = isset($_GET['critical']) ? (bool) $_GET['critical'] : null;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : null;

        if ($critical) {
            $alerts = $this->alertService->getCritical($reactorId);
        } elseif ($resolved !== null) {
            $alerts = $resolved ? $this->alertService->getResolved($reactorId) : $this->alertService->getUnresolved($reactorId);
        } elseif ($severity !== null) {
            $alerts = $this->alertService->getBySeverity($severity, $reactorId);
        } elseif ($reactorId !== null) {
            $alerts = $this->alertService->getByReactor($reactorId);
        } elseif ($limit !== null) {
            $alerts = $this->alertService->getRecent($limit);
        } else {
            $alerts = $this->alertService->getAll();
        }

        Response::json(AlertMapper::toResponseList($alerts));
    }

    // GET /api/alerts/{id}
    public function getAlertById(int $id): void {
        $alert = $this->alertService->getById($id);

        if (!$alert) {
            Response::json(['error' => 'Alertă negăsită'], 404);
            return;
        }

        Response::json(AlertMapper::toResponse($alert));
    }

    // POST /api/alerts
    public function createAlert(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['reactor_id'], $data['message'], $data['severity'])) {
            Response::json(['error' => 'Date invalide. Sunt necesare: reactor_id, message, severity'], 400);
            return;
        }

        $dto   = CreateAlertDTO::fromArray($data);
        $alert = $this->alertService->create($dto);

        if (!$alert) {
            Response::json(['error' => 'Severitate invalidă. Valorile permise: Critica, Avertisment, Info'], 400);
            return;
        }

        Response::json(AlertMapper::toResponse($alert), 201);
    }

    // PUT /api/alerts/{id}
    public function updateAlert(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        $dto   = UpdateAlertDTO::fromArray($data);
        $alert = $this->alertService->resolve($id, $dto);

        if (!$alert) {
            Response::json(['error' => 'Alertă negăsită'], 404);
            return;
        }

        Response::json(AlertMapper::toResponse($alert));
    }

    // DELETE /api/alerts/{id}
    public function deleteAlert(int $id): void {
        $deleted = $this->alertService->delete($id);

        if (!$deleted) {
            Response::json(['error' => 'Alertă negăsită'], 404);
            return;
        }

        Response::json(['message' => 'Alertă ștearsă cu succes']);
    }
}
