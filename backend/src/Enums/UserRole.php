/*
 * backend/src/Enums/UserRole.php
 * UserRole enum — defines the allowed values for user role
 * used across the application for type-safe comparisons.
 */
<?php

namespace App\Enums;

use InvalidArgumentException;

enum UserRole: string {
    case ADMIN = 'admin';
    case MANAGER = 'manager';
    case TECHNICIAN = 'tehnician';

    public static function fromString(string $role): self {
        return match (strtolower(trim($role))) {
            'admin' => self::ADMIN,
            'manager' => self::MANAGER,
            'tehnician' => self::TECHNICIAN,
            default => throw new InvalidArgumentException("Rol invalid: $role")
        };
    }
}