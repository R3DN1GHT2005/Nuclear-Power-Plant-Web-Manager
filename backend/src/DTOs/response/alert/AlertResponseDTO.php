<?php
namespace App\DTOs\Response\Alert;

class AlertResponseDTO {
    public function __construct(
        public readonly int $id,
        public readonly int $reactor_id,
        public readonly string $reactor_name,
        public readonly string $severity,
        public readonly string $message,
        public readonly string $created_at
    ) {}
}