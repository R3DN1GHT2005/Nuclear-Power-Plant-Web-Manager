<?php

namespace App\Controllers;

use App\Core\Response;
use App\DTOs\Request\reactor\CreateReactorRequestDTO;
use App\DTOs\Request\reactor\UpdateReactorDTO;
use App\Mappers\ReactorMapper;
use App\Services\ReactorService;
use App\Exceptions\ValidationException;

class ReactorController {
    private ReactorService $reactorService;

    public function __construct() {
        $this->reactorService = new ReactorService();
    }

    // GET /api/reactors
    public function getAllReactors(): void {
        $reactors = $this->reactorService->getAll();
        Response::json(ReactorMapper::toResponseList($reactors));
    }

    // GET /api/reactors/{id}
    public function getReactorById(int $id): void {
        $reactor = $this->reactorService->getById($id);

        if (!$reactor) {
            Response::json(['error' => 'Reactor negăsit'], 404);
            return;
        }

        Response::json(ReactorMapper::toResponse($reactor));
    }

    // POST /api/reactors
    public function addReactor(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $dto = CreateReactorRequestDTO::fromArray($data);
            $reactor = $this->reactorService->create($dto);

            Response::json(ReactorMapper::toResponse($reactor), 201);
            return;
        } catch (ValidationException $ve) {
            Response::json(['success' => false, 'error' => $ve->getMessage()], 400);
            return;
        } catch (\Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
            return;
        }
}

    // PUT /api/reactors/{id}
    public function updateReactor(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        $dto     = UpdateReactorDTO::fromArray($data);
        $reactor = $this->reactorService->update($id, $dto);

        if (!$reactor) {
            Response::json(['error' => 'Reactor negăsit'], 404);
            return;
        }

        Response::json(ReactorMapper::toResponse($reactor));
    }

    // PATCH /api/reactors/{id}/status
    public function updateStatus(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['status'])) {
            Response::json(['error' => 'Status lipsă'], 400);
            return;
        }

        try {
            $reactor = $this->reactorService->changeStatus($id, (string) $data['status']);

            if (!$reactor) {
                Response::json(['error' => 'Reactor negăsit'], 404);
                return;
            }

            Response::json(ReactorMapper::toResponse($reactor));
        } catch (\InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/reactors/{id}
    public function deleteReactor(int $id): void {
        $deleted = $this->reactorService->delete($id);

        if (!$deleted) {
            Response::json(['error' => 'Reactor negăsit'], 404);
            return;
        }

        Response::json(['message' => 'Reactor șters cu succes']);
    }


    // PATCH /api/reactors/{id}/efficiency
    public function updateEfficiency(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['efficiency'])) {
            Response::json(['error' => 'Câmpul efficiency lipsește'], 400);
            return;
        }

        $efficiency = (float) $data['efficiency'];

        if ($efficiency < 0 || $efficiency > 100) {
            Response::json(['error' => 'Eficiența trebuie să fie între 0 și 100'], 400);
            return;
        }

        $updated = $this->reactorService->updateEfficiency($id, $efficiency);

        if (!$updated) {
            Response::json(['error' => 'Reactor negăsit'], 404);
            return;
        }

        Response::json(['message' => 'Eficiență actualizată cu succes']);
    }


    public function getActiveReactors(): void {
        $reactors = $this->reactorService->getAllActive();
        Response::json(array_map(fn($r) => [
            'reactor_id' => $r->getId(),
            'reactor_status' => $r->getStatus(),
            'reactor_efficiency' => $r->getCurrentEfficiency()
        ], $reactors));
    }
}