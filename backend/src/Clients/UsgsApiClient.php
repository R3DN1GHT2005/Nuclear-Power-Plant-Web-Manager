<?php

namespace App\Clients;

class UsgsApiClient {
    
    public function getSeismicRisk(float $latitude, float $longitude): float {
        $url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude={$latitude}&longitude={$longitude}&maxradiuskm=50&orderby=magnitude&limit=1";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        curl_close($ch);

        if (!$response) {
            throw new \Exception("Eroare API USGS: Nu am putut contacta serverul seismic.");
        }

        $data = json_decode($response, true);

        if (!empty($data['features']) && isset($data['features'][0]['properties']['mag'])) {
            return (float) $data['features'][0]['properties']['mag'];
        }

        return 0.0;
    }
}