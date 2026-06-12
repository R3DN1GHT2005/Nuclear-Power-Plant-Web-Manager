/*
 * backend/src/DTOs/request/sensor/StoreMeasurementDTO.php
 * Request DTO for sensor StoreMeasurementDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\Sensor;

class StoreMeasurementDTO {
    public function __construct(
        public readonly int $sensor_id,
        public readonly float $value
    ) {}
}