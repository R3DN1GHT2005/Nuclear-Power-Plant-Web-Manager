<?php

<<<<<<< Updated upstream
class Sensor{
    private int $id;
    private int $reactor_id;
    private string $sensor_type;
    private float $current_value;
    private string $unit;
    private \DateTime $last_update;

    public function __construct(int $id,int $reactor_id,string $sensor_type,float $current_value,string $unit,\DateTime $last_update){
        $this->id=$id;
        $this->reactor_id=$reactor_id;
        $this->sensor_type=$sensor_type;
        $this->current_value=$current_value;
        $this->unit=$unit;
        $this->last_update=$last_update;
    }
    
    public function getId() :  int{
        return $this->id;
    }
    public function getReactorId() :  int{
        return $this->reactor_id;
    }
    public function getSensorType() :  string{
        return $this->sensor_type;
    }
    public function getCurrentValue() :  float{
        return $this->current_value;
    }
    public function  getUnit() :  string{
        return $this->unit;
    }
    public function getLastUpdate() :  \DateTime{
        return $this->last_update;
    }
    public function setId(int $id) : void{
        $this->id=$id;
    }

    public function setReactorId(int $reactor_id) : void{
        $this->reactor_id=$reactor_id;
    }

    public function setSensorType(string $sensor_type) : void{
        $this->sensor_type=$sensor_type;
    }

    public function setCurrentValue(float $current_value) : void{
        $this->current_value=$current_value;
    }

    public function setUnit(string $unit) : void{
        $this->unit=$unit;
    }

    public function setLastUpdate(\DateTime $last_update) : void{
        $this->last_update=$last_update;
    }


}
=======
class Sensor
{
    private int $id;
    private string $name;
    private string $type;
    private string $location;
    private string $status;
    private string $created_at;

    public function __construct(int $id, string $name, string $type, string $location, string $status, string $created_at)
    {
        $this->id = $id;
        $this->name = $name;
        $this->type = $type;
        $this->location = $location;
        $this->status = $status;
        $this->created_at = $created_at;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getCreatedAt(): string
    {
        return $this->created_at;
    }
}

>>>>>>> Stashed changes
