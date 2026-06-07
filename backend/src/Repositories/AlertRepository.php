<?php

namespace App\Repositories;

use App\Core\Database;
use App\Models\Alert;
use App\Mappers\AlertMapper;
use App\Enums\AlertSeverity;
use PDO;

class AlertRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAllActive(): array {
        $sql = "SELECT a.*, r.name as reactor_name, CONCAT(u.first_name, ' ', u.last_name) as resolver_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                LEFT JOIN users u ON a.resolved_by = u.id
                WHERE a.is_resolved = FALSE
                ORDER BY a.created_at DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(fn($row) => AlertMapper::toModel($row), $rows);
    }

    /**
     * Extrage toate alertele rezolvate, ordonate cronologic (cele mai recente primele).
     * @return Alert[]
     */
    public function getAllResolved(): array {
        $sql = "SELECT a.*, r.name as reactor_name, CONCAT(u.first_name, ' ', u.last_name) as resolver_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                LEFT JOIN users u ON a.resolved_by = u.id
                WHERE a.is_resolved = TRUE
                ORDER BY a.resolved_at DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(fn($row) => AlertMapper::toModel($row), $rows);
    }

    /**
     * Găsește o alertă specifică după ID.
     */
    public function findById(int $id): ?Alert {
        $sql = "SELECT a.*, r.name as reactor_name, CONCAT(u.first_name, ' ', u.last_name) as resolver_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                LEFT JOIN users u ON a.resolved_by = u.id
                WHERE a.id = :id";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return null;
        }

        return AlertMapper::toModel($row);
    }

    public function findActiveByReactorAndSeverity(int $reactorId, AlertSeverity $severity): ?Alert {
        $sql = "SELECT a.*, r.name as reactor_name, CONCAT(u.first_name, ' ', u.last_name) as resolver_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                LEFT JOIN users u ON a.resolved_by = u.id
                WHERE a.reactor_id = :reactor_id 
                  AND a.severity = :severity 
                  AND a.is_resolved = FALSE
                LIMIT 1";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':reactor_id' => $reactorId,
            ':severity' => $severity->value
        ]);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return null;
        }

        return AlertMapper::toModel($row);
    }

    public function resolve(int $alertId, int $userId, string $notes): bool {
        $sql = "UPDATE alerts 
                SET is_resolved = TRUE, 
                    resolved_by = :user_id, 
                    resolution_notes = :notes,
                    resolved_at = CURRENT_TIMESTAMP 
                WHERE id = :id";
                
        $stmt = $this->db->prepare($sql);
        
        $stmt->execute([
            ':user_id' => $userId,
            ':notes' => trim($notes),
            ':id' => $alertId
        ]);
        
        return $stmt->rowCount() > 0;
    }

    public function create(Alert $alert): Alert {
        $sql = "INSERT INTO alerts (reactor_id, severity, message, is_resolved, created_at) 
                VALUES (:reactor_id, :severity, :message, FALSE, CURRENT_TIMESTAMP)";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':reactor_id' => $alert->getReactorId(),
            ':severity' => $alert->getSeverity()->value,
            ':message' => $alert->getMessage()
        ]);
        
        // Returnăm alerta proaspăt creată cu tot cu numele reactorului
        $newId = (int) $this->db->lastInsertId();
        return $this->findById($newId);
    }

    public function getAll(): array {
        $sql = "SELECT a.*, r.name as reactor_name, CONCAT(u.first_name, ' ', u.last_name) as resolver_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                LEFT JOIN users u ON a.resolved_by = u.id
                ORDER BY a.created_at DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(fn($row) => AlertMapper::toModel($row), $rows);
    }

    public function getAllByReactorId(int $reactorId): array {
        $sql = "SELECT a.*, r.name as reactor_name, CONCAT(u.first_name, ' ', u.last_name) as resolver_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                LEFT JOIN users u ON a.resolved_by = u.id
                WHERE a.reactor_id = :reactor_id 
                ORDER BY a.created_at DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':reactor_id' => $reactorId]);
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(fn($row) => AlertMapper::toModel($row), $rows);
    }
}