</php
namespace App\Controllers;
use App\Services\AuthService;
use Exception;

class AuthController{
    private $authService;

    public function __construct(){
        $this->authService=new AuthService();
    }

    public function login(){
        $data=json.decode(file_get_contents("php://input"),true);
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
        $data = json_decode(file_get_contents("php://input"), true);

        $email = $data['email'];
        $password = $data['password'];
        $fullName = $data['full_name'];
        $role = $data['role']; 

        if (empty($email) || empty($password) || empty($fullName)) {
            http_response_code(400);
            echo json_encode(["error" => "Toate câmpurile sunt obligatorii!"]);
            return;
        }

        try {
            $newUserId = $this->authService->register($email, $password, $fullName, $role);
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
}