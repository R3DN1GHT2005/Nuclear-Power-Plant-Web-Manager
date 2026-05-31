<?php

namespace App\Enums;

enum TaskComplexity: string {
    case LOW = 'Low';
    case MEDIUM = 'Medium';
    case HIGH = 'High';
    case CRITICAL = 'Critical';
}