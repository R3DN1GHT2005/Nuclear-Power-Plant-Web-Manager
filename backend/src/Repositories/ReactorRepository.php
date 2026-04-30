<?php
namespace App\Repositories;
use App\Core\DataBase;
use PDO;

class ReactorRepository{
    public const ALLOWED_STATUSES = ['Activ', 'Mentenanță', 'Alertă', 'Oprit'];

    private $db;
    public function __construct(){
        $this->db=DataBase::getInstance()->getConnection();
    }

    public function getAllowedStatuses(){
        return self::ALLOWED_STATUSES;
    }

    public function isAllowedStatus($status){
        return in_array($status, self::ALLOWED_STATUSES, true);
    }

    public function getAllReactors(){
        $sql="SELECT * FROM reactors";
        $stmt=$this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function getReactorById($id){
        $sql="SELECT * FROM reactors WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }
    public function updateReactorStatus($id,$status){
        if (!$this->isAllowedStatus($status)) {
            return false;
        }

        $sql="UPDATE reactors SET status=:status WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':status',$status,PDO::PARAM_STR);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateReactorPowerLevel($id,$powerLevel){
        $sql="UPDATE reactors SET installed_power=:power_level WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':power_level',$powerLevel,PDO::PARAM_INT);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function getReactorStatus($id){
        $sql="SELECT status FROM reactors WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        $result=$stmt->fetch();
        return $result ? $result['status'] : null;
    }
    public function getReactorPowerLevel($id){
        $sql="SELECT power_level FROM reactors WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        $result=$stmt->fetch();
        return $result ? $result['power_level'] : null;
    }
    public function updateReactorEfficiency($id, $efficiency){
        $sql = "UPDATE reactors SET current_efficiency = :eff WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':eff', $efficiency);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateInstalledPower($id, $power){
        $sql = "UPDATE reactors SET installed_power = :power WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':power', $power);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateGeologicalData($id, $soil, $risk){
        $sql = "UPDATE reactors 
            SET soil_stability = :soil, seismic_risk = :risk 
            WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':soil', $soil);
        $stmt->bindParam(':risk', $risk);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function updateMaintenanceDate($id){
        $sql = "UPDATE reactors 
            SET last_maintenance = CURRENT_TIMESTAMP 
            WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function getReactorByName($name){
        $sql = "SELECT * FROM reactors WHERE name = :name LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':name', $name);
        $stmt->execute();
        return $stmt->fetch();
    }
    public function createReactor($name, $location, $lat, $lng){
        $sql = "INSERT INTO reactors (name, location_name, latitude, longitude) 
            VALUES (:name, :loc, :lat, :lng)";
    
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':loc', $location);
        $stmt->bindParam(':lat', $lat);
        $stmt->bindParam(':lng', $lng);
        return $stmt->execute();
    }
    public function deleteReactor($id){
    $sql = "DELETE FROM reactors WHERE id = :id";
    $stmt = $this->db->prepare($sql);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    return $stmt->execute();
    }
    public function getLastMaintainedReactors($limit = 5){
        $sql = "SELECT * FROM reactors ORDER BY last_maintenance DESC LIMIT :limit";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function getCriticStatusReactors($efficiencyThreshold = 50){
        $sql = "SELECT * FROM reactors WHERE current_efficiency < :threshold OR status = 'Alertă' ORDER BY current_efficiency ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':threshold', $efficiencyThreshold, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getReactorsByStatus($status){
        if (!$this->isAllowedStatus($status)) {
            return [];
        }

        $sql = "SELECT * FROM reactors WHERE status = :status ORDER BY name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getReactorsNeedingAttention($efficiencyThreshold = 50){
        $sql = "SELECT * FROM reactors 
            WHERE status IN ('Alertă', 'Mentenanță', 'Oprit') 
               OR current_efficiency < :threshold
            ORDER BY status ASC, current_efficiency ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':threshold', $efficiencyThreshold, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getActiveReactors(){
        return $this->getReactorsByStatus('Activ');
    }

    public function getReactorsInMaintenance(){
        return $this->getReactorsByStatus('Mentenanță');
    }

    public function getAlertReactors(){
        return $this->getReactorsByStatus('Alertă');
    }

    public function getStoppedReactors(){
        return $this->getReactorsByStatus('Oprit');
    }

    public function create(CreateReactorDTO $dto, float $soilStability, float $seismicRisk): Reactor {
        $stmt = $this->db->prepare("
            INSERT INTO reactors 
                (name, location_name, latitude, longitude, status,
                installed_power, current_efficiency, soil_stability,
                seismic_risk, last_maintenance)
            VALUES 
                (:name, :location_name, :latitude, :longitude, :status,
                :installed_power, :current_efficiency, :soil_stability,
                :seismic_risk, :last_maintenance)
            RETURNING *
        ");

        $stmt->execute([
            'name'               => $dto->name,
            'location_name'      => $dto->location_name,
            'latitude'           => $dto->latitude,
            'longitude'          => $dto->longitude,
            'status'             => $dto->status,
            'installed_power'    => $dto->installed_power,
            'current_efficiency' => $dto->current_efficiency,
            'soil_stability'     => $soilStability,
            'seismic_risk'       => $seismicRisk,
            'last_maintenance'   => $dto->last_maintenance,
        ]);

        return Reactor::fromArray($stmt->fetch(\PDO::FETCH_ASSOC));
    }

    public function update(int $id, UpdateReactorDTO $dto): ?Reactor {
        $stmt = $this->db->prepare("
            UPDATE reactors SET
                name               = :name,
                location_name      = :location_name,
                latitude           = :latitude,
                longitude          = :longitude,
                status             = :status,
                installed_power    = :installed_power,
                current_efficiency = :current_efficiency,
                last_maintenance   = :last_maintenance
            WHERE id = :id
            RETURNING *
        ");

        $stmt->execute([
            'id'                 => $id,
            'name'               => $dto->name,
            'location_name'      => $dto->location_name,
            'latitude'           => $dto->latitude,
            'longitude'          => $dto->longitude,
            'status'             => $dto->status,
            'installed_power'    => $dto->installed_power,
            'current_efficiency' => $dto->current_efficiency,
            'last_maintenance'   => $dto->last_maintenance,
        ]);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Reactor::fromArray($row) : null;
    }
}