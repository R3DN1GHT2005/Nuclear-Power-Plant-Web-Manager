<?php

namespace App\Core;

use PDO;
use PDOException;

class Database {
    private static ?Database $instance = null;
    private PDO $connection;

    private function __construct() {
        // Preluăm variabilele de mediu din Docker
        $host = getenv('DB_HOST') ?: 'db';
        $db   = getenv('DB_NAME') ?: 'nuclear_watch';
        $user = getenv('DB_USER') ?: 'admin';
        $pass = getenv('DB_PASSWORD') ?: 'secretpassword';
        $port = getenv('DB_PORT') ?: '5432';

        $dsn = "pgsql:host=$host;port=$port;dbname=$db";

        try {
            $this->connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
           http_response_code(500);
            
            die(json_encode([
                'success' => false,
                'error' => 'Eroare critică: Nu ne-am putut conecta la baza de date.',
                'details' => $e->getMessage() 
            ]));
        }
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->connection;
    }

    private function __clone() {}
    //cand se face deserializarea obiectului, metoda __wakeup() este apelată automat. În acest caz, o facem privată pentru a preveni deserializarea obiectului Database, ceea ce ar putea duce la crearea unei noi conexiuni la baza de date și ar încălca principiul singleton-ului.
    public function __wakeup() {
        throw new \Exception("Deserializarea obiectului Singletone Database este interzisă.");
    }
}