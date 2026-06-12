/*
 * backend/src/Models/ReactorMaintenance.php
 * ReactorMaintenance domain model — represents the ReactorMaintenance entity with
 * properties matching the database schema. Used across Services,
 * Repositories, and Mappers for data transfer within the backend.
 */
<?php

namespace App\Models;

class ReactorMaintenance {
    public function __construct(
        private int $id,
        private int $reactor_id,
        private string $started_at,
        private string $estimated_end_date,
        private ?string $reason,
        private bool $is_completed,
        private ?string $completed_at
    ) {}

    public function getId(): int { return $this->id; }
    public function getReactorId(): int { return $this->reactor_id; }
    public function getStartedAt(): string { return $this->started_at; }
    public function getEstimatedEndDate(): string { return $this->estimated_end_date; }
    public function getReason(): ?string { return $this->reason; }
    public function isCompleted(): bool { return $this->is_completed; }
    public function getCompletedAt(): ?string { return $this->completed_at; }
}