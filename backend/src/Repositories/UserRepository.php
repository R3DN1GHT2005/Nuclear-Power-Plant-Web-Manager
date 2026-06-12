<?php

/*
 * backend/src/Repositories/UserRepository.php
 * Repository for User — provides database query methods
 * for User CRUD operations via PDO. Used by the corresponding
 * Service layer to decouple data access from business logic.
 */

namespace App\Repositories;

use App\Core\Database;
use App\Models\User;
use App\Models\ReactorPersonnel;
use App\Enums\UserRole;
use PDO;

class UserRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    
    public function getAllUsers(): array {
        $sql = "
            SELECT u.*, 
                   rp.id as personnel_id, 
                   rp.user_id, 
                   rp.reactor_id, 
                   rp.intervention_role 
            FROM users u
            LEFT JOIN reactor_personnel rp ON u.id = rp.user_id
            ORDER BY u.id ASC
        ";
        
        $stmt = $this->db->query($sql);
        $users = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $user = $this->mapRowToUser($row);
            $users[] = $user;
        }
        
        return $users;
    }

    
    public function findById(int $id): ?User {
        $sql = "
            SELECT u.*, 
                   rp.id as personnel_id, 
                   rp.user_id, 
                   rp.reactor_id, 
                   rp.intervention_role 
            FROM users u
            LEFT JOIN reactor_personnel rp ON u.id = rp.user_id
            WHERE u.id = :id
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row ? $this->mapRowToUser($row) : null;
    }

    
    public function findByRole(string $role): array {
        $sql = "
            SELECT u.*, 
                   rp.id as personnel_id, 
                   rp.user_id, 
                   rp.reactor_id, 
                   rp.intervention_role 
            FROM users u
            LEFT JOIN reactor_personnel rp ON u.id = rp.user_id
            WHERE u.role = :role
            ORDER BY u.first_name ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':role', $role);
        $stmt->execute();

        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = $this->mapRowToUser($row);
        }
        return $users;
    }

    public function findByEmail(string $email): ?User {
        $sql = "
            SELECT u.*, 
                   rp.id as personnel_id, 
                   rp.user_id, 
                   rp.reactor_id, 
                   rp.intervention_role 
            FROM users u
            LEFT JOIN reactor_personnel rp ON u.id = rp.user_id
            WHERE u.email = :email
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row ? $this->mapRowToUser($row) : null;
    }

    
    public function create(User $user): User {
        $sql = "INSERT INTO users (email, password_hash, first_name, last_name, role) 
                VALUES (:email, :password_hash, :first_name, :last_name, :role) 
                RETURNING id, created_at";
        
        $stmt = $this->db->prepare($sql);
        
        

        $email = $user->getEmail();
        $passwordHash = $user->getPasswordHash();
        $firstName = $user->getFirstName();
        $lastName = $user->getLastName();
        $role = $user->getRole()->value; 


        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);
        $stmt->bindParam(':role', $role);
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        

        return new User(
            $result['id'],
            $email,
            $passwordHash,
            $firstName,
            $lastName,
            $user->getRole(),
            new \DateTime($result['created_at'])
        );
    }

    
    public function updatePassword(int $id, string $newPasswordHash): bool {
        $sql = "UPDATE users SET password_hash = :password_hash WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':password_hash', $newPasswordHash);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    
    public function deleteUser(int $id): bool {
        $sql = "DELETE FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    
    private function mapRowToUser(array $row): User {
        $user = new User(
            $row['id'],
            $row['email'],
            $row['password_hash'] ?? '', 
            $row['first_name'],
            $row['last_name'],
            UserRole::fromString($row['role']),
            new \DateTime($row['created_at']),
            $row['rss_token'] ?? null
        );

        

        if (!empty($row['reactor_id'])) {
            $assignment = ReactorPersonnel::fromArray($row);
            $user->setAssignment($assignment);
        }

        return $user;
    }

    public function findByRssToken(string $token){
        $sql="Select * from users where rss_token = :token";
        $stmt=$this->db->prepare($sql);
        $stmt->execute(['token' => $token]);
        return $stmt->fetch();
    }

    public function updateRssToken(int $userId,string $newToken){
        $sql="Update users set rss_token = :token where id= :userId";
        $stmt=$this->db->prepare($sql);
        return $stmt->execute(['token' => $newToken, 'userId' => $userId]);
        
    }
}