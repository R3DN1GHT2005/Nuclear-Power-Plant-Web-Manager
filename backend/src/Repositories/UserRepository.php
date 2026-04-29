<?php
namespace App\Repositories;
use App\Core\DataBase;
use PDO;

class UserRepository{
    private $db;
    public function __construct(){
        $this->db=DataBase::getInstance()->getConnection();
    }
    public function findByEmail($email){
        $sql="Select * from users where email=:email";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':email',$email,PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function login($email,$password){
        $user=$this->findByEmail($email);
        if ($user && password_verify($password,$user['password'])){
            return $user;
        }
        return false;
    }

    public function register($email,$passwordHash,$fullName,$role='viewer'){
        
        if ($this->findByEmail($email)){
            return false;
        }
        $sql = "INSERT INTO users (email, password_hash, full_name, role) 
                VALUES (:email, :password_hash, :full_name, :role) 
                RETURNING id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':full_name', $fullName);
        $stmt->bindParam(':role', $role);
        $stmt->execute();
        $result=$stmt->fetch();
        return $result['id'];
    }

    public function findById($id){
        $sql="select id,email,full_name,role,created_at from users where id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function verifyTehnician($id){
        $sql="select role from users where id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        $result=$stmt->fetch();
        return $result && ($result['role']=='technician');
    }

    public function verifyAdmin($id){
        $sql="select role from users where id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        $result=$stmt->fetch();
        return $result && ($result['role']=='admin');
    }
    public function deleteUser($id){
        $sql="DELETE FROM users WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateUserRole($id, $newRole){
        $sql = "UPDATE users SET role = :role WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':role', $newRole);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateUserPassword($id, $newPasswordHash){
        $sql = "UPDATE users SET password_hash = :password_hash WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':password_hash', $newPasswordHash);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateUserFullName($id, $newFullName){
        $sql = "UPDATE users SET full_name = :full_name WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':full_name', $newFullName);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateUserEmail($id, $newEmail){
        $sql = "UPDATE users SET email = :email WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $newEmail);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function getByName($name){
        $sql = "SELECT * FROM users WHERE full_name = :full_name LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':full_name', $name);
        $stmt->execute();
        return $stmt->fetch();
    }
}