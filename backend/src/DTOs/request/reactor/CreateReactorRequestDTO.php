/*
 * backend/src/DTOs/request/reactor/CreateReactorRequestDTO.php
 * Request DTO for reactor CreateReactorRequestDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\reactor;

class CreateReactorRequestDTO {
    public function __construct(
        public readonly string $name,
        public readonly string $location_name,
        public readonly string $reactor_type,
        public readonly float $installed_power,
        public readonly float $latitude,
        public readonly float $longitude,
        public readonly string $webhook_url,
        public readonly ?string $mac_address = null, 
    ) {}

    public static function fromArray(array $data): self {
       
        $requiredFields = ['name', 'location_name', 'reactor_type', 'installed_power', 'latitude', 'longitude', 'webhook_url'];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === '') {
                throw new \InvalidArgumentException("Câmpul {$field} este obligatoriu.");
            }
        }

        return new self(
            name: $data['name'],
            location_name: $data['location_name'],
            reactor_type: $data['reactor_type'],
            installed_power: (float) $data['installed_power'],
            latitude: (float) $data['latitude'],
            longitude: (float) $data['longitude'],
            webhook_url: $data['webhook_url'],
            mac_address: $data['mac_address'] ?? null, 
        );
    }
}