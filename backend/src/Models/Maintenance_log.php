<?php
class Maintenance_log {
    private int $id;
    private int $reactor_id;
    private string $task_name;
    private ?int $technician_id; 
    private ?\DateTime $scheduled_date; 
    private int $completion_percent;
    private ?string $priority; 
    private ?\DateTime $resolved_at; 

    public function __construct(int $id, int $reactor_id, string $task_name, ?int $technician_id, ?\DateTime $scheduled_date, int $completion_percent, ?string $priority, ?\DateTime $resolved_at) {
        $this->id = $id;
        $this->reactor_id = $reactor_id;
        $this->task_name = $task_name;
        $this->technician_id = $technician_id;
        $this->scheduled_date = $scheduled_date;
        $this->completion_percent = $completion_percent;
        $this->priority = $priority;
        $this->resolved_at = $resolved_at;
    }

    public function getId(): int {
        return $this->id;
    }

    public function getReactorId(): int {
        return $this->reactor_id;
    }

    public function getTaskName(): string {
        return $this->task_name;
    }

    public function getTechnicianId(): ?int {
        return $this->technician_id;
    }

    public function getScheduledDate(): ?\DateTime {
        return $this->scheduled_date;
    }

    public function getCompletionPercent(): int {
        return $this->completion_percent;
    }

    public function getPriority(): ?string {
        return $this->priority;
    }

    public function getResolvedAt(): ?\DateTime {
        return $this->resolved_at;
    }

    public function setTechnicianId(?int $technician_id): void {
        $this->technician_id = $technician_id;
    }

    public function setScheduledDate(?\DateTime $scheduled_date): void {
        $this->scheduled_date = $scheduled_date;
    }

    public function setCompletionPercent(int $completion_percent): void {
        $this->completion_percent = $completion_percent;
    }

    public function setPriority(?string $priority): void {
        $this->priority = $priority;
    }

    public function setResolvedAt(?\DateTime $resolved_at): void {
        $this->resolved_at = $resolved_at;
    }

}


