<?php
namespace App\Controllers;

use App\Repositories\UserRepository;

class UserController{
	private $userRepository;

	public function __construct(){
		$this->userRepository = new UserRepository();
	}

	public function index(){
		header('Content-Type: application/json');
		echo json_encode($this->userRepository->getAllUsers());
	}

	public function show($id){
		header('Content-Type: application/json');
		$user = $this->userRepository->findById($id);
		if (!$user) {
			http_response_code(404);
			echo json_encode(["error" => "User not found"]);
			return;
		}
		echo json_encode($user);
	}

	public function search(){
		header('Content-Type: application/json');
		$data = json_decode(file_get_contents('php://input'), true) ?? [];
		$name = trim($data['name'] ?? '');

		if ($name === '') {
			http_response_code(400);
			echo json_encode(["error" => "name is required"]);
			return;
		}

		echo json_encode($this->userRepository->searchByName($name));
	}

	public function updateName($id){
		header('Content-Type: application/json');
		$data = json_decode(file_get_contents('php://input'), true) ?? [];
		$firstName = trim($data['first_name'] ?? '');
		$lastName = trim($data['last_name'] ?? '');

		if ($firstName === '' || $lastName === '') {
			http_response_code(400);
			echo json_encode(["error" => "first_name and last_name are required"]);
			return;
		}

		$updated = $this->userRepository->updateUserNames($id, $firstName, $lastName);
		echo json_encode(["success" => $updated]);
	}

	public function delete($id){
		header('Content-Type: application/json');
		echo json_encode(["success" => $this->userRepository->deleteUser($id)]);
	}
}
