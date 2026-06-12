/*
 * backend/src/DTOs/request/sensor/InsertSensorDTO.php
 * Request DTO for sensor InsertSensorDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\Sensor;

class InsertSensorDTO {
    public function __construct(
        public readonly int $reactor_id,
        public readonly string $sensor_type,
        public readonly ?string $unit,
        public readonly float $min_safe_value,
        public readonly float $max_safe_value,
        public readonly float $current_value = 0.0
    ) {}
}
