/*
 * backend/src/Services/SessionService.php
 * SessionService — implements business logic for session
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */
<?php
namespace App\Services;

use App\Repositories\RefreshTokenRepository;
use App\Services\TokenService;
use DateTimeImmutable;

class SessionService {
    private $refreshTokenRepository;
    private $tokenService;
    private $refreshTokenTtl; 

    public function __construct() {
        $this->refreshTokenRepository = new RefreshTokenRepository();
        $this->tokenService = new TokenService($_ENV['JWT_SECRET'] ?? '', $_ENV['JWT_ISSUER'] ?? '');
        $this->refreshTokenTtl = 2592000;  

    }

    public function createSession($userId, $role) {
        $accessToken = $this->tokenService->generateAccessToken($userId, $role);
        $refreshToken = $this->tokenService->generateRefreshToken();

        $now = new DateTimeImmutable();
        $expiresAt = $now->modify("+{$this->refreshTokenTtl} seconds");

        $this->refreshTokenRepository->save(
            $userId, 
            $refreshToken, 
            $expiresAt->format('Y-m-d H:i:s')
        );

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'cookie_expires' => $expiresAt->getTimestamp()
        ];
    }

    public function refreshSession($refreshToken) {
        $user = $this->refreshTokenRepository->findWithUser($refreshToken);
        
        if (!$user) {
            return false; 
        }

        $now = new DateTimeImmutable();
        $expires = new DateTimeImmutable($user['expires_at']);
        
        if ($now > $expires) {
            $this->refreshTokenRepository->delete($refreshToken);
            return false;
        }

        $role = $user['role'] ?? 'viewer';
        $newAccessToken = $this->tokenService->generateAccessToken($user['id'], $role);

        return [
            'access_token' => $newAccessToken,
        ];
    }

    public function destroySession($refreshToken) {
        return $this->refreshTokenRepository->delete($refreshToken);
    }
}