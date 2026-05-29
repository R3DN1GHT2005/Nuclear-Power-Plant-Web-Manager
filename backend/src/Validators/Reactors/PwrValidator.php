<?php
namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorRequestDTO;
use App\Clients\OverpassApiClient;
use App\Clients\ElevationApiClient;
use App\Clients\UsgsApiClient;
use App\Exceptions\ValidationException;

class PwrValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void {

        $overpass = new OverpassApiClient();
        try {
            $distanceKm = $overpass->getDistanceToNearestCity($dto->latitude, $dto->longitude);
            if ($distanceKm < 20) {
                throw new ValidationException("PWR (Overpass API): Există localități în zona de risc imediat de 20km.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("PWR: Eroare validare distanță oraș: " . $e->getMessage());
        }

        $usgs = new UsgsApiClient();
        try {
            $seismic = $usgs->getSeismicRisk($dto->latitude, $dto->longitude);
            if ($seismic > 7.0) {
                throw new ValidationException("PWR (USGS API): Zona este pe o falie activă. Riscul de fisurare a anvelopei sub presiune este prea mare.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("PWR: Eroare validare seismică: " . $e->getMessage());
        }

        $elev = new ElevationApiClient();
        try {
            $elevation = $elev->getElevation($dto->latitude, $dto->longitude);
            if ($elevation > 1500) {
                throw new ValidationException("PWR (Open-Elevation): Pompele de presiune primară pierd din eficiență la altitudini peste 1500m.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("PWR: Eroare validare altitudine: " . $e->getMessage());
        }
    }
}