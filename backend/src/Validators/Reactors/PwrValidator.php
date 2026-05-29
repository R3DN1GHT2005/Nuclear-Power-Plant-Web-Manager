<?php
namespace App\Validators\Reactors;
use App\DTOs\Request\reactor\CreateReactorDTO;

class PwrValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorDTO $dto): void {

        if ($dto->distance_to_nearest_city_km < 20) {
            throw new \Exception("PWR (Overpass API): Există localități în zona de risc imediat de 20km.");
        }

        if ($dto->soil_stability < 0.85) {
            throw new \Exception("PWR (Date Geologice): Domul de reținere sub presiune necesită rocă dură (stabilitate > 0.85).");
        }
        
        if ($dto->seismic_risk > 7.0) {
            throw new \Exception("PWR (USGS API): Zona este pe o falie activă. Riscul de fisurare a anvelopei sub presiune este prea mare.");
        }

        if ($dto->elevation_meters > 1500) {
            throw new \Exception("PWR (Open-Elevation): Pompele de presiune primară pierd din eficiență la altitudini peste 1500m.");
        }

        if (isset($dto->extreme_weather_risk) && $dto->extreme_weather_risk === true) {
            throw new \Exception("PWR (Meteostat API): Zona este predispusă la inundații masive sau cicloane care pot afecta pompele externe (Ex: Scenariul Fukushima).");
        }
    }
}