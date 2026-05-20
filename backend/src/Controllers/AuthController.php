<?php
namespace App\Controllers;
use App\Services\AuthService;
use Exception;

class AuthController{
    private $authService;

    public function __construct(){
        $this->authService=new AuthService();
    }

    public function login(){
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        $email=$data['email'];
        $password=$data['password'];

        if (empty($email) || empty($password)){
            http_response_code(400);
            echo json_encode(["error"=>"Email and password are required"]);
            return;
        }

        $user=$this->authService->login($email,$password);
        if($user){
            http_response_code(200);
            echo json_encode([
                "message" => "Logare cu succes!",
                "user" => $user
            ]);
        }
        else{
            http_response_code(401); // Unauthorized
            echo json_encode(["error" => "Email sau parolă incorectă!"]);
        }
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"), true) ?? [];

        $email = $data['email'];
        $password = $data['password'];
        $firstName = $data['first_name'] ?? null;
        $lastName = $data['last_name'] ?? null;
        $role = $data['role'] ?? 'viewer';

        if ((!$firstName || !$lastName) && !empty($data['full_name'])) {
            $parts = preg_split('/\s+/', trim($data['full_name']), 2);
            $firstName = $firstName ?: ($parts[0] ?? null);
            $lastName = $lastName ?: ($parts[1] ?? null);
        }

        if (empty($email) || empty($password) || empty($firstName) || empty($lastName)) {
            http_response_code(400);
            echo json_encode(["error" => "Email, password, first_name și last_name sunt obligatorii!"]);
            return;
        }

        try {
            $newUserId = $this->authService->register($email, $password, $firstName, $lastName, $role);
            http_response_code(201);
            echo json_encode([
                "message" => "Cont creat cu succes!",
                "user_id" => $newUserId
            ]);

        } catch (Exception $e) {
            http_response_code(409);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    public function forgot(){
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        $email = $data['email'] ?? null;
        if (!$email){
            http_response_code(400);
            echo json_encode(["error"=>"Email este necesar"]);
            return;
        }

        $code = $this->authService->sendPasswordResetCode($email);
        // In production we would not return the code. For demo, we return it so UI can show it.
        http_response_code(200);
        echo json_encode(["message"=>"Dacă există un cont, s-a trimis un cod de resetare.", "code"=>$code]);
    }

    public function reset(){
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        $email = $data['email'] ?? null;
        $code = $data['code'] ?? null;
        $newPassword = $data['new_password'] ?? null;

        if (!$email || !$code || !$newPassword){
            http_response_code(400);
            echo json_encode(["error"=>"Email, code și new_password sunt necesare"]);
            return;
        }

        $res = $this->authService->resetPasswordWithCode($email, $code, $newPassword);
        if ($res === true){
            http_response_code(200);
            echo json_encode(["message"=>"Parola a fost resetată cu succes."]);            
        } elseif ($res === 'expired'){
            http_response_code(410);
            echo json_encode(["error"=>"Codul a expirat"]);
        } else {
            http_response_code(401);
            echo json_encode(["error"=>"Cod invalid sau email incorect"]);
        }
    }
}