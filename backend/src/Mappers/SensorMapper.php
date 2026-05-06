<?php
namespace App\Mappers;

use App\Models\Sensor;
use App\DTOs\Response\SensorResponseDTO;

class SensorMapper {
    public static function toResponse(Sensor $sensor): SensorResponseDTO {
        return new SensorResponseDTO(
            $sensor->getId(),
            $sensor->getReactorId(),
            $sensor->getSensorType(),  
            $sensor->getCurrentValue(),
            $sensor->getUnit(),
            $sensor->getLastUpdate()
        );
    }

    public static function toResponseList(array $sensors): array {
        return array_map(fn($sensor) => self::toResponse($sensor), $sensors);
    }
}