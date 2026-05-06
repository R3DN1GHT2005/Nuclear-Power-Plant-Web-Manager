<?php

namespace App\Repositories;

use App\Core\Database;
use App\DTOs\Request\CreateReactorDTO;
use App\DTOs\Request\UpdateReactorDTO;
use App\Models\Reactor;
use PDO;

class ReactorRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll(): array {
        $stmt = $this->db->query("SELECT * FROM reactors ORDER BY created_at DESC");
        return array_map(fn($row) => Reactor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findById(int $id): ?Reactor {
        $stmt = $this->db->prepare("SELECT * FROM reactors WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? Reactor::fromArray($row) : null;
    }

    public function findByStatus(string $status): array {
        $stmt = $this->db->prepare("SELECT * FROM reactors WHERE status = :status ORDER BY name ASC");
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->execute();
        return array_map(fn($row) => Reactor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findNeedingAttention(int $efficiencyThreshold = 50): array {
        $stmt = $this->db->prepare("
            SELECT * FROM reactors 
            WHERE status IN ('Alertă', 'Mentenanță', 'Oprit') 
               OR current_efficiency < :threshold
            ORDER BY status ASC, current_efficiency ASC
        ");
        $stmt->bindParam(':threshold', $efficiencyThreshold, PDO::PARAM_INT);
        $stmt->execute();
        return array_map(fn($row) => Reactor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findLastMaintained(int $limit = 5): array {
        $stmt = $this->db->prepare("SELECT * FROM reactors ORDER BY last_maintenance DESC LIMIT :limit");
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return array_map(fn($row) => Reactor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create(CreateReactorDTO $dto, float $soilStability, float $seismicRisk): Reactor {
        $stmt = $this->db->prepare("
            INSERT INTO reactors 
                (name, location_name, latitude, longitude, status,
                 installed_power, current_efficiency, soil_stability,
                 seismic_risk, last_maintenance)
            VALUES 
                (:name, :location_name, :latitude, :longitude, :status,
                 :installed_power, :current_efficiency, :soil_stability,
                 :seismic_risk, :last_maintenance)
            RETURNING *
        ");

        $stmt->execute([
            'name'               => $dto->name,
            'location_name'      => $dto->location_name,
            'latitude'           => $dto->latitude,
            'longitude'          => $dto->longitude,
            'status'             => $dto->status,
            'installed_power'    => $dto->installed_power,
            'current_efficiency' => $dto->current_efficiency,
            'soil_stability'     => $soilStability,
            'seismic_risk'       => $seismicRisk,
            'last_maintenance'   => $dto->last_maintenance,
        ]);

        return Reactor::fromArray($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function update(int $id, UpdateReactorDTO $dto): ?Reactor {
        $stmt = $this->db->prepare("
            UPDATE reactors SET
                name               = :name,
                status             = :status,
                installed_power    = :installed_power,
                current_efficiency = :current_efficiency,
                last_maintenance   = :last_maintenance
            WHERE id = :id
            RETURNING *
        ");

        $stmt->execute([
            'id'                 => $id,
            'name'               => $dto->name,
            'status'             => $dto->status,
            'installed_power'    => $dto->installed_power,
            'current_efficiency' => $dto->current_efficiency,
            'last_maintenance'   => $dto->last_maintenance,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? Reactor::fromArray($row) : null;
    }

    public function updateGeologicalData(int $id, float $soilStability, float $seismicRisk): bool {
        $stmt = $this->db->prepare("
            UPDATE reactors 
            SET soil_stability = :soil, seismic_risk = :risk 
            WHERE id = :id
        ");
        $stmt->bindParam(':soil', $soilStability);
        $stmt->bindParam(':risk', $seismicRisk);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM reactors WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}