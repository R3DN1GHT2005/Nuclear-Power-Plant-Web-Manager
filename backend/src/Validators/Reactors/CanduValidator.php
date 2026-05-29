<?php
namespace App\Validators\Reactors;
use App\DTOs\Request\reactor\CreateReactorDTO;

class CanduValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorDTO $dto): void {
        $allowedWater = ['Rau', 'Lac', 'Mare', 'Ocean'];

        if (!in_array($dto->cooling_water_source, $allowedWater)) {
            throw new \Exception("CANDU (Overpass API): Pe o rază de 5km nu s-a detectat o sursă de apă naturală majoră.");
        }

        if ($dto->elevation_meters > 1000) {
            throw new \Exception("CANDU (Open-Elevation): Altitudinea extrasă ({$dto->elevation_meters}m) face ineficientă pomparea apei de răcire.");
        }

        if ($dto->distance_to_nearest_city_km < 30) {
            throw new \Exception("CANDU (Overpass API): S-a detectat o așezare urbană la sub 30km distanță.");
        }

        if ($dto->seismic_risk > 6.5) {
            throw new \Exception("CANDU (USGS API): Istoricul seismic al zonei indică cutremure mai mari de 6.5 magnitudine.");
        }
        
        if ($dto->installed_power < 400) {
            throw new \Exception("CANDU: Reglementări AIEA - Nu se avizează unități sub 400MW din motive de rentabilitate.");
        }
    }
}