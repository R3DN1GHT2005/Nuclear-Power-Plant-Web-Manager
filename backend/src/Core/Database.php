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
            // În producție nu afișăm eroarea direct, dar pentru testare ne ajută
            die(json_encode(['error' => 'Eroare conexiune DB: ' . $e->getMessage()]));
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
}