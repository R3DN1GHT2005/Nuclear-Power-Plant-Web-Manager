<?php
namespace App\Core;
use PDO;
use PDOException;

class DataBase{
    private static $instance =null;
    private $connection;
    private function __construct(){
        $host = getenv('DB_HOST');
        $port = getenv('DB_PORT');
        $dbname = getenv('DB_NAME');
        $username = getenv('DB_USERNAME');
        $password = getenv('DB_PASSWORD');

        $dsn="pgsql:host=$host;port=$port;dbname=$dbname";
        try{

            $this->connection = new PDO($dsn, $username, $password);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        }
        catch (PDOException $e){
                die(json_encode([
                "error" => "Eroare critica: Nu ma pot conecta la baza de date.",
                "message" => $e->getMessage()
            ]));        
        }
    }
    public static function getInstance(){
        if (self::$instance==null){
            self::$instance=new Database();
        }
        return self::$instance;
    }
    public function getConnection(){
        return $this->connection;
    }
    private function __clone(){
        print("Cloning is not allowed.");
    }
    public function __wakeup(){
        print("Unserializing is not allowed.");
    }

}