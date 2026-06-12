<?php

/*
 * backend/src/DTOs/response/AlertResponseDTO.php
 * Response DTO for AlertResponseDTO — formats outgoing
 * API response data into a consistent JSON structure for the
 * frontend.
 */


namespace App\DTOs\Response;

class AlertResponseDTO implements \JsonSerializable {
    public function __construct(
        public readonly int $id,
        public readonly int $reactor_id,
        public readonly string $message,
        public readonly string $severity,
        public readonly bool $is_resolved,
        public readonly ?string $resolved_at,
        public readonly ?int $resolved_by,
        public readonly string $created_at
    ) {}

    public function jsonSerialize(): array {
        return get_object_vars($this);
    }
}
