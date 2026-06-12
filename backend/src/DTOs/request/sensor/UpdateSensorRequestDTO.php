/*
 * backend/src/DTOs/request/sensor/UpdateSensorRequestDTO.php
 * Request DTO for sensor UpdateSensorRequestDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\Sensor;

class UpdateSensorRequestDTO {
    public function __construct(
        public readonly ?string $sensor_type = null,
        public readonly ?string $unit = null,
        public readonly ?float $min_safe_value = null,
        public readonly ?float $max_safe_value = null,
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            sensor_type: array_key_exists('sensor_type', $data) ? ($data['sensor_type'] !== '' ? (string) $data['sensor_type'] : null) : null,
            unit: array_key_exists('unit', $data) ? ($data['unit'] !== '' ? (string) $data['unit'] : null) : null,
            min_safe_value: array_key_exists('min_safe_value', $data) && $data['min_safe_value'] !== '' ? (float) $data['min_safe_value'] : null,
            max_safe_value: array_key_exists('max_safe_value', $data) && $data['max_safe_value'] !== '' ? (float) $data['max_safe_value'] : null,
        );
    }
}