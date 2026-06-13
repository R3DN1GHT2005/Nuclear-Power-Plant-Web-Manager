<?php

/*
 * backend/src/Validators/Reactors/CanduValidator.php
 * CanduValidator — reactor-type-specific validation logic for sensor
 * configurations and operational parameters. Used by SensorService
 * when creating or updating sensors.
 */

namespace App\Validators\Reactors;

use App\DTOs\Request\Reactor\CreateReactorRequestDTO;
use App\Clients\ElevationApiClient;
use App\Clients\SeismicApiClient;
use App\Exceptions\ValidationException;
use App\Services\CityDistanceService;

class CanduValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void {
        $cityDistanceService = new CityDistanceService();

        

        if ($dto->installed_power < 400) {
            throw new ValidationException("CANDU: Reglementări AIEA - Nu se avizează unități sub 400MW din motive de rentabilitate.");
        }

        $cityDistanceService->assertNoMajorCityWithin($dto->latitude, $dto->longitude, 5.0);

        $elevationClient = new ElevationApiClient();
        try {
            $elevation = $elevationClient->getElevation($dto->latitude, $dto->longitude);
            if ($elevation > 1000) {
                throw new ValidationException("CANDU (Open-Elevation): Altitudinea extrasă ({$elevation}m) face ineficientă pomparea apei de răcire.");
            }
        } catch (\Throwable $e) {
            throw new ValidationException("CANDU: Eroare validare altitudine: " . $e->getMessage());
        }

        $seismicApi = new SeismicApiClient();
        try {
            $seismic = $seismicApi->getSeismicRisk($dto->latitude, $dto->longitude);
            if ($seismic > 6.5) {
                throw new ValidationException("CANDU (EMSC API): Istoricul seismic al zonei indică cutremure mai mari de 6.5 magnitudine.");
            }
        } catch (\Throwable $e) {
            throw new ValidationException("CANDU: Eroare validare seismică: " . $e->getMessage());
        }
    }
}