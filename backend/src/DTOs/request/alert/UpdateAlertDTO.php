/*
 * backend/src/DTOs/request/alert/UpdateAlertDTO.php
 * Request DTO for alert UpdateAlertDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\alert;

class UpdateAlertDTO {
    public function __construct(
        public readonly bool $resolved,
        public readonly ?int $resolved_by = null
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            resolved: (bool) ($data['resolved'] ?? true),
            resolved_by: isset($data['resolved_by']) ? (int) $data['resolved_by'] : null
        );
    }
}
