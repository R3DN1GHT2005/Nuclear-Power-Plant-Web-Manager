<?php

namespace App\DTOs\Request\User;

class CreateUserRequestDTO {
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $role
    ) {}
}