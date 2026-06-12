/*
 * frontend/public/assets/js/features/shared/stats-calculator.js
 * Shared period-based statistics calculator — fetches readings, alerts,
 * and sensors in parallel, filters by a configurable time window,
 * computes averages, identifies critical readings/alerts, and returns
 * a structured result object for callers to render.
 */
async function fetchPeriodStats(reactorId, days) {
    var sub = document.getElementById('stats-sub');
    var grid = document.getElementById('stats-grid');

    grid.innerHTML = '<p class="empty-msg">Se calculează...</p>';

    try {
        var [readingsRes, alertsRes, sensorsRes] = await Promise.all([
            authFetch('/sensors/readings/all',                { method: 'GET' }),
            authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' }),
            authFetch('/reactors/' + reactorId + '/sensors',  { method: 'GET' })
        ]);

        var allReadings = readingsRes.ok ? (await readingsRes.json()) : [];
        var allAlerts   = alertsRes.ok  ? (await alertsRes.json())   : [];
        var sensorsData = sensorsRes.ok ? (await sensorsRes.json())  : [];

        var readings = Array.isArray(allReadings) ? allReadings : (allReadings.data || []);
        var sensors  = Array.isArray(sensorsData) ? sensorsData : (sensorsData.data || []);
        var alerts   = Array.isArray(allAlerts)   ? allAlerts   : (allAlerts.data  || []);

        var cutoff         = Date.now() - days * 86400000;
        var periodReadings = readings.filter(function(r) { return new Date(r.recorded_at).getTime() >= cutoff; });
        var periodAlerts   = alerts.filter(function(a)  { return new Date(a.created_at).getTime()  >= cutoff; });

        var sensorMap = {};
        sensors.forEach(function(s) { sensorMap[s.id] = s; });

        var criticalReadings = periodReadings.filter(function(r) {
            var s = sensorMap[r.sensor_id];
            if (!s) return false;
            var v  = parseFloat(r.recorded_value);
            var mn = parseFloat(s.min_safe_value != null ? s.min_safe_value : -Infinity);
            var mx = parseFloat(s.max_safe_value != null ? s.max_safe_value :  Infinity);
            return isFinite(v) && (v < mn || v > mx);
        });

        var avgVal = periodReadings.length
            ? periodReadings.reduce(function(sum, r) { return sum + parseFloat(r.recorded_value || 0); }, 0) / periodReadings.length
            : 0;

        var times  = periodReadings.map(function(r) { return r.recorded_at ? new Date(r.recorded_at) : null; }).filter(Boolean);
        var latest = times.length ? times.sort(function(a, b) { return b - a; })[0] : null;

        var criticalAlerts = periodAlerts.filter(function(a) { return a.severity === 'critical'; }).length;
        var alertColor     = periodAlerts.length === 0 ? 'var(--green)'
            : periodAlerts.length > 3 ? 'var(--red)' : 'var(--amber)';

        if (sub) sub.textContent = days === 1 ? 'Ultimele 24 ore' : 'Ultimele ' + days + ' zile';

        return {
            readings: readings,
            sensors: sensors,
            alerts: alerts,
            periodReadings: periodReadings,
            periodAlerts: periodAlerts,
            criticalReadings: criticalReadings,
            avgVal: avgVal,
            latest: latest,
            criticalAlerts: criticalAlerts,
            alertColor: alertColor,
            sensorMap: sensorMap
        };
    } catch (e) {
        grid.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
        return null;
    }
}
