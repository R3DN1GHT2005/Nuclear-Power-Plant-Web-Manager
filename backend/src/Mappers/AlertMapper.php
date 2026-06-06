<?php
namespace App\Mappers;

use App\Models\Alert;
use App\Enums\AlertSeverity;
use App\DTOs\Response\Alert\AlertResponseDTO;
use App\DTOs\Request\Alert\ResolveAlertRequestDTO;
use App\DTOs\Response\Alert\AlertHistoryResponseDTO;
use DateTime;
use Exception;

class AlertMapper {
    public static function toModel(array $data): Alert {
        return new Alert(
            id: (int) $data['id'],
            reactorId: (int) $data['reactor_id'],
            severity: AlertSeverity::from($data['severity']), // Convertim string-ul în Enum
            message: $data['message'],
            isResolved: (bool) $data['is_resolved'],
            resolvedBy: isset($data['resolved_by']) ? (int) $data['resolved_by'] : null,
            resolutionNotes: $data['resolution_notes'] ?? null,
            createdAt: new DateTime($data['created_at']),
            resolvedAt: isset($data['resolved_at']) ? new DateTime($data['resolved_at']) : null,
            reactorName: $data['reactor_name'] ?? 'Reactor Necunoscut' // Extras din JOIN
        );
    }

   
    public static function toResponseDTO(Alert $alert): AlertResponseDTO {
        return new AlertResponseDTO(
            id: $alert->getId(),
            reactor_id: $alert->getReactorId(),
            reactor_name: $alert->getReactorName() ?? 'Reactor',
            severity: $alert->getSeverity()->value, // Extragem string-ul din Enum ('warning' / 'critical')
            message: $alert->getMessage(),
            created_at: $alert->getCreatedAt()->format('Y-m-d H:i:s')
        );
    }


    public static function toResponseList(array $alerts): array {
        return array_map(fn(Alert $alert) => self::toResponseDTO($alert), $alerts);
    }

    public static function toResolveRequestDTO(array $data): ResolveAlertRequestDTO {
        return new ResolveAlertRequestDTO($data);
    }


    //history

    public static function toHistoryResponseDTO(Alert $alert): AlertHistoryResponseDTO {
        return new AlertHistoryResponseDTO(
            id: $alert->getId(),
            reactor_id: $alert->getReactorId(),
            reactor_name: $alert->getReactorName() ?? 'Reactor',
            severity: $alert->getSeverity()->value,
            message: $alert->getMessage(),
            created_at: $alert->getCreatedAt()->format('Y-m-d H:i:s'),
            is_resolved: $alert->isResolved(),
            resolved_by: $alert->getResolvedBy(),
            resolution_notes: $alert->getResolutionNotes(),
            resolved_at: $alert->getResolvedAt() ? $alert->getResolvedAt()->format('Y-m-d H:i:s') : null
        );
    }

  
    public static function toHistoryResponseList(array $alerts): array {
        return array_map(fn(Alert $alert) => self::toHistoryResponseDTO($alert), $alerts);
    }
}