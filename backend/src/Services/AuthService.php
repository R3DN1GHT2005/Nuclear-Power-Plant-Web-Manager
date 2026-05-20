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

    public function sendPasswordResetCode($email){
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            // For security, behave as if email was sent
            return null;
        }

        // Generate a short numeric code for demo (6 digits)
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = (new \DateTime('+15 minutes'))->format('Y-m-d H:i:s');

        // Store hashed code
        $tokenHash = password_hash($code, PASSWORD_BCRYPT);
        $this->userRepository->createPasswordReset($email, $tokenHash, $expiresAt);

        // In real app send email. For now return the code so frontend can show it in demo mode.
        return $code;
    }

    public function resetPasswordWithCode($email, $code, $newPassword){
        $row = $this->userRepository->findPasswordResetByEmail($email);
        if (!$row) return false;

        // check expiry
        $now = new \DateTime();
        $expires = new \DateTime($row['expires_at']);
        if ($now > $expires) {
            // expired
            $this->userRepository->deletePasswordReset($email);
            return 'expired';
        }

        // verify code
        if (!password_verify($code, $row['token_hash'])){
            return false;
        }

        // all good: update password
        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $user = $this->userRepository->findByEmail($email);
        if (!$user) return false;

        $updated = $this->userRepository->updateUserPassword($user['id'], $newHash);
        // delete token
        $this->userRepository->deletePasswordReset($email);
        return $updated ? true : false;
    }
}