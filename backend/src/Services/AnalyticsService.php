<?php

/*
 * backend/src/Services/AnalyticsService.php
 * AnalyticsService — implements business logic for analytics
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */


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
        try {
            $stmt = $this->db->prepare("\n                SELECT\n                    DATE(recorded_at) AS date,\n                    ROUND(AVG(efficiency)::numeric, 1) AS avg_efficiency\n                FROM efficiency_log\n                WHERE recorded_at >= NOW() - (:days || ' days')::interval\n                GROUP BY DATE(recorded_at)\n                ORDER BY DATE(recorded_at) ASC\n            ");
            $stmt->execute(['days' => $days]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                return $this->buildContinuousTrendFromLogs($days, $rows);
            }
        } catch (\Throwable $throwable) {
            

        }

        return $this->buildFallbackTrendFromCurrentState($days);
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
            

            $seismic = (float) $r['seismic_risk'];
            $soil = (float) $r['soil_stability'];

            

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

    private function buildFallbackTrendFromCurrentState(int $days): array {
        $stmt = $this->db->query("SELECT current_efficiency FROM reactors");
        $reactors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($reactors) === 0) {
            return [];
        }

        $average = array_reduce($reactors, static function (float $carry, array $row): float {
            return $carry + (float) ($row['current_efficiency'] ?? 0);
        }, 0.0) / count($reactors);

        return [[
            'date' => (new \DateTimeImmutable())->format('Y-m-d'),
            'avg_efficiency' => round($average, 1),
        ]];
    }

    private function buildContinuousTrendFromLogs(int $days, array $rows): array {
        $logMap = [];
        foreach ($rows as $row) {
            $logMap[(string) $row['date']] = round((float) $row['avg_efficiency'], 1);
        }

        $baseline = $this->getCurrentAverageEfficiency();
        $trend = [];
        $carry = null;
        $today = new \DateTimeImmutable('today');

        for ($offset = $days; $offset >= 0; $offset--) {
            $date = $today->modify("-{$offset} days")->format('Y-m-d');

            if (array_key_exists($date, $logMap)) {
                $carry = $logMap[$date];
            } elseif ($carry === null) {
                $carry = $baseline;
            }

            $trend[] = [
                'date' => $date,
                'avg_efficiency' => round((float) $carry, 1),
            ];
        }

        return $trend;
    }

    private function getCurrentAverageEfficiency(): float {
        $row = $this->db->query("SELECT COALESCE(AVG(current_efficiency), 0) AS avg_efficiency FROM reactors")->fetch(PDO::FETCH_ASSOC);
        return round((float) ($row['avg_efficiency'] ?? 0), 1);
    }
}
