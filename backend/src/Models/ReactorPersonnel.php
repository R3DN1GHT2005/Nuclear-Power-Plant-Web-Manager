<?php

namespace App\Models;

class ReactorPersonnel {
    private int $id;
    private int $user_id;
    private int $reactor_id;
    private string $intervention_role;

    public function __construct(int $id, int $user_id, int $reactor_id, string $intervention_role) {
        $this->id = $id;
        $this->user_id = $user_id;
        $this->reactor_id = $reactor_id;
        $this->intervention_role = $intervention_role;
    }

    
    public static function fromArray(array $data): self {
        return new self(
            $data['personnel_id'] ?? $data['id'] ?? 0,
            $data['user_id'],
            $data['reactor_id'],
            $data['intervention_role']
        );
    }

    public function getId(): int { 
        return $this->id; 
    }
    
    public function getUserId(): int { 
        return $this->user_id; 
    }
    
    public function getReactorId(): int { 
        return $this->reactor_id; 
    }
    
    public function getInterventionRole(): string { 
        return $this->intervention_role; 
    }

    // Setteri
    public function setUserId(int $user_id): void {
        $this->user_id = $user_id;
    }

    public function setReactorId(int $reactor_id): void {
        $this->reactor_id = $reactor_id;
    }

    public function setInterventionRole(string $intervention_role): void {
        $this->intervention_role = $intervention_role;
    }
}