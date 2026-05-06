<?php

namespace App\Models;

class Sensor {
    public function __construct(
        private int $id,
        private int $reactor_id,
        private string $sensor_type,
        private float $current_value,
        private ?string $unit,
        private string $last_update
    ) {}

    public static function fromArray(array $data): self {
        return new self(
            $data['id'],
            $data['reactor_id'],
            $data['sensor_type'],
            (float) $data['current_value'],
            $data['unit'] ?? null,
            $data['last_update'] ?? date('Y-m-d H:i:s')
        );
    }

    public function getId(): int { 
        return $this->id; 
    }
    
    public function getReactorId(): int { 
        return $this->reactor_id; 
    }
    
    public function getSensorType(): string { 
        return $this->sensor_type; 
    }
    
    public function getCurrentValue(): float { 
        return $this->current_value; 
    }
    
    public function getUnit(): ?string { 
        return $this->unit; 
    }
    
    public function getLastUpdate(): string { 
        return $this->last_update; 
    }
}