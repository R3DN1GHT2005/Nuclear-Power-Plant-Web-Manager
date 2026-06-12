<?php

namespace App\Middleware;

use App\Core\Response;

class SensorMiddleware {
    
    public function handle(): bool {
        $providedKey = $_SERVER['HTTP_X_API_KEY'] ?? null;

        if (!$providedKey) {
            $this->abort(401, "Acces neautorizat. Cheia API lipsește din header-ul cererii.");
            return false;
        }

       
        $validKey = getenv('SENSOR_API_KEY') ?: ($_SERVER['SENSOR_API_KEY'] ?? ($_ENV['SENSOR_API_KEY'] ?? null)); 

        if (!$validKey) {
            $this->abort(500, "Eroare internă de configurare. Cheia pentru senzori nu este setată pe server.");
            return false;
        }

        if (!hash_equals($validKey, $providedKey)) {
            $this->abort(401, "Acces neautorizat. Cheia API este invalidă.");
            return false;
        }
        
        return true;
    }

    protected function abort(int $code, string $message): void {
        Response::json([
            "success" => false, 
            "error" => $message
        ], $code);
        exit;
    }
}