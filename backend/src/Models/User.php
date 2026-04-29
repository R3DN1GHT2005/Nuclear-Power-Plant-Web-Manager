<?php

class User{
    private int $id;
    private string $email;
    private string $password_hash;
    private string $first_name;
    private string $last_name;
    private string $role;
    private \DateTime $created_at;

    public function __construct(int $id, string $email, string $password_hash, string $first_name, string $last_name, string $role, \DateTime $created_at){
        $this->id = $id;
        $this->email = $email;
        $this->password_hash = $password_hash;
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->role = $role;
        $this->created_at = $created_at;
    }

    public function getId(): int{
        return $this->id;
    }

    public function getEmail(): string{
        return $this->email;
    }

    public function getPasswordHash(): string{
        return $this->password_hash;
    }

    public function getFirstName(): string{
        return $this->first_name;
    }

    public function getLastName(): string{
        return $this->last_name;
    }

    public function getFullName(): string{
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function getRole(): string{
        return $this->role;
    }

    public function getCreatedAt(): \DateTime{
        return $this->created_at;
    }

    public function setEmail(string $email): void{
        $this->email = $email;
    }

    public function setPasswordHash(string $password_hash): void{
        $this->password_hash = $password_hash;
    }

    public function setFirstName(string $first_name): void{
        $this->first_name = $first_name;
    }

    public function setLastName(string $last_name): void{
        $this->last_name = $last_name;
    }

    public function setFullName(string $full_name): void{
        $parts = preg_split('/\s+/', trim($full_name), 2);
        $this->first_name = $parts[0] ?? '';
        $this->last_name = $parts[1] ?? '';
    }

    public function setRole(string $role): void{
        $this->role = $role;
    }

    public function setCreatedAt(\DateTime $created_at): void{
        $this->created_at = $created_at;
    }
}