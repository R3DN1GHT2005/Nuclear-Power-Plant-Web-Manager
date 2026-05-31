<?php

namespace App\DTOs\Response;

class TaskResponseDTO {
    public function __construct(
        public int $id,
        public int $reactor_id,
        public ?string $reactor_name,
        public string $title,
        public ?string $description,
        public string $complexity,
        public string $status,
        public string $scheduled_date,
        public ?string $completed_at,
        public array $technicians = []
    ) {}
}