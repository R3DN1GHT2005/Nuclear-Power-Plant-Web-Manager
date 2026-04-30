<?php

namespace App\DTOs\Request;

class UpdateReactorDTO {
    public function __construct(
        public readonly string $name,
        public readonly string $status,
        public readonly float  $installed_power,
        public readonly float  $current_efficiency,
        public readonly string $last_maintenance,
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            name:               $data['name'],
            status:             $data['status'],
            installed_power:    (float) $data['installed_power'],
            current_efficiency: (float) $data['current_efficiency'],
            last_maintenance:   $data['last_maintenance'],
        );
    }
}