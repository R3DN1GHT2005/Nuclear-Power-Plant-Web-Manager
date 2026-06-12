/*
 * frontend/public/assets/js/features/dashboard/dashboard-stats.js
 * Dashboard statistics — calls fetchPeriodStats from the shared
 * calculator and renders six stat cards: reading count, average value,
 * alerts, critical readings, sensor count, latest reading time.
 */
async function loadDashboardStats(reactorId) {
    var activeBtn = document.querySelector('#stats-period .period-btn.active');
    var days = parseInt(activeBtn ? activeBtn.dataset.days : '1', 10);

    var result = await fetchPeriodStats(reactorId, days);
    if (!result) return;

    var grid = document.getElementById('stats-grid');
    var pr = result.periodReadings;
    var pa = result.periodAlerts;
    var sensors = result.sensors;
    var avgVal = result.avgVal;
    var alertColor = result.alertColor;
    var criticalAlerts = result.criticalAlerts;
    var criticalReadings = result.criticalReadings;
    var latest = result.latest;

    grid.innerHTML =
        '<div class="stat-card">' +
            '<div class="stat-label">Citiri</div>' +
            '<div class="stat-value" style="color:var(--green)">' + pr.length + '</div>' +
            '<div class="stat-hint">În această perioadă</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Medie</div>' +
            '<div class="stat-value">' + (pr.length ? avgVal.toFixed(1) : '—') + '</div>' +
            '<div class="stat-hint">Media valorilor</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Alerte</div>' +
            '<div class="stat-value" style="color:' + alertColor + '">' + pa.length + '</div>' +
            '<div class="stat-hint">' + (criticalAlerts ? criticalAlerts + ' critice' : 'Nicio alertă') + '</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Citiri critice</div>' +
            '<div class="stat-value" style="color:' + (criticalReadings.length ? 'var(--red)' : 'var(--green)') + '">' + criticalReadings.length + '</div>' +
            '<div class="stat-hint">În afara limitelor</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Senzori</div>' +
            '<div class="stat-value" style="color:var(--purple)">' + sensors.length + '</div>' +
            '<div class="stat-hint">Activi pe reactor</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Ultima citire</div>' +
            '<div class="stat-value" style="font-size:14px">' + (latest ? formatTime(latest) : '—') + '</div>' +
            '<div class="stat-hint">Cea mai recentă</div>' +
        '</div>';
}
