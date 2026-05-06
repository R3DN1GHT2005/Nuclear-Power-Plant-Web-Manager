<?php

namespace App\Repositories;

use App\Core\Database;
use App\DTOs\Request\Sensor\CreateSensorDTO;
use App\DTOs\Request\Sensor\UpdateSensorDTO;
use App\Models\Sensor;
use PDO;

class SensorRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll(): array {
        $stmt = $this->db->query("SELECT * FROM sensors ORDER BY last_update DESC");
        return array_map(fn($row) => Sensor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findById(int $id): ?Sensor {
        $stmt = $this->db->prepare("SELECT * FROM sensors WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? Sensor::fromArray($row) : null;
    }

    public function findByReactorId(int $reactorId): array {
        $stmt = $this->db->prepare("SELECT * FROM sensors WHERE reactor_id = :reactor_id ORDER BY sensor_type ASC");
        $stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
        $stmt->execute();
        return array_map(fn($row) => Sensor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findByType(string $type): array {
        $stmt = $this->db->prepare("SELECT * FROM sensors WHERE sensor_type = :type ORDER BY last_update DESC");
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt->execute();
        return array_map(fn($row) => Sensor::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create(CreateSensorDTO $dto): Sensor {
        $stmt = $this->db->prepare("
            INSERT INTO sensors 
                (reactor_id, sensor_type, current_value, unit)
            VALUES 
                (:reactor_id, :sensor_type, :current_value, :unit)
            RETURNING *
        ");

        $stmt->execute([
            'reactor_id'    => $dto->reactor_id,
            'sensor_type'   => $dto->sensor_type,
            'current_value' => $dto->current_value,
            'unit'          => $dto->unit,
        ]);

        return Sensor::fromArray($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function update(int $id, UpdateSensorDTO $dto): ?Sensor {
        $stmt = $this->db->prepare("
            UPDATE sensors SET
                sensor_type   = :sensor_type,
                unit          = :unit,
                last_update   = CURRENT_TIMESTAMP
            WHERE id = :id
            RETURNING *
        ");

        $stmt->execute([
            'id'          => $id,
            'sensor_type' => $dto->sensor_type,
            'unit'        => $dto->unit
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? Sensor::fromArray($row) : null;
    }

    public function updateValue(int $id, float $newValue): bool {
        $stmt = $this->db->prepare("
            UPDATE sensors 
            SET current_value = :val, last_update = CURRENT_TIMESTAMP 
            WHERE id = :id
        ");
        $stmt->bindParam(':val', $newValue);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM sensors WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}