/*
 * backend/src/DTOs/request/sensor/UpdateSensorDTO.php
 * Request DTO for sensor UpdateSensorDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\Sensor;

class UpdateSensorDTO {
    public function __construct(
        public readonly int    $reactor_id,
        public readonly string $type,     

        public readonly float  $value,    

        public readonly ?string $unit,         

        public readonly string  $last_update
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            reactor_id: (int) $data['reactor_id'],
            type:       $data['type'],
            value:      (float) $data['value'],
            unit:       $data['unit'] ?? null,
            last_update: $data['last_update']
        );
    }
}