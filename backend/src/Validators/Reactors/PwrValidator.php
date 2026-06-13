<?php

/*
 * backend/src/Validators/Reactors/PwrValidator.php
 * PwrValidator — reactor-type-specific validation logic for sensor
 * configurations and operational parameters. Used by SensorService
 * when creating or updating sensors.
 */

namespace App\Validators\Reactors;

use App\DTOs\Request\Reactor\CreateReactorRequestDTO;
use App\Clients\ElevationApiClient;
use App\Clients\SeismicApiClient;
use App\Exceptions\ValidationException;
use App\Services\CityDistanceService;

class PwrValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void {
        $cityDistanceService = new CityDistanceService();

        $cityDistanceService->assertNoMajorCityWithin($dto->latitude, $dto->longitude, 5.0);

        $seismicApi = new SeismicApiClient();
        try {
            $seismic = $seismicApi->getSeismicRisk($dto->latitude, $dto->longitude);
            if ($seismic > 7.0) {
                throw new ValidationException("PWR (EMSC API): Zona este pe o falie activă. Riscul de fisurare a anvelopei sub presiune este prea mare.");
            }
        } catch (\Throwable $e) {
            throw new ValidationException("PWR: Eroare validare seismică: " . $e->getMessage());
        }

        $elev = new ElevationApiClient();
        try {
            $elevation = $elev->getElevation($dto->latitude, $dto->longitude);
            if ($elevation > 1500) {
                throw new ValidationException("PWR (Open-Elevation): Pompele de presiune primară pierd din eficiență la altitudini peste 1500m.");
            }
        } catch (\Throwable $e) {
            throw new ValidationException("PWR: Eroare validare altitudine: " . $e->getMessage());
        }
    }
}