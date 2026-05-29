<?php
namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorRequestDTO;
use App\Clients\OverpassApiClient;
use App\Clients\ElevationApiClient;
use App\Clients\UsgsApiClient;
use App\Exceptions\ValidationException;

class SmrValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void {

        if ($dto->installed_power > 300) {
            throw new ValidationException("SMR: Prin definiție, un modul nu poate depăși 300MW.");
        }

        $overpass = new OverpassApiClient();
        try {
            $distanceKm = $overpass->getDistanceToNearestCity($dto->latitude, $dto->longitude);
            if ($distanceKm < 2) {
                throw new ValidationException("SMR (Overpass API): Chiar și pentru un SMR, distanța de {$distanceKm}km față de un oraș e prea mică. Minimul e 2km.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("SMR: Eroare validare distanță oraș: " . $e->getMessage());
        }

        $usgs = new UsgsApiClient();
        try {
            $seismic = $usgs->getSeismicRisk($dto->latitude, $dto->longitude);
            if ($seismic > 7.5) {
                throw new ValidationException("SMR (USGS API): Izolatorii seismici de la baza modulului nu suportă cutremure mai mari de 7.5.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("SMR: Eroare validare seismică: " . $e->getMessage());
        }

        $elev = new ElevationApiClient();
        try {
            $elevation = $elev->getElevation($dto->latitude, $dto->longitude);
            if ($elevation > 2500) {
                throw new ValidationException("SMR (Open-Elevation): Altitudine ({$elevation}m) prea mare pentru logistica rutieră a modulelor prefabricate.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("SMR: Eroare validare altitudine: " . $e->getMessage());
        }
    }
}