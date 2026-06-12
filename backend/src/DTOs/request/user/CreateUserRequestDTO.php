/*
 * backend/src/DTOs/request/user/CreateUserRequestDTO.php
 * Request DTO for user CreateUserRequestDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
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