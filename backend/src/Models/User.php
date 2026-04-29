
<?php

class User{
    private int $id;
    private string $email;
    private string $password_hash;
    private string $full_name;
    private string $role; 
    private \DateTime $created_at;

    public function __construct(int $id, string $email, string $password_hash, string $full_name, string $role, \DateTime $created_at) {
        $this->id = $id;
        $this->email = $email;
        $this->password_hash = $password_hash;
        $this->full_name = $full_name;
        $this->role = $role;
        $this->created_at = $created_at;
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

    public function getFullName(): string {
        return $this->full_name;
    }

    public function getRole(): string {
        return $this->role;
    }

    public function getCreatedAt(): \DateTime {
        return $this->created_at;
    }

    public function setEmail(string $email): void {
        $this->email = $email;
    }

    public function setPasswordHash(string $password_hash): void {
        $this->password_hash = $password_hash;
    }

    public function setFullName(string $full_name): void {
        $this->full_name = $full_name;
    }

    public function setRole(string $role): void {
        $this->role = $role;
    }

    public function setCreatedAt(\DateTime $created_at): void {
        $this->created_at = $created_at;
    }

}
