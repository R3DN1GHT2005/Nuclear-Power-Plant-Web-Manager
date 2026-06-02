<?php

namespace App\DTOs\Request\User;

class AssignReactorRequestDTO {
    public function __construct(
        public readonly ?int $reactor_id
    ) {}
}