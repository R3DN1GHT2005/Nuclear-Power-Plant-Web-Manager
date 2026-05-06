<?php

namespace App\Mappers;
use App\DTOs\Response\SensorResponseDTO;
use App\Models\Sensor;

class SensorMapper {
    public static function toResponse(Sensor $sensor): SensorResponseDTO {
        return new SensorResponseDTO(
            id:         $sensor->getId(),
            reactor_id: $sensor->getReactorId(),
            type:       $sensor->getType(),
            value:      $sensor->getValue(),
            unit:       $sensor->getUnit(),
            last_update: $sensor->getLastUpdate()->format('Y-m-d H:i:s'),
        );
    }

    public static function toResponseList(array $sensors): array {
        return array_map(fn($s) => self::toResponse($s), $sensors);
    }
}