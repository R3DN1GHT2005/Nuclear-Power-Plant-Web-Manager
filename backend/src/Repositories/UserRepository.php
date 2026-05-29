<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

class UserRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function register($email, $passwordHash, $firstName, $lastName, $role = 'viewer') {
        if ($this->findByEmail($email)) {
            return false;
        }

        $sql = "INSERT INTO users (email, password_hash, first_name, last_name, role) 
                VALUES (:email, :password_hash, :first_name, :last_name, :role) 
                RETURNING id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);
        $stmt->bindParam(':role', $role);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['id'];
    }

    public function findById($id) {
        $sql = "SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    }

    public function verifyTehnician($id) {
        $sql = "SELECT role FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetch();
        
        return $result && ($result['role'] === 'technician');
    }

    public function verifyAdmin($id) {
        $sql = "SELECT role FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetch();
        
        return $result && ($result['role'] === 'admin');
    }

    public function deleteUser($id) {
        $sql = "DELETE FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateUserRole($id, $newRole) {
        $sql = "UPDATE users SET role = :role WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':role', $newRole);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateUserPassword($id, $newPasswordHash) {
        $sql = "UPDATE users SET password_hash = :password_hash WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':password_hash', $newPasswordHash);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateUserFirstName($id, $firstName) {
        $sql = "UPDATE users SET first_name = :first_name WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateUserLastName($id, $lastName) {
        $sql = "UPDATE users SET last_name = :last_name WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':last_name', $lastName);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateUserNames($id, $firstName, $lastName) {
        $sql = "UPDATE users SET first_name = :first_name, last_name = :last_name WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateUserFullName($id, $newFullName) {
        $parts = preg_split('/\s+/', trim($newFullName), 2);
        $firstName = $parts[0] ?? '';
        $lastName = $parts[1] ?? '';
        return $this->updateUserNames($id, $firstName, $lastName);
    }

    public function updateUserEmail($id, $newEmail) {
        $sql = "UPDATE users SET email = :email WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $newEmail);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function getAllUsers() {
        $sql = "SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function searchByName($name) {
        $sql = "SELECT id, email, first_name, last_name, role, created_at
                FROM users
                WHERE first_name ILIKE :term
                   OR last_name ILIKE :term
                   OR (first_name || ' ' || last_name) ILIKE :term
                ORDER BY first_name ASC, last_name ASC";
        
        $stmt = $this->db->prepare($sql);
        $term = '%' . trim($name) . '%';
        $stmt->bindParam(':term', $term, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getByName($name) {
        $results = $this->searchByName($name);
        return $results ? $results[0] : false;
    }
}