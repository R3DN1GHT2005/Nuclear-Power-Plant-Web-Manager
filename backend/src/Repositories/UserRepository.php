<?php
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

    /**
     * Aduce toți utilizatorii, inclusiv datele de asignare la reactor (prin LEFT JOIN)
     */
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

    /**
     * Caută un utilizator după ID, incluzând asignarea
     */
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

    /**
     * Caută un utilizator după Email (folosit mai ales la login/înregistrare)
     */
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

    /**
     * Inserează un utilizator nou folosind modelul User asamblat de Service/Mapper
     */
    public function create(User $user): User {
        $sql = "INSERT INTO users (email, password_hash, first_name, last_name, role) 
                VALUES (:email, :password_hash, :first_name, :last_name, :role) 
                RETURNING id, created_at";
        
        $stmt = $this->db->prepare($sql);
        
        // Extragem datele din modelul trimis
        $email = $user->getEmail();
        $passwordHash = $user->getPasswordHash();
        $firstName = $user->getFirstName();
        $lastName = $user->getLastName();
        $role = $user->getRole()->value; // Returnează string-ul din Enum

        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);
        $stmt->bindParam(':role', $role);
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Re-instanțiem modelul cu noul ID și data de creare generate de DB
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

    /**
     * Actualizează parola unui utilizator
     */
    public function updatePassword(int $id, string $newPasswordHash): bool {
        $sql = "UPDATE users SET password_hash = :password_hash WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':password_hash', $newPasswordHash);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    /**
     * Șterge un utilizator
     */
    public function deleteUser(int $id): bool {
        $sql = "DELETE FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    /**
     * Funcție helper pentru a construi curat obiectul User + ReactorPersonnel din rândul extras din DB
     */
    private function mapRowToUser(array $row): User {
        $user = new User(
            $row['id'],
            $row['email'],
            $row['password_hash'] ?? '', 
            $row['first_name'],
            $row['last_name'],
            UserRole::fromString($row['role']),
            new \DateTime($row['created_at'])
        );

        // Dacă avem date despre asignare (reactor_id nu e null), atașăm modelul ReactorPersonnel
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