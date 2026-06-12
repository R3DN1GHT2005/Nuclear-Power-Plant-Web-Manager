/*
 * backend/src/Clients/MeteostatApiClient.php
 * MeteostatApiClient — external HTTP API client that fetches environmental
 * data (seismic, elevation, weather) from third-party services
 * for reactor placement and monitoring.
 */
<?php

namespace App\Clients;

class MeteostatApiClient {
    
    public function hasExtremeWeatherRisk(float $latitude, float $longitude): bool {
        $startDate = date('Y-m-d', strtotime('-1 year'));
        $endDate = date('Y-m-d');
        
        $url = "https://archive-api.open-meteo.com/v1/archive?latitude={$latitude}&longitude={$longitude}&start_date={$startDate}&end_date={$endDate}&daily=wind_speed_10m_max&timezone=auto";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'NuclearSimulator/1.0 (contact@exemplu.ro)');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $curlCode = curl_errno($ch);
        curl_close($ch);

        if (!$response) {
            throw new \Exception("Eroare API Meteo: {$curlError} (cURL {$curlCode})");
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