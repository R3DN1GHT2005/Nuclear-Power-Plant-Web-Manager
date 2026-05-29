<?php

namespace App\Services;

use App\Core\Database;
use PDO;

class AnalyticsService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getKpi(): array {
        $reactors = $this->db->query("
            SELECT 
                COUNT(*) AS total,
                ROUND(AVG(current_efficiency), 1) AS avg_efficiency,
                ROUND(AVG(seismic_risk), 1) AS avg_risk
            FROM reactors
        ")->fetch(PDO::FETCH_ASSOC);

        return [
            'avg_efficiency' => (float) ($reactors['avg_efficiency'] ?? 0),
            'avg_risk' => (float) ($reactors['avg_risk'] ?? 0),
            'total_reactors' => (int) $reactors['total'],
        ];
    }

    public function getEfficiencyPerReactor(): array {
        $stmt = $this->db->query("SELECT id, name, current_efficiency, status FROM reactors ORDER BY name");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $r) {
            $result[] = [
                'reactor_id' => (int) $r['id'],
                'name' => $r['name'],
                'efficiency' => (float) $r['current_efficiency'],
                'status' => $r['status'],
            ];
        }
        return $result;
    }

    public function getEfficiencyTrend(int $days = 30): array {
        $stmt = $this->db->query("SELECT name, current_efficiency FROM reactors ORDER BY name");
        $reactors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $trend = [];
        $now = new \DateTime();

        for ($i = $days; $i >= 0; $i--) {
            $date = (clone $now)->modify("-{$i} days")->format('Y-m-d');
            $sum = 0;

            foreach ($reactors as $r) {
                $base = (float) $r['current_efficiency'];
                $variatie = rand(-5, 5);
                $sum += min(100, max(0, $base + $variatie));
            }

            $avg = count($reactors) > 0 ? round($sum / count($reactors), 1) : 0;
            $trend[] = ['date' => $date, 'avg_efficiency' => $avg];
        }

        return $trend;
    }

    public function getComparison(): array {
        $stmt = $this->db->query("
            SELECT 
                r.id, r.name, r.current_efficiency, r.seismic_risk,
                r.installed_power, r.status
            FROM reactors r
            ORDER BY r.name
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $r) {
            $result[] = [
                'reactor_id' => (int) $r['id'],
                'name' => $r['name'],
                'efficiency' => (float) $r['current_efficiency'],
                'risk' => (float) $r['seismic_risk'],
                'status' => $r['status'],
                'installed_power' => (float) $r['installed_power'],
            ];
        }
        return $result;
    }

    public function getRiskMatrix(): array {
        $stmt = $this->db->query("SELECT id, name, seismic_risk, soil_stability FROM reactors");
        $reactors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $probLabels = ['Rar', 'Putin probabil', 'Posibil', 'Probabil', 'Cert'];
        $impactLabels = ['Neglijabil', 'Minor', 'Moderat', 'Major', 'Critic'];

        $result = [];
        foreach ($reactors as $r) {
            $probIndex = min(4, (int) (($r['seismic_risk'] / 100) * 5));
            $impactIndex = min(4, (int) ((1 - $r['soil_stability']) * 5));

            $result[] = [
                'reactor_id' => (int) $r['id'],
                'name' => $r['name'],
                'probability' => $probLabels[$probIndex],
                'impact' => $impactLabels[$impactIndex],
            ];
        }
        return $result;
    }

    public function getWear(): array {
        $stmt = $this->db->query("SELECT id, name, current_efficiency, status FROM reactors ORDER BY name");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $r) {
            $wear = round((1 - (float) $r['current_efficiency'] / 100) * 100, 1);

            $result[] = [
                'reactor_id' => (int) $r['id'],
                'name' => $r['name'],
                'status' => $r['status'],
                'wear_percent' => $wear,
                'efficiency' => (float) $r['current_efficiency'],
            ];
        }
        return $result;
    }
}
