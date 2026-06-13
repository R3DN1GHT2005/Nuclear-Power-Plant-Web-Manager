<?php

/*
 * backend/src/DTOs/request/alert/CreateAlertDTO.php
 * Request DTO for alert CreateAlertDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */


namespace App\DTOs\Request\Alert;

class CreateAlertDTO {
    public function __construct(
        public readonly int $reactor_id,
        public readonly string $message,
        public readonly string $severity
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            reactor_id: (int) $data['reactor_id'],
            message: $data['message'],
            severity: $data['severity']
        );
    }
}
