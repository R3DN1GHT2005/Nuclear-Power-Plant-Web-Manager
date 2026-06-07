<?php

namespace App\Mappers;

use App\DTOs\Response\SensorConfigDTO;
use App\Models\SensorConfig;

class SensorConfigMapper {
    
    public static function toResponse(SensorConfig $sensorConfig): SensorConfigDTO {
        return new SensorConfigDTO(
            sensor_id: $sensorConfig->getId(),
            type: $sensorConfig->getSensorType(),
            min_val: $sensorConfig->getMinSafeValue(),
            max_val: $sensorConfig->getMaxSafeValue(),
            reactor_status: $sensorConfig->getReactorStatus(),
            reactor_id: $sensorConfig->getReactorId()
        );
    }

    public static function toResponseList(array $sensorConfigs): array {
        return array_map(fn($sc) => self::toResponse($sc), $sensorConfigs);
    }
}