<?php

namespace App\DTOs\Response;

class SensorConfigDTO {
    public function __construct(
        public readonly int $sensor_id,
        public readonly string $type,
        public readonly float $min_val,
        public readonly float $max_val,
        public readonly string $reactor_status,
        public readonly int $reactor_id
    ) {}
}