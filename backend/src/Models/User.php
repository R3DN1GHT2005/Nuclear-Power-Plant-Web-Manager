<?php

/*
 * backend/src/Models/User.php
 * User domain model — represents the User entity with
 * properties matching the database schema. Used across Services,
 * Repositories, and Mappers for data transfer within the backend.
 */


namespace App\Models;

use App\Enums\UserRole;
use DateTime;

class User {
    private int $id;
    private string $email;
    private string $password_hash;
    private string $first_name;
    private string $last_name;
    private UserRole $role;
    private DateTime $created_at;
    private ?ReactorPersonnel $assignment = null;
    private ?string $rss_token = null;

    public function __construct(
        int $id, 
        string $email, 
        string $password_hash, 
        string $first_name, 
        string $last_name, 
        UserRole $role, 
        DateTime $created_at,
        ?string $rss_token = null 
    ) {
        $this->id = $id;
        $this->email = $email;
        $this->password_hash = $password_hash;
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->role = $role;
        $this->created_at = $created_at;
        $this->rss_token = $rss_token; 
    }

    public function getId(): int {
        return $this->id;
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function getPasswordHash(): string {
        return $this->password_hash;
    }

    public function getFirstName(): string {
        return $this->first_name;
    }

    public function getLastName(): string {
        return $this->last_name;
    }

    public function getFullName(): string {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function getRole(): UserRole {
        return $this->role;
    }

    public function getCreatedAt(): DateTime {
        return $this->created_at;
    }

    public function getAssignment(): ?ReactorPersonnel {
        return $this->assignment;
    }

    public function setAssignment(?ReactorPersonnel $assignment): void {
        $this->assignment = $assignment;
    }

    public function getRssToken(): ?string {
        return $this->rss_token;
    }

    public function setRssToken(?string $rss_token): void {
        $this->rss_token = $rss_token;
    }

    public function setEmail(string $email): void {
        $this->email = $email;
    }

    public function setPasswordHash(string $password_hash): void {
        $this->password_hash = $password_hash;
    }

    public function setFirstName(string $first_name): void {
        $this->first_name = $first_name;
    }

    public function setLastName(string $last_name): void {
        $this->last_name = $last_name;
    }

    public function setFullName(string $full_name): void {
        $parts = preg_split('/\s+/', trim($full_name), 2);
        $this->first_name = $parts[0] ?? '';
        $this->last_name = $parts[1] ?? '';
    }

    public function setRole(UserRole $role): void {
        $this->role = $role;
    }

    public function setCreatedAt(DateTime $created_at): void {
        $this->created_at = $created_at;
    }
}