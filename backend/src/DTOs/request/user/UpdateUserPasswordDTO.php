<?php

namespace App\DTOs\Request\User;

class UpdateUserPasswordDTO {
    public function __construct(
        public readonly string $password
    ) {}
}