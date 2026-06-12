/*
 * backend/src/Repositories/ReactorMaintenanceRepository.php
 * Repository for ReactorMaintenance — provides database query methods
 * for ReactorMaintenance CRUD operations via PDO. Used by the corresponding
 * Service layer to decouple data access from business logic.
 */
<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\ReactorMaintenance;
use PDO;

class ReactorMaintenanceRepository {
    private PDO $db;

    public function __construct() {
        

        $this->db = Database::getInstance()->getConnection();
    }

    public function beginTransaction(): void { 
        $this->db->beginTransaction(); 
    }
    
    public function commit(): void { 
        $this->db->commit(); 
    }
    
    public function rollBack(): void { 
        $this->db->rollBack(); 
    }
    
    public function inTransaction(): bool { 
        return $this->db->inTransaction(); 
    }

    public function insertMaintenanceLog(int $reactorId, string $endDate, ?string $reason): void {
        $query = "INSERT INTO reactor_maintenance (reactor_id, estimated_end_date, reason) 
                  VALUES (:reactor_id, :end_date, :reason)";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':reactor_id' => $reactorId,
            ':end_date'   => $endDate,
            ':reason'     => $reason
        ]);
    }

    public function updateReactorStatus(int $reactorId, string $status, ?int $efficiency = null): void {
        $query = "UPDATE reactors SET status = :status";
        $params = [
            ':status' => $status,
            ':id' => $reactorId
        ];

        if ($efficiency !== null) {
            $query .= ", current_efficiency = :efficiency";
            $params[':efficiency'] = $efficiency;
        }

        $query .= " WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
    }

    public function markMaintenanceCompleted(int $reactorId): void {
        $query = "UPDATE reactor_maintenance 
                  SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP 
                  WHERE reactor_id = :reactor_id AND is_completed = FALSE";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':reactor_id' => $reactorId]);
    }

    public function getHistoryByReactor(int $reactorId): array {
        $query = "SELECT * FROM reactor_maintenance WHERE reactor_id = :reactor_id ORDER BY started_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':reactor_id' => $reactorId]);
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $models = [];
        
        foreach ($rows as $row) {
            $models[] = new ReactorMaintenance(
                $row['id'],
                $row['reactor_id'],
                $row['started_at'],
                $row['estimated_end_date'],
                $row['reason'],
                (bool) $row['is_completed'],
                $row['completed_at']
            );
        }
        return $models;
    }
}