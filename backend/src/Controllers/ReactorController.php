<?php

namespace App\Controllers;

use App\Services\ReactorService;
use App\DTOs\Request\CreateReactorDTO;
use App\Core\Response;

class ReactorController {
    private ReactorService $reactorService;

    public function __construct() {
        $this->reactorService = new ReactorService();
    }

    // GET /api/reactors
    public function getAllReactors(): void {
        $reactors = $this->reactorService->getAll();
        Response::json($reactors);
    }

    // GET /api/reactors/{id}
    public function getReactorById(int $id): void {
        $reactor = $this->reactorService->getById($id);

        if (!$reactor) {
            Response::json(['error' => 'Reactor negăsit'], 404);
            return;
        }

        Response::json($reactor);
    }

    // POST /api/reactors
    public function addReactor(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        $dto     = CreateReactorDTO::fromArray($data);
        $reactor = $this->reactorService->create($dto);
        Response::json($reactor, 201);
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

        Response::json($reactor);
    }
}