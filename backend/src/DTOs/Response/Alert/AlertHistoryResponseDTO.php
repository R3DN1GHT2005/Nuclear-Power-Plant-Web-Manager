<?php

/*
 * backend/src/DTOs/response/alert/AlertHistoryResponseDTO.php
 * Response DTO for alert AlertHistoryResponseDTO — formats outgoing
 * API response data into a consistent JSON structure for the
 * frontend.
 */

namespace App\DTOs\Response\Alert;

class AlertHistoryResponseDTO {
    public function __construct(
        public readonly int $id,
        public readonly int $reactor_id,
        public readonly string $reactor_name,
        public readonly string $severity,
        public readonly string $message,
        public readonly string $created_at,
        public readonly bool $is_resolved,
        public readonly ?int $resolved_by,
        public readonly ?string $resolver_name,
        public readonly ?string $resolution_notes,
        public readonly ?string $resolved_at
    ) {}
}