<?php

namespace App\Repositories;

use App\Core\Database;
use App\DTOs\Request\reactor\InsertReactorDTO;
use App\DTOs\Request\reactor\UpdateReactorDTO;
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

    public function create(InsertReactorDTO $dto): Reactor {
        $stmt = $this->db->prepare("
            INSERT INTO reactors 
                 (name, location_name, latitude, longitude, status,
                  installed_power, soil_stability, seismic_risk,
                  reactor_type, cooling_water_source, distance_to_nearest_city_km, elevation_meters, webhook_discord)
            VALUES 
                 (:name, :location_name, :latitude, :longitude, :status,
                  :installed_power, :soil_stability, :seismic_risk,
                  :reactor_type, :cooling_water_source, :distance_to_nearest_city_km, :elevation_meters, :webhook_url)
            RETURNING *
        ");

        $stmt->execute([
              'name' => $dto->name,
              'location_name' => $dto->location_name,
              'latitude' => $dto->latitude,
              'longitude' => $dto->longitude,
              'status' => $dto->status,
              'installed_power' => $dto->installed_power,
              'soil_stability' => $dto->soil_stability,
              'seismic_risk' => $dto->seismic_risk,
              'reactor_type' => $dto->reactor_type,
              'cooling_water_source' => $dto->cooling_water_source,
              'distance_to_nearest_city_km' => $dto->distance_to_nearest_city_km,
              'elevation_meters' => $dto->elevation_meters,
              'webhook_url' => $dto->webhook_url,
        ]);

        return Reactor::fromArray($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function updateCalculatedFields(
        int $id,
        float $soilStability,
        float $seismicRisk,
        string $coolingWaterSource,
        float $distanceToNearestCityKm,
        float $elevationMeters
    ): ?Reactor {
        $stmt = $this->db->prepare("\n            UPDATE reactors SET\n                soil_stability = :soil_stability,\n                seismic_risk = :seismic_risk,\n                cooling_water_source = :cooling_water_source,\n                distance_to_nearest_city_km = :distance_to_nearest_city_km,\n                elevation_meters = :elevation_meters\n            WHERE id = :id\n            RETURNING *\n        ");

        $stmt->execute([
            'id' => $id,
            'soil_stability' => $soilStability,
            'seismic_risk' => $seismicRisk,
            'cooling_water_source' => $coolingWaterSource,
            'distance_to_nearest_city_km' => $distanceToNearestCityKm,
            'elevation_meters' => $elevationMeters,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? Reactor::fromArray($row) : null;
    }

    public function update(int $id, UpdateReactorDTO $dto): ?Reactor {
        $stmt = $this->db->prepare("
            UPDATE reactors SET
                name                      = :name,
                location_name             = :location_name,
                latitude                  = :latitude,
                longitude                 = :longitude,
                status                    = :status,
                installed_power           = :installed_power,
                current_efficiency        = :current_efficiency,
                last_maintenance          = :last_maintenance,
                soil_stability            = :soil_stability,
                seismic_risk              = :seismic_risk,
                reactor_type              = :reactor_type,
                cooling_water_source      = :cooling_water_source,
                distance_to_nearest_city_km = :distance_to_nearest_city_km,
                elevation_meters          = :elevation_meters
            WHERE id = :id
            RETURNING *
        ");

        $stmt->execute([
            'id'                         => $id,
            'name'                       => $dto->name,
            'location_name'              => $dto->location_name,
            'latitude'                   => $dto->latitude,
            'longitude'                  => $dto->longitude,
            'status'                     => $dto->status,
            'installed_power'            => $dto->installed_power,
            'current_efficiency'         => $dto->current_efficiency,
            'last_maintenance'           => $dto->last_maintenance,
            'soil_stability'             => $dto->soil_stability,
            'seismic_risk'               => $dto->seismic_risk,
            'reactor_type'               => $dto->reactor_type,
            'cooling_water_source'       => $dto->cooling_water_source,
            'distance_to_nearest_city_km' => $dto->distance_to_nearest_city_km,
            'elevation_meters'           => $dto->elevation_meters,
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


    
    public function updateStatus(int $id, string $newStatus): bool {
        $stmt = $this->db->prepare("
            UPDATE reactors 
            SET status = :status 
            WHERE id = :id
        ");
        $stmt->bindParam(':status', $newStatus, PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }


    public function updateEfficiency(int $id, float $efficiency): bool {
        $stmt = $this->db->prepare("
            UPDATE reactors 
            SET current_efficiency = :efficiency 
            WHERE id = :id
        ");
        $stmt->bindParam(':efficiency', $efficiency);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    
    public function findAllActive(): array {
        $stmt = $this->db->prepare("
            SELECT * FROM reactors 
            WHERE status = 'Activ'
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        return array_map(fn($row) => Reactor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

}