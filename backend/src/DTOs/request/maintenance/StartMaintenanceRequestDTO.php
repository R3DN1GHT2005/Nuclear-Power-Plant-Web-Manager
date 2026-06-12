<?php

/*
 * backend/src/DTOs/request/maintenance/StartMaintenanceRequestDTO.php
 * Request DTO for maintenance StartMaintenanceRequestDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */


namespace App\DTOs\Request\Maintenance;

class StartMaintenanceRequestDTO {
    public function __construct(
        public string $estimated_end_date,
        public ?string $reason = null
    ) {}
}