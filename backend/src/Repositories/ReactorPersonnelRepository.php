<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\ReactorPersonnel;
use PDO;

class ReactorPersonnelRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function removeAssignmentForUser(int $userId): bool {
        $sql = "DELETE FROM reactor_personnel WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        
        return $stmt->execute();
    }


    public function assignUserToReactor(int $userId, int $reactorId, string $role): bool {
        // 1. Curățăm asignările vechi pentru acest user ca să menținem consistența bazei de date
        $this->removeAssignmentForUser($userId);

        $sql = "INSERT INTO reactor_personnel (user_id, reactor_id, intervention_role) 
                VALUES (:user_id, :reactor_id, :role)";
        $stmt = $this->db->prepare($sql);
        
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
        $stmt->bindParam(':role', $role, PDO::PARAM_STR);
        
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

 
    public function findByUserId(int $userId): ?ReactorPersonnel {
        $sql = "SELECT * FROM reactor_personnel WHERE user_id = :user_id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? ReactorPersonnel::fromArray($row) : null;
    }

    
    /**
     * Află la ce reactor este asignat un utilizator folosind tabela reactor_personnel
     */
    public function getAssignedReactorId(int $userId): ?int {
        $sql = "SELECT reactor_id FROM reactor_personnel WHERE user_id = :user_id LIMIT 1";
        
        // Presupunând că ai o proprietate $this->db care ține conexiunea PDO
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $row ? (int) $row['reactor_id'] : null;
    }
}