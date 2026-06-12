/*
 * backend/src/DTOs/request/user/UpdateUserPasswordDTO.php
 * Request DTO for user UpdateUserPasswordDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\User;

class UpdateUserPasswordDTO {
    public function __construct(
        public readonly string $password
    ) {}
}