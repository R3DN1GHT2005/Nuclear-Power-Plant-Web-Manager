/*
 * backend/src/DTOs/request/alert/ResolveAlertRequestDTO.php
 * Request DTO for alert ResolveAlertRequestDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
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