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

    /**
     * Extrage toate alertele nerezolvate (active) din sistem.
     * * @return Alert[]
     */
    public function getAllActive(): array {
        $sql = "SELECT a.*, r.name as reactor_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                WHERE a.is_resolved = FALSE
                ORDER BY a.created_at DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transformăm array-urile brute în obiecte de tip Alert
        return array_map(fn($row) => AlertMapper::toModel($row), $rows);
    }

    /**
     * Găsește o alertă specifică după ID.
     */
    public function findById(int $id): ?Alert {
        $sql = "SELECT a.*, r.name as reactor_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
                WHERE a.id = :id";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return null;
        }

        return AlertMapper::toModel($row);
    }

    /**
     * Verifică dacă există deja o alertă nerezolvată de o anumită severitate pe un reactor.
     * Folosită pentru a preveni spam-ul de alerte duplicat.
     */
    public function findActiveByReactorAndSeverity(int $reactorId, AlertSeverity $severity): ?Alert {
        $sql = "SELECT a.*, r.name as reactor_name 
                FROM alerts a
                JOIN reactors r ON a.reactor_id = r.id
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

    /**
     * Marchează o alertă ca fiind rezolvată, salvând utilizatorul și notele de intervenție.
     */
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

    /**
     * Inserează o alertă nouă în baza de date.
     */
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
}