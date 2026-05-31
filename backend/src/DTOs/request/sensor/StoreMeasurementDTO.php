<?php

namespace App\DTOs\Request\Sensor;

class StoreMeasurementDTO {
    public function __construct(
        public readonly int $sensor_id,
        public readonly float $value
    ) {}
}