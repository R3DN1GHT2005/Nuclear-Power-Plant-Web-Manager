<?php
namespace App\Services;
use App\Repositories\UserRepository;
use Exception;

class AuthService{
    private $userRepository;

    public function __construct(){
        $this->userRepository=new UserRepository();
    }

    public function login($email,$password){
        $user=$this->userRepository->findByEmail($email);
        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            $user['full_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
            return $user;
        }
        return false;
    }   

    public function register($email,$password,$firstName,$lastName,$role='viewer') {
        $existingUser=$this->userRepository->findByEmail($email);
        if ($existingUser) {
            throw new Exception("Email already in use");
        }
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        return $this->userRepository->register($email, $hashedPassword, $firstName, $lastName, $role);
    }
}