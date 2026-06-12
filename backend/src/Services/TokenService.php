/*
 * backend/src/Services/TokenService.php
 * TokenService — implements business logic for token
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */
<?php
namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class TokenService {
    private string $secretKey;
    private string $issuer;
    private int $accessTokenTtl; 


    public function __construct() {
        $this->secretKey = $_ENV['JWT_SECRET'] ?? '';
        $this->issuer = $_ENV['JWT_ISSUER'] ?? '';
        $this->accessTokenTtl = 900; 

    }

    public function generateAccessToken(int $userId, string $role): string {
        $payload = [
            'iss'  => $this->issuer,
            'iat'  => time(),
            'exp'  => time() + $this->accessTokenTtl,
            'data' => [
                'userId' => $userId,
                'role'   => $role,
            ]
        ];

        return JWT::encode($payload, $this->secretKey, 'HS256');
    }

    public function generateRefreshToken(): string {
        return bin2hex(random_bytes(32));
    }

    public function decodeAccessToken(string $token) {
        return JWT::decode($token, new Key($this->secretKey, 'HS256'));
    }
}