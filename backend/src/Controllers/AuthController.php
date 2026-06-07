<?php
namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\SessionService;
use App\Middleware\AuthMiddleware;
use Exception;

class AuthController {

    private $authService;
    private $sessionService;

    public function __construct() {
        $this->authService = new AuthService();
        $this->sessionService = new SessionService();
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (empty($email) || empty($password)){
            http_response_code(400);
            echo json_encode(["error" => "Email și parola sunt obligatorii!"]);
            return;
        }

        $user = $this->authService->login($email, $password);
        
        if ($user) {
            // Creăm sesiunea (Access Token scurt + Refresh Token lung)
            $session = $this->sessionService->createSession($user['id'], $user['role'] ?? 'viewer');

            // Setăm Access Token-ul într-un cookie
            // Expiră în mod normal în 15 minute (900 secunde). Aici poți ajusta dacă Service-ul tău dă un alt timp.
            // 1. Setăm Access Token-ul (valabil 15 minute)
            // Setăm Access Token-ul (valabil 15 minute)
           setcookie('access_token', $session['access_token'], [
    'expires'  => time() + 900,
    'path'     => '/',
    'domain'   => '127.0.0.1',   // ← adaugă asta
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);

setcookie('refresh_token', $session['refresh_token'], [
    'expires'  => time() + 604800,
    'path'     => '/',
    'domain'   => '127.0.0.1',   // ← adaugă asta
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);

            http_response_code(200);
            echo json_encode([
                "message" => "Logare cu succes!",
                "user" => $user
                // Am eliminat "access_token" de aici pentru securitate, acum stă ascuns în cookie!
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Email sau parolă incorectă!"]);
        }
    }

    public function refresh() {
        // Preluăm token-ul de refresh din cookie (generat automat de browser)
        $refreshToken = $_COOKIE['refresh_token'] ?? null;

        if (!$refreshToken) {
            http_response_code(401);
            echo json_encode(["error" => "Refresh token lipsă."]);
            return;
        }

        // Generăm un nou Access Token dacă Refresh Token-ul e valid
        $newAccessToken = $this->sessionService->refreshSession($refreshToken);

        if (!$newAccessToken) {
            // Dacă token-ul a expirat sau nu există în DB, ștergem ambele cookie-uri
            setcookie('refresh_token', '', time() - 3600, '/api/auth/refresh');
            setcookie('access_token', '', time() - 3600, '/');
            
            http_response_code(401);
            echo json_encode(["error" => "Sesiune expirată sau invalidă. Vă rugăm să vă relogați."]);
            return;
        }

        // Extragem șirul de caractere din array-ul primit de la Service
        $tokenString = is_array($newAccessToken) ? $newAccessToken['access_token'] : $newAccessToken;

        // Setăm NOUL Access Token primit de la Service
        setcookie('access_token', $tokenString, [
            'expires'  => time() + 900, 
            'path'     => '/',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Sesiune reîmprospătată"
            // Nu mai trimitem noul token prin JSON, e deja actualizat în browser prin Set-Cookie
        ]);
    }

    public function logout() {
        $refreshToken = $_COOKIE['refresh_token'] ?? null;

        if ($refreshToken) {
            // Ștergem sesiunea din baza de date
            $this->sessionService->destroySession($refreshToken);
        }

        setcookie('access_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        setcookie('refresh_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        http_response_code(200);
        echo json_encode(["message" => "Delogare cu succes!"]);
    }

    public function me(): void {
        $jwtUser = AuthMiddleware::getUser();
        $userId = $jwtUser->userId ?? null;

        if (!$userId) {
            http_response_code(401);
            echo json_encode(["error" => "Neautorizat"]);
            return;
        }

        $userRepo = new UserRepository();
        $userModel = $userRepo->findById($userId);

        if (!$userModel) {
            http_response_code(404);
            echo json_encode(["error" => "Utilizator negăsit"]);
            return;
        }

        $reactorId = null;
        $assignment = $userModel->getAssignment();
        if ($assignment) {
            $reactorId = $assignment->getReactorId();
        }

        http_response_code(200);
        echo json_encode([
            "id" => $userModel->getId(),
            "email" => $userModel->getEmail(),
            "first_name" => $userModel->getFirstName(),
            "last_name" => $userModel->getLastName(),
            "role" => $userModel->getRole()->value,
            "reactor_id" => $reactorId
        ]);
    }

    // ==========================================
    // RUTE PROTEJATE DE ADMIN MIDDLEWARE
    // ==========================================

    public function register() {
        $data = json_decode(file_get_contents("php://input"), true) ?? [];

        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $firstName = $data['first_name'] ?? null;
        $lastName = $data['last_name'] ?? null;
        $role = $data['role'] ?? 'viewer';

        // Logica pentru cazul în care front-end-ul trimite "full_name" în loc de nume separat
        if ((!$firstName || !$lastName) && !empty($data['full_name'])) {
            $parts = preg_split('/\s+/', trim($data['full_name']), 2);
            $firstName = $firstName ?: ($parts[0] ?? null);
            $lastName = $lastName ?: ($parts[1] ?? null);
        }

        if (empty($email) || empty($password) || empty($firstName) || empty($lastName)) {
            http_response_code(400);
            echo json_encode(["error" => "Email, password, first_name și last_name sunt obligatorii!"]);
            return;
        }

        try {
            $newUserId = $this->authService->register($email, $password, $firstName, $lastName, $role);
            
            http_response_code(201);
            echo json_encode([
                "message" => "Cont creat cu succes!",
                "user_id" => $newUserId
            ]);

        } catch (Exception $e) {
            http_response_code(409); // Conflict (ex: email-ul există deja)
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    public function updatePassword() {
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        
        $targetUserId = $data['user_id'] ?? null; 
        $newPassword = $data['new_password'] ?? null;

        if (!$targetUserId || !$newPassword) {
            http_response_code(400);
            echo json_encode(["error" => "Câmpurile user_id și new_password sunt obligatorii!"]);
            return;
        }

        try {
            $this->authService->adminUpdatePassword($targetUserId, $newPassword);
            
            http_response_code(200);
            echo json_encode(["message" => "Parola utilizatorului a fost actualizată cu succes!"]);
        } catch (Exception $e) {
            http_response_code(404); // Not Found (dacă user_id nu există)
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}