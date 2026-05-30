<?php

namespace App\DTOs\Response;

class ReactorResponseDTO implements \JsonSerializable {
    public function __construct(
        public readonly int    $id,
        public readonly string $name,
        public readonly string $location_name,
        public readonly float  $latitude,
        public readonly float  $longitude,
        public readonly string $status,
        public readonly float  $installed_power,
        public readonly float  $current_efficiency,
        public readonly float  $soil_stability,
        public readonly float  $seismic_risk,
        public readonly string $reactor_type,
        public readonly string $cooling_water_source,
        public readonly float  $distance_to_nearest_city_km,
        public readonly float  $elevation_meters,
        public readonly string $created_at,
        public readonly ?string $last_maintenance, 
        public readonly array  $sensors = []
    ) {}

    public function jsonSerialize(): array {
        return get_object_vars($this);
    }
}