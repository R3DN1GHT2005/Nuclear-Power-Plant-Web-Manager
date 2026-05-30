<?php
namespace App\Middleware;

use App\Services\TokenService;
use App\Core\Response;
use Exception;

class AuthMiddleware {
    protected $tokenService;
    // Această proprietate statică va păstra datele utilizatorului pe durata request-ului
    protected static $user = null; 

    public function __construct() {
        // Instanțiem serviciul direct
        $this->tokenService = new TokenService();
    }

    public function handle(): bool {
        // AICI ESTE MODIFICAREA: Citim token-ul direct din Cookie-ul HttpOnly
        $token = $_COOKIE['access_token'] ?? null;

        if (!$token) {
            $this->abort(401, "Acces neautorizat. Token lipsă din cookie.");
            return false;
        }

        try {
            // Decodăm token-ul la fel ca înainte
            $decodedPayload = $this->tokenService->decodeAccessToken($token);
            
            // Salvăm datele utilizatorului pentru a putea fi folosite în Controller sau în AdminMiddleware
            self::$user = $decodedPayload->data;

            return true; // Token valid, lăsăm execuția să meargă mai departe spre Controller

        } catch (Exception $e) {
            $this->abort(401, "Token invalid sau expirat.");
            return false;
        }
    }

    // Metodă ajutătoare pentru a prelua user-ul în Controllere (ex: AuthMiddleware::getUser())
    public static function getUser() {
        return self::$user;
    }

    // Metodă internă pentru oprirea rapidă a execuției și trimiterea erorii
    protected function abort(int $code, string $message): void {
        Response::json([
            "success" => false, 
            "error" => $message
        ], $code);
        exit;
    }
}