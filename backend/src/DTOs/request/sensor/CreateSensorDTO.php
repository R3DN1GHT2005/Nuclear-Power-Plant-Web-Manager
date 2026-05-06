<?php

namespace App\DTOs\Request\Sensor;

class CreateSensorDTO {
    public function __construct(
        public readonly int    $reactor_id,
        public readonly string $type,     //temperatura, presiune, etc.
        public readonly float  $value,    //valoarea curentă a senzorului
        public readonly ?string $unit,         // '°C', 'bar', etc. Poate fi null dacă nu are unitate specifică
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