<?php

namespace App\Clients;

class WeatherApiClient {
    
    public function hasExtremeWeatherRisk(float $latitude, float $longitude): bool {
        $startDate = date('Y-m-d', strtotime('-1 year'));
        $endDate = date('Y-m-d');
        
        $url = "https://archive-api.open-meteo.com/v1/archive?latitude={$latitude}&longitude={$longitude}&start_date={$startDate}&end_date={$endDate}&daily=wind_speed_10m_max&timezone=auto";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        curl_close($ch);

        if (!$response) {
            throw new \Exception("Eroare API Meteo: Nu am putut contacta serverul.");
        }

        $data = json_decode($response, true);

        if (isset($data['daily']['wind_speed_10m_max'])) {
            $maxWinds = $data['daily']['wind_speed_10m_max'];
            
            foreach ($maxWinds as $windSpeed) {
                if ($windSpeed > 118.0) { 
                    return true;
                }
            }
        }

        return false;
    }
}