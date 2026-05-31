<?php

namespace App\DTOs\Response\Maintenance;

class MaintenanceHistoryResponseDTO {
    public function __construct(
        public int $id,
        public int $reactor_id,
        public string $started_at,
        public string $estimated_end_date,
        public ?string $reason,
        public bool $is_completed,
        public ?string $completed_at
    ) {}
}