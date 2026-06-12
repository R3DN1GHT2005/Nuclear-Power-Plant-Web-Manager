<?php

/*
 * backend/src/Mappers/SensorConfigMapper.php
 * SensorConfig data mapper — converts between domain models and
 * DTOs/arrays for API request/response serialisation. Ensures
 * clean separation between internal and external data formats.
 */


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