<?php

namespace App\DTOs\Response\User;

class UserResponseDTO {
    public function __construct(
        public readonly int $id,
        public readonly string $email,
        public readonly string $name,
        public readonly string $role,
        public readonly ?int $reactor_id,
        public readonly ?string $intervention_role,
        public readonly string $created_at
    ) {}
}