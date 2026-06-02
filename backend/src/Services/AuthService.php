<?php
namespace App\Services;

use App\Repositories\UserRepository;
use Exception;

// În App/Services/AuthService.php

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
    // METODA REGISTER A FOST ȘTEARSĂ DE AICI
}