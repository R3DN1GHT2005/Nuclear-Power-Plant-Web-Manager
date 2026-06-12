/*
 * backend/src/Services/CityDistanceService.php
 * CityDistanceService — implements business logic for city distance
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */
<?php

namespace App\Services;

use App\Exceptions\ValidationException;

class CityDistanceService {
    private const CSV_PATH = __DIR__ . '/../../data/worldcities.csv';
    private const MIN_POPULATION = 20000;

    private static ?array $cities = null;

    public function assertNoMajorCityWithin(float $latitude, float $longitude, float $thresholdKm = 5.0): void {
        $nearestCity = null;
        $nearestDistance = null;

        foreach ($this->getCities() as $city) {
            $distance = $this->getDistance($latitude, $longitude, $city['lat'], $city['lng']);

            if ($nearestDistance === null || $distance < $nearestDistance) {
                $nearestDistance = $distance;
                $nearestCity = $city;
            }

            if ($distance < $thresholdKm) {
                $cityName = $city['city'] ?? 'oraș necunoscut';
                throw new ValidationException(sprintf(
                    'Reactorul este prea aproape de o zonă urbană majoră (%s, %.2f km).',
                    $cityName,
                    $distance
                ));
            }
        }

        if ($nearestCity === null) {
            return;
        }
    }

    public function getNearestCityDistance(float $latitude, float $longitude): float {
        $nearestDistance = null;

        foreach ($this->getCities() as $city) {
            $distance = $this->getDistance($latitude, $longitude, $city['lat'], $city['lng']);
            if ($nearestDistance === null || $distance < $nearestDistance) {
                $nearestDistance = $distance;
            }
        }

        return $nearestDistance === null ? 0.0 : round($nearestDistance, 2);
    }

    private function getCities(): array {
        if (self::$cities !== null) {
            return self::$cities;
        }

        $filePath = self::CSV_PATH;
        if (!is_file($filePath)) {
            error_log('[NUCLEAR WATCH] worldcities.csv nu a fost găsit la: ' . $filePath);
            self::$cities = [];
            return self::$cities;
        }

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            error_log('[NUCLEAR WATCH] Nu s-a putut deschide worldcities.csv la: ' . $filePath);
            self::$cities = [];
            return self::$cities;
        }

        $cities = [];
        $header = fgetcsv($handle);

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 10) {
                continue;
            }

            $population = (int) str_replace([',', ' '], '', (string) ($row[9] ?? '0'));
            if ($population < self::MIN_POPULATION) {
                continue;
            }

            $lat = (float) ($row[2] ?? 0);
            $lng = (float) ($row[3] ?? 0);
            $cityName = (string) ($row[0] ?? '');

            if ($cityName === '' || !is_finite($lat) || !is_finite($lng)) {
                continue;
            }

            $cities[] = [
                'city' => $cityName,
                'lat' => $lat,
                'lng' => $lng,
                'population' => $population,
            ];
        }

        fclose($handle);
        self::$cities = $cities;

        return self::$cities;
    }

    private function getDistance(float $lat1, float $lon1, float $lat2, float $lon2): float {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
