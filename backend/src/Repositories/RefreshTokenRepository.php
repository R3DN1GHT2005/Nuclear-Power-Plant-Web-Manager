<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

class RefreshTokenRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function save($userId, $token, $expiresAt) {
        $sql = "INSERT INTO refresh_tokens (user_id, token, expires_at) 
                VALUES (:user_id, :token, :expires_at)";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->bindParam(':expires_at', $expiresAt, PDO::PARAM_STR);
        
        return $stmt->execute();
    }

    public function findWithUser($token) {
        $sql = "SELECT u.id, u.email, u.first_name, u.last_name, u.role, rt.expires_at 
                FROM users u
                JOIN refresh_tokens rt ON u.id = rt.user_id
                WHERE rt.token = :token";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetch();
    }

    public function delete($token) {
        $sql = "DELETE FROM refresh_tokens WHERE token = :token";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        
        return $stmt->execute();
    }
}