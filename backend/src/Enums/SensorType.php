<?php

/*
 * backend/src/Enums/SensorType.php
 * SensorType enum — defines the allowed values for sensor type
 * used across the application for type-safe comparisons.
 */


namespace App\Enums;

enum SensorType: string {
    case TEMPERATURA = 'Temperatura';
    case PRESIUNE    = 'Presiune';
    case VIBRATII    = 'Vibratii';
    case EFICIENTA   = 'Eficienta';

    public function getProfile(): array {
        return match($this) {
            self::TEMPERATURA => ['unit' => 'Celsius',   'defaultMin' => 0, 'defaultMax' => 350],
            self::PRESIUNE    => ['unit' => 'Bar',       'defaultMin' => 1, 'defaultMax' => 160],
            self::VIBRATII    => ['unit' => 'Hertz', 'defaultMin' => 0, 'defaultMax' => 15],
            self::EFICIENTA   => ['unit' => 'Percent',  'defaultMin' => 0, 'defaultMax' => 100],
        };
    }
    
    public function getUnit(): string {
        return $this->getProfile()['unit'];
    }
}