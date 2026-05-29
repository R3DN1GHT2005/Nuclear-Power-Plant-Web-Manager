<?php
namespace App\Validators\Reactors;
use App\DTOs\Request\reactor\CreateReactorDTO;

class SmrValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorDTO $dto): void {

        if ($dto->installed_power > 300) {
            throw new \Exception("SMR: Prin definiție, un modul nu poate depăși 300MW.");
        }

        if ($dto->distance_to_nearest_city_km < 2) {
            throw new \Exception("SMR (Overpass API): Chiar și pentru un SMR, distanța de {$dto->distance_to_nearest_city_km}km față de un oraș e prea mică. Minimul e 2km.");
        }

        if ($dto->soil_stability < 0.60) {
            throw new \Exception("SMR (Date Geologice): Sol extrem de moale detectat. Limita minimă este 0.60.");
        }

        if ($dto->seismic_risk > 7.5) {
            throw new \Exception("SMR (USGS API): Izolatorii seismici de la baza modulului nu suportă cutremure mai mari de 7.5.");
        }
        
        if ($dto->elevation_meters > 2500) {
            throw new \Exception("SMR (Open-Elevation): Altitudine ({$dto->elevation_meters}m) prea mare pentru logistica rutieră a modulelor prefabricate.");
        }
    }
}