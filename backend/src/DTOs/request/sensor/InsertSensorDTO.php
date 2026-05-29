<?php

namespace App\DTOs\Request\Sensor;

class InsertSensorDTO {
    public function __construct(
        public readonly int $reactor_id,
        public readonly string $sensor_type,
        public readonly ?string $unit,
        public readonly float $min_safe_value,
        public readonly float $max_safe_value,
    ) {}
}
