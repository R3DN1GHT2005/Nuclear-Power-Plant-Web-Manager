<?php

namespace App\DTOs\Request\sensor;

class CreateSensorDTO {
    public function __construct(
        public readonly int $reactor_id,
        public readonly string $sensor_type,
        public readonly float $current_value,
        public readonly ?string $unit
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            // Folosim fallback-uri (??) în caz că folosești nume diferite în Postman
            $data['reactor_id'],
            $data['sensor_type'] ?? $data['type'] ?? '',
            (float) ($data['current_value'] ?? $data['value'] ?? 0),
            $data['unit'] ?? null
        );
    }
}