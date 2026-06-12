/*
 * backend/src/Mappers/UserMapper.php
 * User data mapper — converts between domain models and
 * DTOs/arrays for API request/response serialisation. Ensures
 * clean separation between internal and external data formats.
 */
<?php

namespace App\Mappers;

use App\Models\User;
use App\DTOs\Response\User\UserResponseDTO;
use App\DTOs\Request\User\CreateUserRequestDTO;
use App\DTOs\Request\User\UpdateUserPasswordDTO;
use App\DTOs\Request\User\AssignReactorRequestDTO;
use InvalidArgumentException;

class UserMapper {
    
    public static function toCreateUserDTO(array $data): CreateUserRequestDTO {
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            throw new InvalidArgumentException("Numele, email-ul și parola sunt obligatorii.");
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Adresa de email nu este validă.");
        }

        if (strlen($data['password']) < 6) {
            throw new InvalidArgumentException("Parola trebuie să aibă minim 6 caractere.");
        }

        

        $parts = preg_split('/\s+/', trim($data['name']), 2);
        $firstName = $parts[0] ?? '';
        $lastName = $parts[1] ?? '';

        return new CreateUserRequestDTO(
            $firstName,
            $lastName,
            trim(strtolower($data['email'])),
            $data['password'],
            strtolower($data['role'] ?? 'tehnician')
        );
    }

    public static function toUpdatePasswordDTO(array $data): UpdateUserPasswordDTO {
        $password = $data['password'] ?? '';
        
        if (strlen($password) < 6) {
            throw new InvalidArgumentException("Parola trebuie să aibă minim 6 caractere.");
        }

        return new UpdateUserPasswordDTO($password);
    }

    public static function toAssignReactorDTO(array $data): AssignReactorRequestDTO {
        $reactorId = null;
        
        if (isset($data['reactor_id']) && $data['reactor_id'] !== '') {
            if (!is_numeric($data['reactor_id'])) {
                throw new InvalidArgumentException("ID-ul reactorului trebuie să fie un număr valid.");
            }
            $reactorId = (int) $data['reactor_id'];
        }

        return new AssignReactorRequestDTO($reactorId);
    }

    public static function toResponse(User $user): UserResponseDTO {
        $assignment = $user->getAssignment();
        
        return new UserResponseDTO(
            id: $user->getId(),
            email: $user->getEmail(),
            name: $user->getFullName(), 

            role: $user->getRole()->value, 
            reactor_id: $assignment ? $assignment->getReactorId() : null,
            intervention_role: $assignment ? $assignment->getInterventionRole() : null,
            created_at: $user->getCreatedAt()->format('Y-m-d H:i:s')
        );
    }

    public static function toResponseList(array $users): array {
        return array_map(fn($user) => self::toResponse($user), $users);
    }
}