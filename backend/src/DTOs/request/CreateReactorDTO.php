<?php

namespace App\DTOs\Request;

class CreateReactorDTO {
    public function __construct(
        public readonly string $name,
        public readonly string $location_name,
        public readonly float  $latitude,
        public readonly float  $longitude,
        public readonly string $status,
        public readonly float  $installed_power,
        public readonly float  $current_efficiency,
        public readonly string $last_maintenance,
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            name:               $data['name'],
            location_name:      $data['location_name'],
            latitude:           (float) $data['latitude'],
            longitude:          (float) $data['longitude'],
            status:             $data['status'],
            installed_power:    (float) $data['installed_power'],
            current_efficiency: (float) $data['current_efficiency'],
            last_maintenance:   $data['last_maintenance'],
        );
    }
}