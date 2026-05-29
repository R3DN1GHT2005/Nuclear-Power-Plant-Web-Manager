<?php

declare(strict_types=1);

require_once __DIR__ . '/../backend/vendor/autoload.php';

use App\Core\Database;

function formatTimestamp(?string $timestamp = null): string
{
    $dateTime = $timestamp ? new DateTimeImmutable($timestamp) : new DateTimeImmutable('now');
    return $dateTime->format('Y-m-d H:i:s');
}

function normalizeRange(?float $minSafeValue, ?float $maxSafeValue): array
{
    $min = $minSafeValue ?? 0.0;
    $max = $maxSafeValue ?? 100.0;

    if ($min > $max) {
        [$min, $max] = [$max, $min];
    }

    return [$min, $max];
}

function generateSimulatedValue(?float $currentValue, ?float $minSafeValue, ?float $maxSafeValue): float
{
    [$min, $max] = normalizeRange($minSafeValue, $maxSafeValue);
    $range = max($max - $min, 1.0);
    $baseline = $currentValue ?? ($min + ($range / 2.0));

    $drift = $range * (mt_rand(5, 18) / 100.0);
    $direction = mt_rand(0, 1) === 1 ? 1 : -1;
    $nextValue = $baseline + ($direction * $drift);

    // Small chance to cross the safe limits and simulate alert conditions.
    if (mt_rand(1, 100) <= 12) {
        $overshoot = $range * (mt_rand(4, 14) / 100.0);
        $nextValue = mt_rand(0, 1) === 1 ? $max + $overshoot : $min - $overshoot;
    }

    $precision = max(0, min(4, (int) round(log10($range + 1))));

    return round($nextValue, $precision);
}

try {
    $db = Database::getInstance()->getConnection();

    $db->beginTransaction();

    $sensorStmt = $db->query('SELECT id, current_value, min_safe_value, max_safe_value FROM sensors ORDER BY id ASC');
    $sensors = $sensorStmt->fetchAll(PDO::FETCH_ASSOC);

    $insertReadingStmt = $db->prepare(
        'INSERT INTO sensor_readings (sensor_id, recorded_value, recorded_at) VALUES (:sensor_id, :recorded_value, :recorded_at)'
    );

    $updateSensorStmt = $db->prepare(
        'UPDATE sensors SET current_value = :current_value, last_update = :last_update WHERE id = :id'
    );

    $now = formatTimestamp();
    $processedCount = 0;

    foreach ($sensors as $sensor) {
        $sensorId = (int) $sensor['id'];
        $currentValue = isset($sensor['current_value']) ? (float) $sensor['current_value'] : null;
        $minSafeValue = $sensor['min_safe_value'] !== null ? (float) $sensor['min_safe_value'] : null;
        $maxSafeValue = $sensor['max_safe_value'] !== null ? (float) $sensor['max_safe_value'] : null;

        $simulatedValue = generateSimulatedValue($currentValue, $minSafeValue, $maxSafeValue);

        $insertReadingStmt->execute([
            'sensor_id' => $sensorId,
            'recorded_value' => $simulatedValue,
            'recorded_at' => $now,
        ]);

        $updateSensorStmt->execute([
            'current_value' => $simulatedValue,
            'last_update' => $now,
            'id' => $sensorId,
        ]);

        $processedCount++;
    }

    $db->commit();

    echo sprintf("S-au simulat date pentru %d senzori la ora %s\n", $processedCount, $now);
    exit(0);
} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }

    fwrite(STDERR, sprintf("Eroare la simularea senzorilor: %s\n", $e->getMessage()));
    exit(1);
}
