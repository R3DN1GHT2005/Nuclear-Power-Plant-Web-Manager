<?php

namespace App\DTOs\Request\reactor;

class InsertReactorDTO {
    public function __construct(
        public readonly string $name,
        public readonly string $location_name,
        public readonly string $reactor_type,
        public readonly float $installed_power,
        public readonly float $latitude,
        public readonly float $longitude,
        public readonly string $status,
        public readonly float $soil_stability,
        public readonly float $seismic_risk,
        public readonly string $cooling_water_source,
        public readonly float $distance_to_nearest_city_km,
        public readonly float $elevation_meters,
        public readonly string $webhook_url,
        public readonly ?string $mac_address = null 
    ) {}
}