<?php
namespace App\DTOs\Request\Alert;

use InvalidArgumentException;

class ResolveAlertRequestDTO {
    public readonly string $notes;

    public function __construct(array $data) {
        $notes = trim($data['notes'] ?? '');

        if (empty($notes)) {
            throw new InvalidArgumentException("Detaliile intervenției sunt obligatorii pentru a opri alarma!");
        }

        $this->notes = $notes;
    }
}