/*
 * backend/src/Validators/Reactors/SmrValidator.php
 * SmrValidator — reactor-type-specific validation logic for sensor
 * configurations and operational parameters. Used by SensorService
 * when creating or updating sensors.
 */
<?php
namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorRequestDTO;
use App\Clients\ElevationApiClient;
use App\Clients\SeismicApiClient;
use App\Exceptions\ValidationException;
use App\Services\CityDistanceService;

class SmrValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void {
        $cityDistanceService = new CityDistanceService();

        if ($dto->installed_power > 300) {
            throw new ValidationException("SMR: Prin definiție, un modul nu poate depăși 300MW.");
        }

        $cityDistanceService->assertNoMajorCityWithin($dto->latitude, $dto->longitude, 5.0);

        $seismicApi = new SeismicApiClient();
        try {
            $seismic = $seismicApi->getSeismicRisk($dto->latitude, $dto->longitude);
            if ($seismic > 7.5) {
                throw new ValidationException("SMR (EMSC API): Izolatorii seismici de la baza modulului nu suportă cutremure mai mari de 7.5.");
            }
        } catch (\Throwable $e) {
            throw new ValidationException("SMR: Eroare validare seismică: " . $e->getMessage());
        }

        $elev = new ElevationApiClient();
        try {
            $elevation = $elev->getElevation($dto->latitude, $dto->longitude);
            if ($elevation > 2500) {
                throw new ValidationException("SMR (Open-Elevation): Altitudine ({$elevation}m) prea mare pentru logistica rutieră a modulelor prefabricate.");
            }
        } catch (\Throwable $e) {
            throw new ValidationException("SMR: Eroare validare altitudine: " . $e->getMessage());
        }
    }
}