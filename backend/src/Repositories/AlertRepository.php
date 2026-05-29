<?php
namespace App\Repositories;

use App\Core\Database;
use App\DTOs\Request\alert\CreateAlertDTO;
use App\Models\Alert;
use PDO;

class AlertRepository{
	public const ALLOWED_SEVERITIES = ['Critica', 'Avertisment', 'Info'];

	private PDO $db;

	public function __construct(){
		$this->db = Database::getInstance()->getConnection();
	}

	public function getAllowedSeverities(): array {
		return self::ALLOWED_SEVERITIES;
	}

	public function isAllowedSeverity(string $severity): bool {
		return in_array($severity, self::ALLOWED_SEVERITIES, true);
	}

	public function getAllAlerts(): array {
		$stmt = $this->db->query("SELECT * FROM alerts ORDER BY created_at DESC");
		return array_map(fn($row) => Alert::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
	}

	public function getAlertById(int $id): ?Alert {
		$stmt = $this->db->prepare("SELECT * FROM alerts WHERE id = :id");
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
		return $row ? Alert::fromArray($row) : null;
	}

	public function getAlertsByReactor(int $reactorId): array {
		$stmt = $this->db->prepare("SELECT * FROM alerts WHERE reactor_id = :reactor_id ORDER BY created_at DESC");
		$stmt->bindParam(':reactor_id', $reactorId, PDO::PARAM_INT);
		$stmt->execute();
		return array_map(fn($row) => Alert::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
	}

	public function getAlertsBySeverity(string $severity, ?int $reactorId = null): array {
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
		return array_map(fn($row) => Alert::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
	}

	public function getUnresolvedAlerts(?int $reactorId = null): array {
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
		return array_map(fn($row) => Alert::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
	}

	public function getResolvedAlerts(?int $reactorId = null): array {
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
		return array_map(fn($row) => Alert::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
	}

	public function getCriticalAlerts(?int $reactorId = null): array {
		return $this->getAlertsBySeverity('Critica', $reactorId);
	}

	public function getAlertsWithReactor(?int $reactorId = null): array {
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
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function createAlert(CreateAlertDTO $dto): ?Alert {
		if (!$this->isAllowedSeverity($dto->severity)) {
			return null;
		}

		$stmt = $this->db->prepare("
			INSERT INTO alerts (reactor_id, message, severity, is_resolved)
			VALUES (:reactor_id, :message, :severity, FALSE)
			RETURNING *
		");

		$stmt->execute([
			'reactor_id' => $dto->reactor_id,
			'message' => $dto->message,
			'severity' => $dto->severity,
		]);

		return Alert::fromArray($stmt->fetch(PDO::FETCH_ASSOC));
	}

	public function resolveAlert(int $id, ?int $resolvedBy = null): ?Alert {
		$stmt = $this->db->prepare("
			UPDATE alerts
			SET is_resolved = TRUE,
				resolved_at = CURRENT_TIMESTAMP,
				resolved_by = :resolved_by
			WHERE id = :id
			RETURNING *
		");
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		$stmt->bindValue(':resolved_by', $resolvedBy, $resolvedBy === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
		return $row ? Alert::fromArray($row) : null;
	}

	public function markAlertUnresolved(int $id): ?Alert {
		$stmt = $this->db->prepare("
			UPDATE alerts
			SET is_resolved = FALSE,
				resolved_at = NULL,
				resolved_by = NULL
			WHERE id = :id
			RETURNING *
		");
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
		return $row ? Alert::fromArray($row) : null;
	}

	public function deleteAlert(int $id): bool {
		$stmt = $this->db->prepare("DELETE FROM alerts WHERE id = :id");
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->rowCount() > 0;
	}

	public function getRecentAlerts(int $limit = 10, ?int $reactorId = null): array {
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
		return array_map(fn($row) => Alert::fromArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
	}
}
