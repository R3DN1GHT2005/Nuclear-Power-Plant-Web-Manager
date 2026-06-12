/*
 * backend/src/Services/UserService.php
 * UserService — implements business logic for user
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */
<?php

namespace App\Services;

use App\Middleware\AuthMiddleware;
use App\Repositories\UserRepository;
use App\Repositories\ReactorPersonnelRepository;
use App\Models\User;
use App\Enums\UserRole;
use App\DTOs\Request\User\UpdateUserPasswordDTO;
use Exception;

class UserService {
    private UserRepository $userRepository;
    private ReactorPersonnelRepository $personnelRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
        $this->personnelRepository = new ReactorPersonnelRepository();
    }

    public function getTechnicians(): array {
        return $this->userRepository->findByRole('tehnician');
    }

    public function getAll(): array {
        return $this->userRepository->getAllUsers();
    }


    public function getById(int $id): ?User {
        return $this->userRepository->findById($id);
    }

    public function updatePassword(int $id, UpdateUserPasswordDTO $dto): bool {
        $user = $this->getById($id);
        if (!$user) {
            throw new Exception("Utilizatorul nu a fost găsit.");
        }

        $hashedPassword = password_hash($dto->password, PASSWORD_DEFAULT);
        
        $updated = $this->userRepository->updatePassword($id, $hashedPassword);
        
        if (!$updated) {
            throw new Exception("Eroare la salvarea noii parole în baza de date.");
        }

        return true;
    }

    public function assignReactor(int $userId, ?int $reactorId): bool {
        $user = $this->getById($userId);

        if (!$user) {
            throw new Exception("Utilizatorul nu a fost găsit.");
        }

        $currentUser = AuthMiddleware::getUser();
        $currentRole = $currentUser->role ?? '';
        if ($currentRole === 'manager') {
            $currentUserId = $currentUser->userId ?? null;
            $myReactorId = $currentUserId ? $this->personnelRepository->getAssignedReactorId($currentUserId) : null;
            if ($myReactorId !== $reactorId) {
                throw new Exception("Poți asigna utilizatori doar la reactorul tău.");
            }
        }

        if ($reactorId === null) {
            return $this->personnelRepository->removeAssignmentForUser($userId);
        }

        if ($user->getRole() === UserRole::ADMIN) {
             throw new Exception("Administratorii au acces global și nu necesită asignare specifică pe un reactor.");
        }

        $interventionRole = ucfirst($user->getRole()->value);
        $assigned = $this->personnelRepository->assignUserToReactor($userId, $reactorId, $interventionRole);
        
        if (!$assigned) {
            throw new Exception("Eroare la asignarea utilizatorului pe reactor.");
        }

        return true;
    }

    public function delete(int $id): bool {
        return $this->userRepository->deleteUser($id);
    }

    public function createUser(string $email, string $password, string $firstName, string $lastName, string $role): \App\Models\User {
        if ($this->userRepository->findByEmail($email)) {
            throw new Exception("Adresa de email este deja folosită.");
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $userRole = \App\Enums\UserRole::fromString($role);

        $user = new \App\Models\User(
            0, $email, $hashedPassword, $firstName, $lastName, $userRole, new \DateTime()
        );

        return $this->userRepository->create($user);
    }
}