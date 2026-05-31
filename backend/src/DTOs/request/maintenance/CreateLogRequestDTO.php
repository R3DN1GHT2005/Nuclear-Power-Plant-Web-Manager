<?php

namespace App\DTOs\Request;

class CreateLogRequestDTO {
    public function __construct(
        public string $action_taken,
        public int $completion_percent
    ) {}
}