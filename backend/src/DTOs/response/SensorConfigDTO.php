/*
 * backend/src/DTOs/response/SensorConfigDTO.php
 * Response DTO for SensorConfigDTO — formats outgoing
 * API response data into a consistent JSON structure for the
 * frontend.
 */
<?php

namespace App\DTOs\Response;

class SensorConfigDTO {
    public function __construct(
        public readonly int $sensor_id,
        public readonly string $type,
        public readonly float $min_val,
        public readonly float $max_val,
        public readonly string $reactor_status,
        public readonly int $reactor_id
    ) {}
}