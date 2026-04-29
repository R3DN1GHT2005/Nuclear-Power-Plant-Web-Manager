<?php
namespace App\Repositories;

use App\Core\DataBase;
use PDO;

class AlertRepository{
	public const ALLOWED_SEVERITIES = ['Critica', 'Avertisment', 'Info'];

	private $db;

	public function __construct(){
		$this->db = DataBase::getInstance()->getConnection();
	}

	public function getAllowedSeverities(){
		return self::ALLOWED_SEVERITIES;
	}

	public function isAllowedSeverity($severity){
		return in_array($severity, self::ALLOWED_SEVERITIES, true);
	}

	public function getAllAlerts(){
		$sql = "SELECT * FROM alerts ORDER BY created_at DESC";
		$stmt = $this->db->prepare($sql);
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getAlertById($id){
		$sql = "SELECT * FROM alerts WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetch();
	}

	public function getAlertsByReactor($reactorId){
		$sql = "SELECT * FROM alerts WHERE reactor_id = :reactor_id ORDER BY created_at DESC";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getAlertsBySeverity($severity, $reactorId = null){
		if (!$this->isAllowedSeverity($severity)) {
			return [];
		}

		$sql = "SELECT * FROM alerts WHERE severity = :severity";
		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY created_at DESC";

		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':severity', $severity, PDO::PARAM_STR);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getUnresolvedAlerts($reactorId = null){
		$sql = "SELECT * FROM alerts WHERE is_resolved = FALSE";
		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY severity DESC, created_at DESC";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getResolvedAlerts($reactorId = null){
		$sql = "SELECT * FROM alerts WHERE is_resolved = TRUE";
		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY resolved_at DESC NULLS LAST, created_at DESC";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getCriticalAlerts($reactorId = null){
		return $this->getAlertsBySeverity('Critica', $reactorId);
	}

	public function getAlertsWithReactor($reactorId = null){
		$sql = "SELECT a.*, r.name AS reactor_name, r.status AS reactor_status
			FROM alerts a
			JOIN reactors r ON a.reactor_id = r.id";

		if ($reactorId !== null) {
			$sql .= " WHERE a.reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY a.created_at DESC";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function createAlert($reactorId, $message, $severity, $resolvedBy = null){
		if (!$this->isAllowedSeverity($severity)) {
			return false;
		}

		$sql = "INSERT INTO alerts (reactor_id, message, severity, is_resolved, resolved_by)
			VALUES (:reactor_id, :message, :severity, FALSE, :resolved_by)
			RETURNING id";

		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		$stmt->bindParam(':message', $message);
		$stmt->bindParam(':severity', $severity, PDO::PARAM_STR);
		if ($resolvedBy === null) {
			$stmt->bindValue(':resolved_by', null, PDO::PARAM_NULL);
		} else {
			$stmt->bindParam(':resolved_by', $resolvedBy, PDO::PARAM_INT);
		}
		$stmt->execute();

		$result = $stmt->fetch();
		return $result ? $result['id'] : false;
	}

	public function resolveAlert($id, $resolvedBy = null){
		$sql = "UPDATE alerts
			SET is_resolved = TRUE,
				resolved_at = CURRENT_TIMESTAMP,
				resolved_by = :resolved_by
			WHERE id = :id";

		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		if ($resolvedBy === null) {
			$stmt->bindValue(':resolved_by', null, PDO::PARAM_NULL);
		} else {
			$stmt->bindParam(':resolved_by', $resolvedBy, PDO::PARAM_INT);
		}
		return $stmt->execute();
	}

	public function markAlertUnresolved($id){
		$sql = "UPDATE alerts
			SET is_resolved = FALSE,
				resolved_at = NULL,
				resolved_by = NULL
			WHERE id = :id";

		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function deleteAlert($id){
		$sql = "DELETE FROM alerts WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function getRecentAlerts($limit = 10, $reactorId = null){
		$sql = "SELECT * FROM alerts";
		if ($reactorId !== null) {
			$sql .= " WHERE reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY created_at DESC LIMIT :limit";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetchAll();
	}
}
