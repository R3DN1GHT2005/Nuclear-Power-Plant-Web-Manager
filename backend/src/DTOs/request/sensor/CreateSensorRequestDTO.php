<?php

namespace App\DTOs\Request\Sensor;

class CreateSensorRequestDTO {
    public function __construct(
        public readonly string $sensor_type,
        public readonly ?string $unit,
        public readonly float $min_safe_value,
        public readonly float $max_safe_value,
    ) {}

    public static function fromArray(array $data): self {
        $requiredFields = ['sensor_type', 'min_safe_value', 'max_safe_value'];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === '') {
                throw new \InvalidArgumentException("Câmpul {$field} este obligatoriu.");
            }
        }

        return new self(
            sensor_type: $data['sensor_type'],
            unit: isset($data['unit']) && $data['unit'] !== '' ? $data['unit'] : null,
            min_safe_value: (float) $data['min_safe_value'],
            max_safe_value: (float) $data['max_safe_value'],
        );
    }
}
