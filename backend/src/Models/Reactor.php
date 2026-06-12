<?php

/*
 * backend/src/Models/Reactor.php
 * Reactor domain model — represents the Reactor entity with
 * properties matching the database schema. Used across Services,
 * Repositories, and Mappers for data transfer within the backend.
 */


namespace App\Models;

class Reactor {
    private int $id;
    private string $name;
    private string $location_name;
    private float $latitude;
    private float $longitude;
    private string $status;
    private float $installed_power;
    private float $current_efficiency;
    private float $soil_stability;
    private float $seismic_risk;
    private string $reactor_type;
    private string $cooling_water_source;
    private float $distance_to_nearest_city_km;
    private float $elevation_meters;
    private \DateTime $created_at;
    private ?\DateTime $last_maintenance;
    private string $webhook_url;
    private ?string $mac_address; 

    private array $sensors = [];

    public function __construct(
        int $id,
        string $name,
        string $location_name,
        float $latitude,
        float $longitude,
        string $status,
        float $installed_power,
        float $current_efficiency,
        float $soil_stability,
        float $seismic_risk,
        string $reactor_type,
        string $cooling_water_source,
        float $distance_to_nearest_city_km,
        float $elevation_meters,
        \DateTime $created_at,
        ?\DateTime $last_maintenance,
        ?string $webhook_url = null,
        ?string $mac_address = null 

    ) {
        $this->id                          = $id;
        $this->name                        = $name;
        $this->location_name               = $location_name;
        $this->latitude                    = $latitude;
        $this->longitude                   = $longitude;
        $this->status                      = $status;
        $this->installed_power             = $installed_power;
        $this->current_efficiency          = $current_efficiency;
        $this->soil_stability              = $soil_stability;
        $this->seismic_risk                = $seismic_risk;
        $this->reactor_type                = $reactor_type;
        $this->cooling_water_source        = $cooling_water_source;
        $this->distance_to_nearest_city_km = $distance_to_nearest_city_km;
        $this->elevation_meters            = $elevation_meters;
        $this->created_at                  = $created_at;
        $this->last_maintenance            = $last_maintenance;
        $this->webhook_url                 = $webhook_url ?? '';
        $this->mac_address                 = $mac_address; 

    }

    public static function fromArray(array $data): self {
        $createdAt = self::parseDateTime($data['created_at'] ?? null);
        $lastMaintenance = self::parseDateTime($data['last_maintenance'] ?? null, $createdAt);

        return new self(
            id:                            (int)   $data['id'],
            name:                                  $data['name'],
            location_name:                         $data['location_name'],
            latitude:                      (float) $data['latitude'],
            longitude:                     (float) $data['longitude'],
            status:                                $data['status'],
            installed_power:               (float) $data['installed_power'],
            current_efficiency:            (float) $data['current_efficiency'],
            soil_stability:                (float) $data['soil_stability'],
            seismic_risk:                  (float) $data['seismic_risk'],
            reactor_type:                          $data['reactor_type'],
            cooling_water_source:                  $data['cooling_water_source'],
            distance_to_nearest_city_km:   (float) $data['distance_to_nearest_city_km'],
            elevation_meters:              (float) $data['elevation_meters'],
            created_at:              $createdAt,
            last_maintenance:        $lastMaintenance,
            webhook_url:                   $data['webhook_discord'] ?? null,
            mac_address:                   $data['mac_address'] ?? null 

        );
    }

    private static function parseDateTime(mixed $dateValue, ?\DateTime $fallback = null): \DateTime {
        if (is_string($dateValue) && trim($dateValue) !== '') {
            try {
                return new \DateTime($dateValue);
            } catch (\Throwable $throwable) {
                

            }
        }

        return $fallback ?? new \DateTime();
    }

    public function getId(): int                  { return $this->id; }
    public function getName(): string             { return $this->name; }
    public function getLocationName(): string     { return $this->location_name; }
    public function getLatitude(): float          { return $this->latitude; }
    public function getLongitude(): float         { return $this->longitude; }
    public function getStatus(): string           { return $this->status; }
    public function getInstalledPower(): float    { return $this->installed_power; }
    public function getCurrentEfficiency(): float { return $this->current_efficiency; }
    public function getSoilStability(): float     { return $this->soil_stability; }
    public function getSeismicRisk(): float       { return $this->seismic_risk; }
    public function getReactorType(): string     { return $this->reactor_type; }
    public function getCoolingWaterSource(): string { return $this->cooling_water_source; }
    public function getDistanceToNearestCityKm(): float { return $this->distance_to_nearest_city_km; }
    public function getElevationMeters(): float      { return $this->elevation_meters; }
    public function getCreatedAt(): \DateTime        { return $this->created_at; }
    public function getLastMaintenance(): ?\DateTime { return $this->last_maintenance; }

    public function setSensors(array $sensors): void {
        $this->sensors = $sensors;
    }

    public function getSensors(): array {
        return $this->sensors;
    }

    public function getWebhookUrl(): string { 
        return $this->webhook_url; 
    }

    public function setWebhookUrl(string $webhook_url): void {
        $this->webhook_url = $webhook_url;
    }

    

    public function getMacAddress(): ?string { 
        return $this->mac_address; 
    }

    public function setMacAddress(?string $mac_address): void {
        $this->mac_address = $mac_address;
    }
}