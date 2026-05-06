<?php

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
            id:                 $reactor->getId(),
            name:               $reactor->getName(),
            location_name:      $reactor->getLocationName(),
            latitude:           $reactor->getLatitude(),
            longitude:          $reactor->getLongitude(),
            status:             $reactor->getStatus(),
            installed_power:    $reactor->getInstalledPower(),
            current_efficiency: $reactor->getCurrentEfficiency(),
            soil_stability:     $reactor->getSoilStability(),
            seismic_risk:       $reactor->getSeismicRisk(),
            created_at:         $reactor->getCreatedAt()->format('Y-m-d H:i:s'),
            last_maintenance:   $reactor->getLastMaintenance()->format('Y-m-d H:i:s'),
            sensors:            $sensorsDTO
        );
    }

    public static function toResponseList(array $reactors): array {
        return array_map(fn($r) => self::toResponse($r), $reactors);
    }
}