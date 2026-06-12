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
        
        // Dacă autentificarea a reușit, generăm sesiunea și setăm cookie-urile
        if ($user) {
            $session = $this->sessionService->createSession($user['id'], $user['role'] ?? 'viewer');

            setcookie('access_token', $session['access_token'], [
                'expires'  => time() + 900, // 15 minute
                'path'     => '/',
                'secure'   => true,         // Modificat pentru HTTPS
                'httponly' => true, 
                'samesite' => 'None'        // Modificat pentru Cross-Origin
            ]);

            setcookie('refresh_token', $session['refresh_token'], [
                'expires'  => time() + 604800, // 7 zile
                'path'     => '/',
                'secure'   => true,         // Modificat pentru HTTPS
                'httponly' => true,
                'samesite' => 'None'        // Modificat pentru Cross-Origin
            ]);

            http_response_code(200);
            echo json_encode([
                "message" => "Logare cu succes!",
                "user" => $user
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
            'secure'   => true,         // Modificat pentru HTTPS
            'httponly' => true,
            'samesite' => 'None'        // Modificat pentru Cross-Origin
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
            'secure'   => true,         // Modificat pentru HTTPS
            'httponly' => true,
            'samesite' => 'None'        // Modificat pentru Cross-Origin
        ]);

        setcookie('refresh_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => true,         // Modificat pentru HTTPS
            'httponly' => true,
            'samesite' => 'None'        // Modificat pentru Cross-Origin
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
}