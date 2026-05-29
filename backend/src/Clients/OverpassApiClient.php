<?php

namespace App\Clients;

class OverpassApiClient {
    
    private function executeQuery(string $query): array {
        $url = "https://overpass-api.de/api/interpreter";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "data=" . urlencode($query));
        curl_setopt($ch, CURLOPT_USERAGENT, "NuclearWatchApp/1.0 (Contact: admin@domeniu.ro)"); 
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response || $httpCode !== 200) {
            throw new \Exception("Overpass API a eșuat. HTTP Code: {$httpCode}");
        }

        return json_decode($response, true) ?? [];
    }

    public function getNearestWaterSource(float $latitude, float $longitude): string {
        try {
            $query = "[out:json];(way['natural'='water'](around:5000,{$latitude},{$longitude});way['waterway'](around:5000,{$latitude},{$longitude}););out count;";
            
            $data = $this->executeQuery($query);

            if (isset($data['elements'][0]['tags']['nodes']) || (isset($data['elements'][0]['count']) && $data['elements'][0]['count'] > 0)) {
                return 'Rau'; 
            }

            return 'Niciuna';
            
        } catch (\Exception $e) {
            error_log("[NUCLEAR WATCH] FALLBACK OVERPASS WATER TRIGGERED: " . $e->getMessage() . " | IP Block/Timeout");
            return 'Niciuna';
        }
    }

    public function getDistanceToNearestCity(float $latitude, float $longitude): float {
        try {
            $query = "[out:json];node['place'~'city|town'](around:50000,{$latitude},{$longitude});out center limit 1;";
            
            $data = $this->executeQuery($query);

            if (!empty($data['elements'])) {
                $cityLat = $data['elements'][0]['lat'];
                $cityLon = $data['elements'][0]['lon'];
                
                return $this->calculateHaversineDistance($latitude, $longitude, $cityLat, $cityLon);
            }
            return 50.0; 

        } catch (\Exception $e) {
            error_log("[NUCLEAR WATCH] FALLBACK OVERPASS CITY TRIGGERED: " . $e->getMessage() . " | IP Block/Timeout");
            return 0.0;
        }
    }

    private function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2): float {
        $earthRadius = 6371; 
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return round($earthRadius * $c, 2);
    }
}