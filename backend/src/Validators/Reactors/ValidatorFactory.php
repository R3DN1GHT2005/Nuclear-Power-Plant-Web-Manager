/*
 * backend/src/Validators/Reactors/ValidatorFactory.php
 * ValidatorFactory — reactor-type-specific validation logic for sensor
 * configurations and operational parameters. Used by SensorService
 * when creating or updating sensors.
 */
<?php

namespace App\Validators\Reactors;

class ValidatorFactory {
    public static function getValidator(string $type): ReactorValidatorInterface {
        return match (strtoupper($type)) {
            'CANDU' => new CanduValidator(),
            'SMR'   => new SmrValidator(),
            'PWR'   => new PwrValidator(),
            default => throw new \Exception("Tip de reactor necunoscut: {$type}"),
        };
    }
}