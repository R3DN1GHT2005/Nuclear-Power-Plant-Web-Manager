<?php
namespace App\Models;

use App\Enums\AlertSeverity;
use DateTime;

class Alert {
    public function __construct(
        private int $id,
        private int $reactorId,
        private AlertSeverity $severity,
        private string $message,
        private bool $isResolved,
        private ?int $resolvedBy,
        private ?string $resolutionNotes,
        private DateTime $createdAt,
        private ?DateTime $resolvedAt = null,
        private ?string $reactorName = null 
    ) {}

    public function getId(): int { return $this->id; }
    public function getReactorId(): int { return $this->reactorId; }
    public function getSeverity(): AlertSeverity { return $this->severity; }
    public function getMessage(): string { return $this->message; }
    public function isResolved(): bool { return $this->isResolved; }
    public function getResolvedBy(): ?int { return $this->resolvedBy; }
    public function getResolutionNotes(): ?string { return $this->resolutionNotes; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getResolvedAt(): ?DateTime { return $this->resolvedAt; }
    public function getReactorName(): ?string { return $this->reactorName; }

    
    public function resolve(int $userId, string $notes): void {
        $this->isResolved = true;
        $this->resolvedBy = $userId;
        $this->resolutionNotes = $notes;
        $this->resolvedAt = new DateTime();
    }
}