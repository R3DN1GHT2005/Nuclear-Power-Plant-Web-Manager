<?php

namespace App\Mappers;

use App\Models\Alert;
use App\DTOs\Response\AlertResponseDTO;

class AlertMapper {
    public static function toResponse(Alert $alert): AlertResponseDTO {
        return new AlertResponseDTO(
            id: $alert->getId(),
            reactor_id: $alert->getReactorId(),
            message: $alert->getMessage(),
            severity: $alert->getSeverity(),
            is_resolved: $alert->isResolved(),
            resolved_at: $alert->getResolvedAt()?->format('Y-m-d H:i:s'),
            resolved_by: $alert->getResolvedBy(),
            created_at: $alert->getCreatedAt()->format('Y-m-d H:i:s')
        );
    }

    public static function toResponseList(array $alerts): array {
        return array_map(fn($a) => self::toResponse($a), $alerts);
    }
}
