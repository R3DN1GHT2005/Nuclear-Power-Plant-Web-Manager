<?php
namespace App\Services;

use App\Repositories\UserRepository;
use Exception;

class AuthService {
    private $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function login($email, $password) {
        $user = $this->userRepository->findByEmail($email);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']); // Nu returnăm hash-ul parolei
            $user['full_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
            return $user;
        }
        
        return false;
    }   

    public function register($email, $password, $firstName, $lastName, $role = 'viewer') {
        $existingUser = $this->userRepository->findByEmail($email);
        
        if ($existingUser) {
            throw new Exception("Adresa de email este deja folosită.");
        }
        
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        return $this->userRepository->register($email, $hashedPassword, $firstName, $lastName, $role);
    }

    // --- NOUA METODĂ PENTRU ADMIN ---
    public function adminUpdatePassword($userId, $newPassword) {
        // 1. Securitate: hash-uim mereu noua parolă
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        
        // 2. Apelăm repository-ul pentru a face update-ul în baza de date.
        // Folosim metoda care exista deja în vechiul tău cod de resetare.
        $updated = $this->userRepository->updateUserPassword($userId, $hashedPassword);
        
        if (!$updated) {
            throw new Exception("Utilizatorul nu a fost găsit sau parola nu a putut fi modificată.");
        }
        
        return true;
    }
}