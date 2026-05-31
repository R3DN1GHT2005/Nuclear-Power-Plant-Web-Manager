<?php

namespace App\DTOs\Request\Maintenance;

class StartMaintenanceRequestDTO {
    public function __construct(
        public string $estimated_end_date,
        public ?string $reason = null
    ) {}
}