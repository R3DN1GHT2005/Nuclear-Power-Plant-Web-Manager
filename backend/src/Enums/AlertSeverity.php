/*
 * backend/src/Enums/AlertSeverity.php
 * AlertSeverity enum — defines the allowed values for alert severity
 * used across the application for type-safe comparisons.
 */
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