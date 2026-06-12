<?php

/*
 * backend/src/Clients/SeismicApiClient.php
 * SeismicApiClient — external HTTP API client that fetches environmental
 * data (seismic, elevation, weather) from third-party services
 * for reactor placement and monitoring.
 */


namespace App\Clients;

class SeismicApiClient {
    
    public function getSeismicRisk(float $latitude, float $longitude): float {
        $url = "https://www.seismicportal.eu/fdsnws/event/1/query?format=json&lat={$latitude}&lon={$longitude}&maxradiuskm=50&minmag=4.0";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'NuclearSimulator/1.0 (contact@exemplu.ro)');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
        ]);
        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $curlCode = curl_errno($ch);
        curl_close($ch);

        if (!$response) {
            throw new \Exception("Eroare API EMSC: {$curlError} (cURL {$curlCode})");
        }

        $data = json_decode($response, true);

        if (!empty($data['features']) && is_array($data['features'])) {
            $magnitudes = [];

            foreach ($data['features'] as $feature) {
                $properties = $feature['properties'] ?? [];
                $magnitude = $properties['mag'] ?? $properties['magnitude'] ?? $properties['magValue'] ?? null;

                if ($magnitude !== null && is_numeric($magnitude)) {
                    $magnitudes[] = (float) $magnitude;
                }
            }

            if (!empty($magnitudes)) {
                rsort($magnitudes, SORT_NUMERIC);
                return $magnitudes[0];
            }
        }

        return 0.0;
    }
}
