<?php

namespace App\DTOs\Request\Sensor;

use App\Enums\SensorType;

class CreateSensorRequestDTO {
    public function __construct(
        public readonly string $sensor_type,
        public readonly ?string $unit,
        public readonly float $min_safe_value,
        public readonly float $max_safe_value,
    ) {}

    public static function fromArray(array $data): self {
        // 1. Verificăm doar câmpurile obligatorii trimise de frontend
        $requiredFields = ['sensor_type', 'min_safe_value', 'max_safe_value'];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === '') {
                throw new \InvalidArgumentException("Câmpul {$field} este obligatoriu.");
            }
        }

        $sensorTypeEnum = SensorType::tryFrom($data['sensor_type']);

        if (!$sensorTypeEnum) {
            // Dacă nu e valid, generăm lista de senzori permiși pentru mesajul de eroare
            $allowedTypes = implode(', ', array_column(SensorType::cases(), 'value'));
            throw new \InvalidArgumentException("Tip de senzor invalid. Tipurile permise sunt: {$allowedTypes}");
        }

        return new self(
            sensor_type: $sensorTypeEnum->value,
            unit: $sensorTypeEnum->getUnit(),
            min_safe_value: (float) $data['min_safe_value'],
            max_safe_value: (float) $data['max_safe_value'],
        );
    }
}