<?php

namespace App\DTOs\Response;

class SensorResponseDTO implements \JsonSerializable {
    public function __construct(
        public readonly int    $id,
        public readonly int    $reactor_id,
        public readonly string  $type,     //temperatura, presiune, etc.
        public readonly float   $value,    //valoarea curentă a senzorului
        public readonly ?string $unit,         // '°C', 'bar', etc. Poate fi null dacă nu are unitate specifică
        public readonly string  $last_update
    ) {}

    public function jsonSerialize(): array {
        return get_object_vars($this);
    }
}