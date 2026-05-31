<?php

namespace App\Mappers;

use App\DTOs\Request\Sensor\StoreMeasurementDTO;
use InvalidArgumentException;

class MeasurementMapper {
    
    public static function fromRequest(array $data): StoreMeasurementDTO {
        $requiredFields = ['sensor_id', 'value'];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
                throw new InvalidArgumentException("Câmpul {$field} este obligatoriu pentru telemetrie.");
            }
        }

        return new StoreMeasurementDTO(
            sensor_id: (int) $data['sensor_id'],
            value: (float) $data['value']
        );
    }
}