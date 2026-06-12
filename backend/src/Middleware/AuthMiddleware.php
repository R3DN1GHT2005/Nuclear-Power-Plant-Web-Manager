<?php
namespace App\Middleware;

use App\Services\TokenService;
use App\Core\Response;
use Exception;

class AuthMiddleware {
    protected $tokenService;
    protected static $user = null; 

    public function __construct() {
        $this->tokenService = new TokenService();
    }
    
    public function handle(): bool {
        $token = $_COOKIE['access_token'] ?? null;

        if (!$token) {
            $this->abort(401, "Acces neautorizat. Token lipsă din cookie.");
            return false;
        }

        try {
            $decodedPayload = $this->tokenService->decodeAccessToken($token);
            self::$user = $decodedPayload->data;

            return true;

        } catch (Exception $e) {
            $this->abort(401, "Token invalid sau expirat.");
            return false;
        }
    }

  
    public static function getUser() {
        return self::$user;
    }

   
    protected function abort(int $code, string $message): void {
        Response::json([
            "success" => false, 
            "error" => $message
        ], $code);
        exit;
    }
}