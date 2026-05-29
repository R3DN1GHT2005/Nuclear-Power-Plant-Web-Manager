<?php

namespace App\Clients;

class ElevationApiClient {
    
    public function getElevation(float $latitude, float $longitude): float {
        $url = "https://api.open-meteo.com/v1/elevation?latitude={$latitude}&longitude={$longitude}";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        curl_close($ch);

        if (!$response) {
            throw new \Exception("Eroare API Altitudine: Nu am putut contacta serverul.");
        }

        $data = json_decode($response, true);

        if (isset($data['elevation'][0])) {
            return (float) $data['elevation'][0];
        }

        throw new \Exception("Eroare API Altitudine: Răspuns invalid.");
    }
}