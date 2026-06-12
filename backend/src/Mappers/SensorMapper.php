/*
 * backend/src/Mappers/SensorMapper.php
 * Sensor data mapper — converts between domain models and
 * DTOs/arrays for API request/response serialisation. Ensures
 * clean separation between internal and external data formats.
 */
<?php

namespace App\Mappers;

use App\DTOs\Response\SensorResponseDTO;
use App\Models\Sensor;

class SensorMapper {
    public static function toResponse(Sensor $sensor): SensorResponseDTO {
        return new SensorResponseDTO(
            id: $sensor->getId(),
            reactor_id: $sensor->getReactorId(),
            sensor_type: $sensor->getSensorType(),
            unit: $sensor->getUnit(),
            min_safe_value: $sensor->getMinSafeValue(),
            max_safe_value: $sensor->getMaxSafeValue(),
            current_value: $sensor->getCurrentValue(),
            last_update: $sensor->getLastUpdate()
        );
    }

    public static function toResponseList(array $sensors): array {
        return array_map(fn($sensor) => self::toResponse($sensor), $sensors);
    }
}
