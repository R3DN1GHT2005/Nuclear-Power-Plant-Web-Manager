<?php

namespace App\Models;

class Sensor
{
    // Folosim PHP 8: Definim și asociem proprietățile direct în constructor!
    public function __construct(
        private int $id,
        private int $reactor_id,
        private string $sensor_type,
        private float $current_value,
        private ?string $unit, // Poate fi null (VARCHAR fără NOT NULL în SQL)
        private string $last_update
    ) {}

    // --- GETTERS ---
    public function getId(): int { return $this->id; }
    public function getReactorId(): int { return $this->reactor_id; }
    public function getSensorType(): string { return $this->sensor_type; }
    public function getCurrentValue(): float { return $this->current_value; }
    public function getUnit(): ?string { return $this->unit; }
    public function getLastUpdate(): string { return $this->last_update; }
}