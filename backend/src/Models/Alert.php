<?php

namespace App\Models;

class Alert {
    private int $id;
    private int $reactor_id;
    private string $message;
    private string $severity;
    private bool $is_resolved;
    private ?\DateTime $resolved_at;
    private ?int $resolved_by;
    private \DateTime $created_at;

    public function __construct(
        int $id,
        int $reactor_id,
        string $message,
        string $severity,
        bool $is_resolved,
        ?\DateTime $resolved_at,
        ?int $resolved_by,
        \DateTime $created_at
    ) {
        $this->id = $id;
        $this->reactor_id = $reactor_id;
        $this->message = $message;
        $this->severity = $severity;
        $this->is_resolved = $is_resolved;
        $this->resolved_at = $resolved_at;
        $this->resolved_by = $resolved_by;
        $this->created_at = $created_at;
    }

    public static function fromArray(array $data): self {
        return new self(
            id: (int) $data['id'],
            reactor_id: (int) $data['reactor_id'],
            message: $data['message'],
            severity: $data['severity'],
            is_resolved: (bool) ($data['is_resolved'] ?? false),
            resolved_at: $data['resolved_at'] ? new \DateTime($data['resolved_at']) : null,
            resolved_by: $data['resolved_by'] ? (int) $data['resolved_by'] : null,
            created_at: new \DateTime($data['created_at'])
        );
    }

    public function getId(): int { return $this->id; }
    public function getReactorId(): int { return $this->reactor_id; }
    public function getMessage(): string { return $this->message; }
    public function getSeverity(): string { return $this->severity; }
    public function isResolved(): bool { return $this->is_resolved; }
    public function getResolvedAt(): ?\DateTime { return $this->resolved_at; }
    public function getResolvedBy(): ?int { return $this->resolved_by; }
    public function getCreatedAt(): \DateTime { return $this->created_at; }
}
