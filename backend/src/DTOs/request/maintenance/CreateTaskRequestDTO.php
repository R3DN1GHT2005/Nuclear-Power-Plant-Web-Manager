<?php

namespace App\DTOs\Request;

use App\Enums\TaskComplexity;

class CreateTaskRequestDTO {
    public function __construct(
        public int $reactor_id,
        public string $title,
        public string $scheduled_date,
        public ?string $description = null,
        public TaskComplexity $complexity = TaskComplexity::MEDIUM,
        public array $technician_ids = []
    ) {}
}