<?php

/*
 * backend/src/Services/AuthService.php
 * AuthService — implements business logic for auth
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */

namespace App\Services;

use App\Repositories\UserRepository;
use Exception;




class AuthService {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function login(string $email, string $password): array|false {
        $user = $this->userRepository->findByEmail($email);
        if ($user && password_verify($password, $user->getPasswordHash())) {
            return [
                'id' => $user->getId(),
                'full_name' => $user->getFullName(),
                'role' => $user->getRole()->value
            ];
        }
        return false;
    }
}