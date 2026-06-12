/*
 * backend/src/Repositories/Maintenance_logRepository.php
 * Repository for Maintenance_log — provides database query methods
 * for Maintenance_log CRUD operations via PDO. Used by the corresponding
 * Service layer to decouple data access from business logic.
 */
<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

class Maintenance_logRepository{
	public const ALLOWED_PRIORITIES = ['Urgenta', 'Planificata', 'Rutina'];

	private $db;

	public function __construct(){
		$this->db = Database::getInstance()->getConnection();
	}

	public function getAllowedPriorities(){
		return self::ALLOWED_PRIORITIES;
	}

	public function isAllowedPriority($priority){
		return in_array($priority, self::ALLOWED_PRIORITIES, true);
	}

	public function getAllLogs(){
		$sql = "SELECT * FROM maintenance_logs ORDER BY scheduled_date ASC NULLS LAST, id DESC";
		$stmt = $this->db->prepare($sql);
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getLogById($id){
		$sql = "SELECT * FROM maintenance_logs WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetch();
	}

	public function getLogsByReactor($reactorId){
		$sql = "SELECT * FROM maintenance_logs WHERE reactor_id = :reactor_id ORDER BY scheduled_date ASC NULLS LAST, id DESC";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getLogsByTechnician($technicianId){
		$sql = "SELECT * FROM maintenance_logs WHERE technician_id = :technician_id ORDER BY scheduled_date ASC NULLS LAST, id DESC";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':technician_id', $technicianId, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getLogsByPriority($priority, $reactorId = null){
		if (!$this->isAllowedPriority($priority)) {
			return [];
		}

		$sql = "SELECT * FROM maintenance_logs WHERE priority = :priority";
		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY scheduled_date ASC NULLS LAST, id DESC";

		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':priority', $priority, PDO::PARAM_STR);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getOpenLogs($reactorId = null){
		$sql = "SELECT * FROM maintenance_logs WHERE resolved_at IS NULL";
		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY priority ASC NULLS LAST, scheduled_date ASC NULLS LAST, id DESC";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getResolvedLogs($reactorId = null){
		$sql = "SELECT * FROM maintenance_logs WHERE resolved_at IS NOT NULL";
		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY resolved_at DESC";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getOverdueLogs($reactorId = null){
		$sql = "SELECT * FROM maintenance_logs
			WHERE resolved_at IS NULL
			  AND scheduled_date IS NOT NULL
			  AND scheduled_date < CURRENT_DATE";

		if ($reactorId !== null) {
			$sql .= " AND reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY scheduled_date ASC, priority ASC NULLS LAST";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function getLogsWithReactor($reactorId = null){
		$sql = "SELECT m.*, r.name AS reactor_name, r.status AS reactor_status
			FROM maintenance_logs m
			JOIN reactors r ON m.reactor_id = r.id";

		if ($reactorId !== null) {
			$sql .= " WHERE m.reactor_id = :reactor_id";
		}
		$sql .= " ORDER BY m.scheduled_date ASC NULLS LAST, m.id DESC";

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetchAll();
	}

	public function createMaintenanceLog($reactorId, $taskName, $technicianId = null, $scheduledDate = null, $completionPercent = 0, $priority = null){
		if ($priority !== null && !$this->isAllowedPriority($priority)) {
			return false;
		}

		$sql = "INSERT INTO maintenance_logs
			(reactor_id, task_name, technician_id, scheduled_date, completion_percent, priority)
			VALUES (:reactor_id, :task_name, :technician_id, :scheduled_date, :completion_percent, :priority)
			RETURNING id";

		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		$stmt->bindParam(':task_name', $taskName);
		if ($technicianId === null) {
			$stmt->bindValue(':technician_id', null, PDO::PARAM_NULL);
		} else {
			$stmt->bindParam(':technician_id', $technicianId, PDO::PARAM_INT);
		}
		if ($scheduledDate === null) {
			$stmt->bindValue(':scheduled_date', null, PDO::PARAM_NULL);
		} else {
			$stmt->bindParam(':scheduled_date', $scheduledDate);
		}
		$stmt->bindParam(':completion_percent', $completionPercent, PDO::PARAM_INT);
		if ($priority === null) {
			$stmt->bindValue(':priority', null, PDO::PARAM_NULL);
		} else {
			$stmt->bindParam(':priority', $priority, PDO::PARAM_STR);
		}

		$stmt->execute();
		$result = $stmt->fetch();
		return $result ? $result['id'] : false;
	}

	public function updateCompletionPercent($id, $completionPercent){
		$sql = "UPDATE maintenance_logs SET completion_percent = :completion_percent WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':completion_percent', $completionPercent, PDO::PARAM_INT);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function assignTechnician($id, $technicianId){
		$sql = "UPDATE maintenance_logs SET technician_id = :technician_id WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':technician_id', $technicianId, PDO::PARAM_INT);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function markResolved($id, $resolvedAt = null){
		$sql = "UPDATE maintenance_logs
			SET resolved_at = :resolved_at,
				completion_percent = CASE WHEN completion_percent < 100 THEN 100 ELSE completion_percent END
			WHERE id = :id";

		$stmt = $this->db->prepare($sql);
		if ($resolvedAt === null) {
			$stmt->bindValue(':resolved_at', date('Y-m-d H:i:s'));
		} else {
			$stmt->bindParam(':resolved_at', $resolvedAt);
		}
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function reopenLog($id){
		$sql = "UPDATE maintenance_logs SET resolved_at = NULL WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function deleteLog($id){
		$sql = "DELETE FROM maintenance_logs WHERE id = :id";
		$stmt = $this->db->prepare($sql);
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		return $stmt->execute();
	}

	public function getCompletionSummary($reactorId = null){
		$sql = "SELECT 
			COUNT(*) AS total_logs,
			SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) AS resolved_logs,
			AVG(completion_percent) AS average_completion
			FROM maintenance_logs";

		if ($reactorId !== null) {
			$sql .= " WHERE reactor_id = :reactor_id";
		}

		$stmt = $this->db->prepare($sql);
		if ($reactorId !== null) {
			$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		}
		$stmt->execute();
		return $stmt->fetch();
	}
}
