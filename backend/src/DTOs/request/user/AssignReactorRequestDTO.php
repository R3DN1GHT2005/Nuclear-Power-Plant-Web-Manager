/*
 * backend/src/DTOs/request/user/AssignReactorRequestDTO.php
 * Request DTO for user AssignReactorRequestDTO — validates and
 * structures incoming API request data before passing it to
 * the service layer.
 */
<?php

namespace App\DTOs\Request\User;

class AssignReactorRequestDTO {
    public function __construct(
        public readonly ?int $reactor_id
    ) {}
}