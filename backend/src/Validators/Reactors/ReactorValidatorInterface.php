<?php

namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorRequestDTO;

interface ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void;
}