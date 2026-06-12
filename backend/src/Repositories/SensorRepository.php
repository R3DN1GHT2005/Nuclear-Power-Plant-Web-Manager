<?php

/*
 * backend/src/Repositories/SensorRepository.php
 * Repository for Sensor — provides database query methods
 * for Sensor CRUD operations via PDO. Used by the corresponding
 * Service layer to decouple data access from business logic.
 */


namespace App\Repositories;

use App\Core\Database;
use App\DTOs\Request\Sensor\InsertSensorDTO;
use App\DTOs\Request\Sensor\UpdateSensorRequestDTO;
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

    public function create(InsertSensorDTO $dto): Sensor {
        $stmt = $this->db->prepare("\n            INSERT INTO sensors \n                (reactor_id, sensor_type, unit, min_safe_value, max_safe_value, current_value)\n            VALUES \n                (:reactor_id, :sensor_type, :unit, :min_safe_value, :max_safe_value, :current_value)\n            RETURNING *\n        ");

        $stmt->execute([
            'reactor_id' => $dto->reactor_id,
            'sensor_type' => $dto->sensor_type,
            'unit' => $dto->unit,
            'min_safe_value' => $dto->min_safe_value,
            'max_safe_value' => $dto->max_safe_value,
            'current_value' => $dto->current_value,
        ]);

        return Sensor::fromArray($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function update(int $id, UpdateSensorRequestDTO $dto): ?Sensor {
        $setParts = [];
        $params = ['id' => $id];

        if ($dto->sensor_type !== null) {
            $setParts[] = 'sensor_type = :sensor_type';
            $params['sensor_type'] = $dto->sensor_type;
        }

        if ($dto->unit !== null) {
            $setParts[] = 'unit = :unit';
            $params['unit'] = $dto->unit;
        }

        if ($dto->min_safe_value !== null) {
            $setParts[] = 'min_safe_value = :min_safe_value';
            $params['min_safe_value'] = $dto->min_safe_value;
        }

        if ($dto->max_safe_value !== null) {
            $setParts[] = 'max_safe_value = :max_safe_value';
            $params['max_safe_value'] = $dto->max_safe_value;
        }

        if (!$setParts) {
            return $this->findById($id);
        }

        $setParts[] = 'last_update = CURRENT_TIMESTAMP';

        $stmt = $this->db->prepare("\n            UPDATE sensors SET\n                " . implode(",\n                ", $setParts) . "\n            WHERE id = :id\n            RETURNING *\n        ");

        $stmt->execute($params);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? Sensor::fromArray($row) : null;
    }

    public function updateValue(int $id, float $newValue): bool {
        try {
           
            $this->db->beginTransaction();
            $stmtHistory = $this->db->prepare("
                INSERT INTO sensor_readings (sensor_id, recorded_value) 
                VALUES (:id, :val)
            ");
            $stmtHistory->bindParam(':id', $id, \PDO::PARAM_INT);
            $stmtHistory->bindParam(':val', $newValue);
            $stmtHistory->execute();

            $stmtUpdate = $this->db->prepare("
                UPDATE sensors 
                SET current_value = :val, last_update = CURRENT_TIMESTAMP 
                WHERE id = :id
            ");
            $stmtUpdate->bindParam(':id', $id, \PDO::PARAM_INT);
            $stmtUpdate->bindParam(':val', $newValue);
            $stmtUpdate->execute();

            return $this->db->commit();

        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e; 
        }
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM sensors WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }


    public function findLatestReadingsBySensor(int $sensorId, int $limit = 50): array {
        $stmt = $this->db->prepare("
            SELECT * FROM sensor_readings
            WHERE sensor_id = :sensor_id
            ORDER BY recorded_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':sensor_id', $sensorId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return array_map(
            fn($row) => \App\Models\SensorReading::fromArray($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function findLatestReadingsAllSensors(int $limit = 50): array {
        $stmt = $this->db->prepare("
            SELECT * FROM sensor_readings
            ORDER BY recorded_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return array_map(
            fn($row) => \App\Models\SensorReading::fromArray($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }


        public function findAllWithReactorStatus(): array {
        $stmt = $this->db->query("
            SELECT s.id, s.reactor_id, s.sensor_type, s.min_safe_value, s.max_safe_value,
                r.status AS reactor_status,
                r.current_efficiency AS reactor_efficiency
            FROM reactors r
            LEFT JOIN sensors s ON s.reactor_id = r.id
            WHERE r.status = 'Activ'
            ORDER BY r.id ASC, s.id ASC
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        

        $result = [];
        foreach ($rows as $row) {
            if ($row['id'] !== null) {
                

                $result[] = \App\Models\SensorConfig::fromArray($row);
            }
            

            

        }
        return $result;
    }

}
