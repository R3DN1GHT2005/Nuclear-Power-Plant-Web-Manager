<?php

/*
 * backend/src/Models/SensorConfig.php
 * SensorConfig domain model — represents the SensorConfig entity with
 * properties matching the database schema. Used across Services,
 * Repositories, and Mappers for data transfer within the backend.
 */


namespace App\Models;

class SensorConfig {
    public function __construct(
        private int $id,
        private string $sensor_type,
        private float $min_safe_value,
        private float $max_safe_value,
        private string $reactor_status,
        private int $reactor_id
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            (int) $data['id'],
            (string) $data['sensor_type'],
            (float) ($data['min_safe_value'] ?? 0),
            (float) ($data['max_safe_value'] ?? 0),
            $data['reactor_status'] ?? 'Oprit',
            (int) ($data['reactor_id'] ?? 0)
        );
    }

    public function getId(): int { return $this->id; }
    public function getSensorType(): string { return $this->sensor_type; }
    public function getMinSafeValue(): float { return $this->min_safe_value; }
    public function getMaxSafeValue(): float { return $this->max_safe_value; }
    public function getReactorStatus(): string { return $this->reactor_status; }
    public function getReactorId(): int { return $this->reactor_id; }
}