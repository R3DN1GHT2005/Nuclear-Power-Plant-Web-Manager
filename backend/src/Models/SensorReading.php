/*
 * backend/src/Models/SensorReading.php
 * SensorReading domain model — represents the SensorReading entity with
 * properties matching the database schema. Used across Services,
 * Repositories, and Mappers for data transfer within the backend.
 */
<?php

namespace App\Models;

class SensorReading {
    public function __construct(
        private int $id,
        private int $sensor_id,
        private float $recorded_value,
        private string $recorded_at
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            (int) $data['id'],
            (int) $data['sensor_id'],
            (float) $data['recorded_value'],
            $data['recorded_at'] ?? date('Y-m-d H:i:s')
        );
    }

    public function getId(): int {
        return $this->id;
    }

    public function getSensorId(): int {
        return $this->sensor_id;
    }

    public function getRecordedValue(): float {
        return $this->recorded_value;
    }

    public function getRecordedAt(): string {
        return $this->recorded_at;
    }
}