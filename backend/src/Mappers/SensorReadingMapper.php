<?php

namespace App\Mappers;

use App\DTOs\Response\SensorReadingResponseDTO;
use App\Models\SensorReading;

class SensorReadingMapper {
    public static function toResponse(SensorReading $reading): SensorReadingResponseDTO {
        return new SensorReadingResponseDTO(
            id: $reading->getId(),
            sensor_id: $reading->getSensorId(),
            recorded_value: $reading->getRecordedValue(),
            recorded_at: $reading->getRecordedAt()
        );
    }

    public static function toResponseList(array $readings): array {
        return array_map(fn($reading) => self::toResponse($reading), $readings);
    }
}
