<?php
namespace App\Repositories;
use App\Core\DataBase;
use PDO;

class SensorRepository{
    public const ALLOWED_SENSOR_TYPES = ['Temperatura', 'Presiune_Apa', 'Radiatii'];

    private $db;
    public function __construct(){
        $this->db=DataBase::getInstance()->getConnection();
    }
    public function getAllowedSensorTypes(){
        return self::ALLOWED_SENSOR_TYPES;
    }

    public function isAllowedSensorType($sensorType){
        return in_array($sensorType, self::ALLOWED_SENSOR_TYPES, true);
    }

   public function getAllSensorsFromReactor($reactorId){
        $sql="SELECT * FROM sensors WHERE reactor_id=:reactor_id ORDER BY last_update DESC";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':reactor_id',$reactorId,PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function getSensorById($id){
        $sql="SELECT * FROM sensors WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }
    public function updateSensorValue($id,$value){
        $sql="UPDATE sensors SET current_value=:value, last_update=NOW() WHERE id=:id";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':value',$value);
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        return $stmt->execute();
    }
    public function getSensorByTypeAndReactor($type,$reactorId){
        $sql="SELECT * FROM sensors WHERE sensor_type=:type AND reactor_id=:reactor_id LIMIT 1";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':type',$type,PDO::PARAM_STR);
        $stmt->bindParam(':reactor_id',$reactorId,PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }
    public function getOldestSensorsLastUpdated($reactorId,$limit=5){
        $sql="SELECT * FROM sensors WHERE reactor_id=:reactor_id ORDER BY last_update ASC LIMIT :limit";
        $stmt=$this->db->prepare($sql);
        $stmt->bindParam(':reactor_id',$reactorId,PDO::PARAM_INT);
        $stmt->bindParam(':limit',$limit,PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function createSensor($reactorId, $type, $value, $unit){
        if (!$this->isAllowedSensorType($type)) {
            return false;
        }

        $sql = "INSERT INTO sensors 
            (reactor_id, sensor_type, current_value, unit)
            VALUES (:rid, :type, :val, :unit)";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':rid', $reactorId, PDO::PARAM_INT);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':val', $value);
        $stmt->bindParam(':unit', $unit);
        return $stmt->execute();
    }
    public function deleteSensor($id){
    $sql = "DELETE FROM sensors WHERE id = :id";
    $stmt = $this->db->prepare($sql);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    return $stmt->execute();
    }
    public function getCriticalSensors($reactorId, $threshold){
        $sql = "SELECT * FROM sensors 
            WHERE reactor_id = :id AND current_value >= :threshold
            ORDER BY current_value DESC";
    
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $reactorId, PDO::PARAM_INT);
        $stmt->bindParam(':threshold', $threshold);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    public function getSensorsWithReactor($reactorId){
        $sql = "SELECT s.*, r.name, r.status 
            FROM sensors s
            JOIN reactors r ON s.reactor_id = r.id
            WHERE s.reactor_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $reactorId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getSensorsByType($type, $reactorId = null){
        if (!$this->isAllowedSensorType($type)) {
            return [];
        }

        $sql = "SELECT * FROM sensors WHERE sensor_type = :type";
        if ($reactorId !== null) {
            $sql .= " AND reactor_id = :reactor_id";
        }
        $sql .= " ORDER BY last_update DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        if ($reactorId !== null) {
            $stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getStaleSensors($reactorId, $minutes = 15){
        $sql = "SELECT * FROM sensors 
            WHERE reactor_id = :reactor_id 
            AND last_update < DATE_SUB(NOW(), INTERVAL :minutes MINUTE)
            ORDER BY last_update ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
        $stmt->bindParam(':minutes', $minutes, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getSensorCountsByType($reactorId = null){
        $sql = "SELECT sensor_type, COUNT(*) AS total FROM sensors";
        if ($reactorId !== null) {
            $sql .= " WHERE reactor_id = :reactor_id";
        }
        $sql .= " GROUP BY sensor_type ORDER BY sensor_type ASC";

        $stmt = $this->db->prepare($sql);
        if ($reactorId !== null) {
            $stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
}
}