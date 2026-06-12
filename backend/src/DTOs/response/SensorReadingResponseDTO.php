/*
 * backend/src/DTOs/response/SensorReadingResponseDTO.php
 * Response DTO for SensorReadingResponseDTO — formats outgoing
 * API response data into a consistent JSON structure for the
 * frontend.
 */
<?php

namespace App\DTOs\Response;

class SensorReadingResponseDTO {
    public function __construct(
        public readonly int $id,
        public readonly int $sensor_id,
        public readonly float $recorded_value,
        public readonly string $recorded_at
    ) {}
}