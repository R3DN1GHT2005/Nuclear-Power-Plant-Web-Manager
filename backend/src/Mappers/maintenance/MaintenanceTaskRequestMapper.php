<?php

namespace App\Mappers;

use App\DTOs\Request\CreateTaskRequestDTO;
use App\Enums\TaskComplexity;
use InvalidArgumentException;

class MaintenanceTaskRequestMapper {
    public static function fromArray(array $data): CreateTaskRequestDTO {
        if (empty($data['reactor_id']) || empty($data['title']) || empty($data['scheduled_date'])) {
            throw new InvalidArgumentException("Câmpurile reactor_id, title și scheduled_date sunt obligatorii.");
        }

        $complexityValue = isset($data['complexity']) ? TaskComplexity::tryFrom($data['complexity']) : null;
        if (isset($data['complexity']) && $complexityValue === null) {
             throw new InvalidArgumentException("Complexitate invalidă. Valorile acceptate sunt: Low, Medium, High, Critical.");
        }

        $technicianIds = [];
        if (isset($data['technician_ids']) && is_array($data['technician_ids'])) {
            $technicianIds = array_map('intval', $data['technician_ids']);
        }

        return new CreateTaskRequestDTO(
            reactor_id:     (int) $data['reactor_id'],
            title:          trim($data['title']),
            scheduled_date: $data['scheduled_date'],
            description:    $data['description'] ?? null,
            complexity:     $complexityValue ?? TaskComplexity::MEDIUM,
            technician_ids: $technicianIds
        );
    }
}