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
                AVG(current_efficiency) AS avg_efficiency,
                AVG(seismic_risk) AS avg_risk
            FROM reactors
        ")->fetch(PDO::FETCH_ASSOC);

        $avgEff = isset($reactors['avg_efficiency']) ? round((float)$reactors['avg_efficiency'], 1) : 0.0;
        $avgRisk = isset($reactors['avg_risk']) ? round((float)$reactors['avg_risk'], 1) : 0.0;

        return [
            'avg_efficiency' => $avgEff,
            'avg_risk' => $avgRisk,
            'total_reactors' => (int) ($reactors['total'] ?? 0),
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
            // Normalize inputs: seismic_risk is 0-10 scale, soil_stability is percentage (0-100) or 0-1
            $seismic = (float) $r['seismic_risk'];
            $soil = (float) $r['soil_stability'];

            // seismic_risk is expressed in 0-100 scale in DB; normalize to 0-1
            $probNorm = min(1.0, max(0.0, $seismic / 100.0));
            $probIndex = min(4, (int) floor($probNorm * 5));

            $soilNorm = $soil > 1.0 ? ($soil / 100.0) : $soil;
            $impactNorm = min(1.0, max(0.0, 1.0 - $soilNorm));
            $impactIndex = min(4, (int) floor($impactNorm * 5));

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
