<?php

/*
 * backend/src/Controllers/UserController.php
 * UserController — HTTP endpoint handler exposing user
 * routes. Parses request data, applies middleware, delegates to
 * the corresponding service, and returns JSON responses.
 */


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

    

    public function getTechnicians(): void {
        try {
            $technicians = $this->userService->getTechnicians();
            $result = array_map(fn($u) => [
                'id' => $u->getId(),
                'first_name' => $u->getFirstName(),
                'last_name' => $u->getLastName(),
                'email' => $u->getEmail(),
                'reactor_id' => $u->getAssignment()?->getReactorId()
            ], $technicians);
            Response::json($result);
        } catch (Exception $e) {
            Response::json([
                'error' => 'Eroare la aducerea tehnicienilor.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    

   public function getAllUsers(): void {
        try {
            $users = $this->userService->getAll();
            Response::json(UserMapper::toResponseList($users));
        } catch (Exception $e) {
            

            Response::json([
                'error' => 'Eroare la aducerea utilizatorilor.', 
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    

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

    

    public function updatePassword(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::json(['error' => 'Date invalide'], 400);
            return;
        }

        try {
            

            $dto = UserMapper::toUpdatePasswordDTO($data);
            
            

            $this->userService->updatePassword($id, $dto);

            Response::json(['message' => 'Parolă actualizată cu succes']);
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 404);
        }
    }

    

    public function assignToReactor(int $id): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            

            $dto = UserMapper::toAssignReactorDTO($data);
            
            

            $this->userService->assignReactor($id, $dto->reactor_id);
            
            Response::json(['message' => 'Asignare actualizată cu succes']);
        } catch (InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
        }
    }

    

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

	

    public function createUser(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            

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

    public function regenerateRssToken(): void {
        try {
            $userId = $_REQUEST['user_id'] ?? null;

            if (!$userId) {
                Response::json(["error" => "Neautorizat. ID-ul utilizatorului lipsește."], 401);
                return;
            }
            $newToken = bin2hex(random_bytes(32));
            $this->userService->updateRssToken((int)$userId, $newToken);
            Response::json([
                "message" => "Token RSS regenerat cu succes.",
                "new_rss_token" => $newToken
            ], 200);

        } catch (Exception $e) {
            Response::json(["error" => "Eroare internă: " . $e->getMessage()], 500);
        }
    }
}