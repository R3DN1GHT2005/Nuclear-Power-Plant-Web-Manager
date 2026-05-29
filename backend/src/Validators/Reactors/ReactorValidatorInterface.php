<?php

namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorDTO;

interface ReactorValidatorInterface {
    public function validate(CreateReactorDTO $dto): void;
}