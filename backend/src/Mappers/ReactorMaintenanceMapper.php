<?php

namespace App\Mappers;

use App\DTOs\Request\Maintenance\StartMaintenanceRequestDTO;
use App\DTOs\Response\Maintenance\MaintenanceHistoryResponseDTO;
use App\Models\ReactorMaintenance;
use InvalidArgumentException;

class ReactorMaintenanceMapper {
    
  
    public static function fromArray(array $data): StartMaintenanceRequestDTO {
        if (empty($data['estimated_end_date'])) {
            throw new InvalidArgumentException("Data estimată de finalizare este obligatorie.");
        }

        return new StartMaintenanceRequestDTO(
            estimated_end_date: $data['estimated_end_date'],
            reason:             $data['reason'] ?? null
        );
    }

  
    public static function toResponse(ReactorMaintenance $maintenance): MaintenanceHistoryResponseDTO {
        return new MaintenanceHistoryResponseDTO(
            id:                 $maintenance->getId(),
            reactor_id:         $maintenance->getReactorId(),
            started_at:         $maintenance->getStartedAt(),
            estimated_end_date: $maintenance->getEstimatedEndDate(),
            reason:             $maintenance->getReason(),
            is_completed:       $maintenance->isCompleted(),
            completed_at:       $maintenance->getCompletedAt()
        );
    }

    public static function toResponseList(array $maintenanceLogs): array {
        return array_map(fn($m) => self::toResponse($m), $maintenanceLogs);
    }
}