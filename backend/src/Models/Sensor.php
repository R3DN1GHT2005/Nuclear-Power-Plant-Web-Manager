<?php

/*
 * backend/src/Models/Sensor.php
 * Sensor domain model — represents the Sensor entity with
 * properties matching the database schema. Used across Services,
 * Repositories, and Mappers for data transfer within the backend.
 */


namespace App\Models;

class Sensor {
    public function __construct(
        private int $id,
        private int $reactor_id,
        private string $sensor_type,
        private ?string $unit,
        private float $min_safe_value,
        private float $max_safe_value,
        private float $current_value,
        private string $last_update
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            (int) $data['id'],
            (int) $data['reactor_id'],
            (string) $data['sensor_type'],
            $data['unit'] ?? null,
            (float) ($data['min_safe_value'] ?? 0),
            (float) ($data['max_safe_value'] ?? 0),
            (float) ($data['current_value'] ?? 0),
            $data['last_update'] ?? date('Y-m-d H:i:s')
        );
    }

    public function getId(): int {
        return $this->id;
    }

    public function getReactorId(): int {
        return $this->reactor_id;
    }

    public function getSensorType(): string {
        return $this->sensor_type;
    }

    public function getUnit(): ?string {
        return $this->unit;
    }

    public function getMinSafeValue(): float {
        return $this->min_safe_value;
    }

    public function getMaxSafeValue(): float {
        return $this->max_safe_value;
    }

    public function getCurrentValue(): float {
        return $this->current_value;
    }

    public function getLastUpdate(): string {
        return $this->last_update;
    }
}
