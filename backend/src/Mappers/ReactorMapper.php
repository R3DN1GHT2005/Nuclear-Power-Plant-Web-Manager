<?php

/*
 * backend/src/Mappers/ReactorMapper.php
 * Reactor data mapper — converts between domain models and
 * DTOs/arrays for API request/response serialisation. Ensures
 * clean separation between internal and external data formats.
 */


namespace App\Mappers;

use App\Models\Reactor;
use App\DTOs\Response\ReactorResponseDTO;

class ReactorMapper {
    public static function toResponse(Reactor $reactor): ReactorResponseDTO {
        $sensorsDTO = array_map(
        fn($s) => SensorMapper::toResponse($s), 
        $reactor->getSensors()
        );

        return new ReactorResponseDTO(
            id:                        $reactor->getId(),
            name:                      $reactor->getName(),
            location_name:             $reactor->getLocationName(),
            latitude:                  $reactor->getLatitude(),
            longitude:                 $reactor->getLongitude(),
            status:                    $reactor->getStatus(),
            installed_power:           $reactor->getInstalledPower(),
            current_efficiency:        $reactor->getCurrentEfficiency(),
            soil_stability:            $reactor->getSoilStability(),
            seismic_risk:              $reactor->getSeismicRisk(),
            reactor_type:              $reactor->getReactorType(),
            cooling_water_source:      $reactor->getCoolingWaterSource(),
            distance_to_nearest_city_km: $reactor->getDistanceToNearestCityKm(),
            elevation_meters:          $reactor->getElevationMeters(),
            created_at:                $reactor->getCreatedAt()->format('Y-m-d H:i:s'),
            last_maintenance: $reactor->getLastMaintenance()?->format('Y-m-d H:i:s') ?? 'N/A',
            sensors:                   $sensorsDTO
        );
    }

    public static function toResponseList(array $reactors): array {
        return array_map(fn($r) => self::toResponse($r), $reactors);
    }
}