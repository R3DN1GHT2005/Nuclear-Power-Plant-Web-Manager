<?php

namespace App\DTOs\Response;

class SensorResponseDTO implements \JsonSerializable {
    public function __construct(
        public readonly int $id,
        public readonly int $reactor_id,
        public readonly string $sensor_type,
        public readonly ?string $unit,
        public readonly float $min_safe_value,
        public readonly float $max_safe_value,
        public readonly float $current_value,
        public readonly string $last_update,
    ) {}

    public function jsonSerialize(): array {
        return get_object_vars($this);
    }
}
