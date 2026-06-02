<?php

namespace App\Controllers;

use App\Core\Response;
use App\Services\UserService;
use App\Mappers\UserMapper;
use InvalidArgumentException;
use Exception;

class UserController {
    private UserService $userService;

    public function __construct() {
        $this->userService = new UserService();
    }

    // GET /api/users
   public function getAllUsers(): void {
        try {
            $users = $this->userService->getAll();
            Response::json(UserMapper::toResponseList($users));
        } catch (Exception $e) {
            // AICI AM ADĂUGAT 'details'
            Response::json([
                'error' => 'Eroare la aducerea utilizatorilor.', 
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    // GET /api/users/{id}
    public function getUserById(int $id): void {
        try {
            $user = $this->userService->getById($id);

            if (!$user) {
                Response::json(['error' => 'Utilizator negăsit'], 404);
                return;
            }

            Response::json(UserMapper::toResponse($user));
        } catch (Exception $e) {
            Response::json(['error' => 'Eroare la aducerea utilizatorului.'], 500);
        }
    }

    // PUT /api/users/{id}/password
    public function updatePassword(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        try {
            // Folosim Mapper-ul pentru a obține DTO-ul curat și validat
            $dto = UserMapper::toUpdatePasswordDTO($data);
            
            // Trimitem DTO-ul validat către stratul de Service
            $this->userService->updatePassword($id, $dto);

            Response::json(['message' => 'Parolă actualizată cu succes']);
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 404);
        }
    }

    // PUT /api/users/{id}/reactor
    public function assignToReactor(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            // Mapper-ul se asigură că primim un AssignReactorRequestDTO corect (cu un int valid sau null)
            $dto = UserMapper::toAssignReactorDTO($data);
            
            // Trimitem ID-ul reactorului către Service (poate fi null pentru de-asignare)
            $this->userService->assignReactor($id, $dto->reactor_id);
            
            Response::json(['message' => 'Asignare actualizată cu succes']);
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
        }
    }

    // DELETE /api/users/{id}
    public function deleteUser(int $id): void {
        try {
            $deleted = $this->userService->delete($id);

            if (!$deleted) {
                Response::json(['error' => 'Utilizator negăsit'], 404);
                return;
            }

            Response::json(['message' => 'Utilizator șters cu succes']);
        } catch (Exception $e) {
            Response::json(['error' => 'Eroare la ștergerea utilizatorului.'], 500);
        }
    }

	// POST /api/users
    public function createUser(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            // 1. Folosim UserService (metoda creată anterior pentru a înlocui vechiul register)
            $this->userService->createUser(
                $data['email'],
                $data['password'],
                $data['first_name'],
                $data['last_name'],
                $data['role'] ?? 'tehnician'
            );

            Response::json(['message' => 'Utilizator creat cu succes!'], 201);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
        }
    }
}