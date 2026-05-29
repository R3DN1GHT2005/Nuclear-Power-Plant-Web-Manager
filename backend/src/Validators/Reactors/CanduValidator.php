<?php
namespace App\Validators\Reactors;

use App\DTOs\Request\reactor\CreateReactorRequestDTO;
use App\Clients\OverpassApiClient;
use App\Clients\ElevationApiClient;
use App\Clients\UsgsApiClient;
use App\Exceptions\ValidationException;

class CanduValidator implements ReactorValidatorInterface {
    public function validate(CreateReactorRequestDTO $dto): void {
        // Validate installed power first (simple, comes from request)
        if ($dto->installed_power < 400) {
            throw new ValidationException("CANDU: Reglementări AIEA - Nu se avizează unități sub 400MW din motive de rentabilitate.");
        }

        // Use Overpass to detect nearby major water sources using latitude/longitude
        $overpass = new OverpassApiClient();
        $nearestWater = $overpass->getNearestWaterSource($dto->latitude, $dto->longitude);
        if ($nearestWater === 'Niciuna') {
            throw new ValidationException("CANDU (Overpass API): Pe o rază de 5km nu s-a detectat o sursă de apă naturală majoră.");
        }

        // Use Elevation API to check elevation
        $elevationClient = new ElevationApiClient();
        try {
            $elevation = $elevationClient->getElevation($dto->latitude, $dto->longitude);
            if ($elevation > 1000) {
                throw new ValidationException("CANDU (Open-Elevation): Altitudinea extrasă ({$elevation}m) face ineficientă pomparea apei de răcire.");
            }
        } catch (\Exception $e) {
            // If elevation API fails, surface the validation error as non-fatal fallback
            throw new ValidationException("CANDU: Eroare validare altitudine: " . $e->getMessage());
        }

        // Distance to nearest city
        try {
            $distanceKm = $overpass->getDistanceToNearestCity($dto->latitude, $dto->longitude);
            if ($distanceKm < 30) {
                throw new ValidationException("CANDU (Overpass API): S-a detectat o așezare urbană la sub 30km distanță.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("CANDU: Eroare validare distanță oraș: " . $e->getMessage());
        }

        // Seismic risk
        $usgs = new UsgsApiClient();
        try {
            $seismic = $usgs->getSeismicRisk($dto->latitude, $dto->longitude);
            if ($seismic > 6.5) {
                throw new ValidationException("CANDU (USGS API): Istoricul seismic al zonei indică cutremure mai mari de 6.5 magnitudine.");
            }
        } catch (\Exception $e) {
            throw new ValidationException("CANDU: Eroare validare seismică: " . $e->getMessage());
        }
    }
}