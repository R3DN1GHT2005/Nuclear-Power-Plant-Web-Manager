<?php

/*
 * backend/src/Validators/Reactors/ReactorValidatorInterface.php
 * ReactorValidatorInterface — reactor-type-specific validation logic for sensor
 * configurations and operational parameters. Used by SensorService
 * when creating or updating sensors.
 */


namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorRequestDTO;

interface ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void;
}