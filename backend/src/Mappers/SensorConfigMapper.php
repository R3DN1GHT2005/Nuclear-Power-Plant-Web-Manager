<?php

namespace App\Mappers;

use App\DTOs\Response\SensorConfigDTO;
use App\Models\Sensor;

class SensorConfigMapper {
    
    public static function toResponse(Sensor $sensor): SensorConfigDTO {
        return new SensorConfigDTO(
            sensor_id: $sensor->getId(),
            type: $sensor->getSensorType(),
            min_val: $sensor->getMinSafeValue(),
            max_val: $sensor->getMaxSafeValue()
        );
    }

   
    public static function toResponseList(array $sensors): array {
        return array_map(fn($sensor) => self::toResponse($sensor), $sensors);
    }
}