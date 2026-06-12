<?php

namespace App\Services;

use App\Clients\ElevationApiClient;
use App\Clients\SeismicApiClient;
use App\DTOs\Request\reactor\CreateReactorRequestDTO;
use App\DTOs\Request\reactor\InsertReactorDTO;
use App\DTOs\Request\reactor\UpdateReactorDTO;
use App\Models\Reactor;
use App\Repositories\ReactorRepository;
use App\Repositories\SensorRepository;
use App\Validators\Reactors\ValidatorFactory;
use InvalidArgumentException;

class ReactorService {
    private const STATUS_MAP = [
        'activ' => 'Activ',
        'mentenanta' => 'Mentenanta',
        'mentenanta planificata' => 'Mentenanta',
        'oprit' => 'Oprit',
        'alerta' => 'Alerta',
        'critica' => 'Alerta',
        'critic' => 'Alerta',
        'in constructie' => 'In Constructie',
        'constructie' => 'In Constructie',
    ];

    private ReactorRepository $reactorsRepository;
    private SensorRepository $sensorRepository;
    private SeismicApiClient $seismicApi;
    private ElevationApiClient $elevationApi;
    private CityDistanceService $cityDistanceService;

    public function __construct() {
        $this->reactorsRepository = new ReactorRepository();
        $this->sensorRepository = new SensorRepository();
        $this->seismicApi = new SeismicApiClient();
        $this->elevationApi = new ElevationApiClient();
        $this->cityDistanceService = new CityDistanceService();
    }

    public function getAll(): array {
       $reactors = $this->reactorsRepository->findAll();
        foreach ($reactors as $reactor) {
            $sensors = $this->sensorRepository->findByReactorId($reactor->getId());
            $reactor->setSensors($sensors);
        }

        return $reactors;
    }

    public function getById(int $id): ?Reactor {
        $reactor = $this->reactorsRepository->findById($id);
        if ($reactor) {
            $sensors = $this->sensorRepository->findByReactorId($reactor->getId());
            $reactor->setSensors($sensors);
        }
        return $reactor;
    }

    public function create(CreateReactorRequestDTO $dto): Reactor {
        $validator = ValidatorFactory::getValidator($dto->reactor_type);
        $validator->validate($dto);

        $seismicRisk = $this->safeFloat(fn() => $this->seismicApi->getSeismicRisk($dto->latitude, $dto->longitude), 0.0);
        $elevationMeters = $this->safeFloat(fn() => $this->elevationApi->getElevation($dto->latitude, $dto->longitude), 0.0);
        $distanceToNearestCityKm = $this->cityDistanceService->getNearestCityDistance($dto->latitude, $dto->longitude);
        $coolingWaterSource = 'Nespecificata';
        $soilStability = $this->calculateSoilStability($seismicRisk, $elevationMeters);

        $insertDto = new InsertReactorDTO(
            name: $dto->name,
            location_name: $dto->location_name,
            reactor_type: $dto->reactor_type,
            installed_power: $dto->installed_power,
            latitude: $dto->latitude,
            longitude: $dto->longitude,
            status: 'In Constructie',
            soil_stability: $soilStability,
            seismic_risk: $seismicRisk,
            cooling_water_source: $coolingWaterSource,
            distance_to_nearest_city_km: $distanceToNearestCityKm,
            elevation_meters: $elevationMeters,
            webhook_url: $dto->webhook_url,
            mac_address: $dto->mac_address 
        );

        return $this->reactorsRepository->create($insertDto);
    }

    public function refreshCalculatedFields(Reactor $reactor): Reactor {
        $seismicRisk = $this->safeFloat(fn() => $this->seismicApi->getSeismicRisk($reactor->getLatitude(), $reactor->getLongitude()), 0.0);
        $elevationMeters = $this->safeFloat(fn() => $this->elevationApi->getElevation($reactor->getLatitude(), $reactor->getLongitude()), 0.0);
        $distanceToNearestCityKm = $this->cityDistanceService->getNearestCityDistance($reactor->getLatitude(), $reactor->getLongitude());
        $coolingWaterSource = 'Nespecificata';
        $soilStability = $this->calculateSoilStability($seismicRisk, $elevationMeters);

        $updated = $this->reactorsRepository->updateCalculatedFields(
            $reactor->getId(),
            $soilStability,
            $seismicRisk,
            $coolingWaterSource,
            $distanceToNearestCityKm,
            $elevationMeters
        );

        return $updated ?? $reactor;
    }

    private function safeFloat(callable $callback, float $fallback): float {
        try {
            return (float) $callback();
        } catch (\Throwable $throwable) {
            return $fallback;
        }
    }

    private function safeString(callable $callback, string $fallback): string {
        try {
            $value = (string) $callback();
            return $value !== '' ? $value : $fallback;
        } catch (\Throwable $throwable) {
            return $fallback;
        }
    }

    private function calculateSoilStability(float $seismicRisk, float $elevationMeters): float {
        $stability = 1.0 - min(1.0, $seismicRisk / 10.0);
        $stability += min(0.1, max(0.0, $elevationMeters / 10000.0) * 0.05);
        return round(max(0.0, min(1.0, $stability)), 2);
    }

    public function update(int $id, UpdateReactorDTO $dto): ?Reactor {
        if ($dto->status === 'Activ') {
            $dto = new UpdateReactorDTO(
                name: $dto->name,
                location_name: $dto->location_name,
                latitude: $dto->latitude,
                longitude: $dto->longitude,
                status: $dto->status,
                installed_power: $dto->installed_power,
                current_efficiency: $dto->current_efficiency,
                last_maintenance: date('Y-m-d H:i:s'),
                soil_stability: $dto->soil_stability,
                seismic_risk: $dto->seismic_risk,
                reactor_type: $dto->reactor_type,
                cooling_water_source: $dto->cooling_water_source,
                distance_to_nearest_city_km: $dto->distance_to_nearest_city_km,
                elevation_meters: $dto->elevation_meters,
            );
        }

        return $this->reactorsRepository->update($id, $dto);
    }

    public function delete(int $id): bool {
        return $this->reactorsRepository->delete($id);
    }

    public function changeStatus(int $id, string $status): ?Reactor {
        $normalizedStatus = $this->normalizeStatus($status);

        if ($normalizedStatus === null) {
            throw new InvalidArgumentException('Status invalid. Folosiți una dintre stările: Activ, Mentenanță, Oprit, Alertă, În construcție.');
        }

        $this->reactorsRepository->updateStatus($id, $normalizedStatus);

        return $this->getById($id);
    }

    private function normalizeStatus(string $status): ?string {
        $key = trim($status);
        if ($key === '') {
            return null;
        }

        $key = mb_strtolower($key, 'UTF-8');
        $key = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $key) ?: $key;
        $key = preg_replace('/\s+/', ' ', $key);
        $key = trim((string) $key);

        return self::STATUS_MAP[$key] ?? null;
    }

    public function updateEfficiency(int $id, float $efficiency): bool {
        return $this->reactorsRepository->updateEfficiency($id, $efficiency);
    }

    public function getAllActive(): array {
        return $this->reactorsRepository->findAllActive();
    }

    public function getByMac(string $mac): ?Reactor {
        return $this->reactorsRepository->findByMac($mac);
    }

    public function getReactorStatus(int $id): ?string {
        return $this->reactorsRepository->getReactorStatus($id);
    }
    
}

