<?php

namespace App\Enums;

enum AlertSeverity: string {
    case WARNING = 'warning';
    case CRITICAL = 'critical';

    public function getLabel(): string {
        return match($this) {
            self::WARNING => 'Avertisment',
            self::CRITICAL => 'Critic',
        };
    }
}