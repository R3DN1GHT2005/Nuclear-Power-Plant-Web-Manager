/*
 * backend/src/DTOs/request/reactor/UpdateReactorDTO.php
 * Request DTO for reactor UpdateReactorDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\reactor;

class UpdateReactorDTO {
    public function __construct(
        public readonly string $name,
        public readonly string $location_name,
        public readonly float  $latitude,
        public readonly float  $longitude,
        public readonly string $status,
        public readonly float  $installed_power,
        public readonly float  $current_efficiency,
        public readonly string $last_maintenance,
        public readonly float  $soil_stability,
        public readonly float  $seismic_risk,
        public readonly string $reactor_type,
        public readonly string $cooling_water_source,
        public readonly float  $distance_to_nearest_city_km,
        public readonly float  $elevation_meters,
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            name:                     $data['name'],
            location_name:            $data['location_name'],
            latitude:                 (float) $data['latitude'],
            longitude:                (float) $data['longitude'],
            status:                   $data['status'],
            installed_power:          (float) $data['installed_power'],
            current_efficiency:       (float) $data['current_efficiency'],
            last_maintenance:         $data['last_maintenance'],
            soil_stability:           (float) $data['soil_stability'],
            seismic_risk:             (float) $data['seismic_risk'],
            reactor_type:             $data['reactor_type'],
            cooling_water_source:     $data['cooling_water_source'],
            distance_to_nearest_city_km: (float) $data['distance_to_nearest_city_km'],
            elevation_meters:         (float) $data['elevation_meters'],
        );
    }
}