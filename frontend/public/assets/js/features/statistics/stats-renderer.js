/*
 * stats-renderer.js — Statistics page rendering functions
 * Handles KPI grid, period stats grid (9 cards),
 * efficiency comparison, and reactor specs.
 * Depends on statusMeta from utils/status.js and
 * fetchPeriodStats from features/shared/stats-calculator.js.
 */

function renderReactorInfo(r) {
    var st = statusMeta(r.status);
    document.getElementById('stats-kpis').innerHTML =
        '<div class="metric-item">' +
            '<div class="metric-label">Reactor</div>' +
            '<div class="metric-value" style="font-size:15px">' + (r.name || '—') + '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Status</div>' +
            '<div class="metric-value" style="color:' + st.color + ';font-size:15px">' +
                '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + st.color + ';margin-right:5px;vertical-align:middle;animation:statusPulse 2s ease-in-out infinite"></span>' + st.label +
            '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Putere</div>' +
            '<div class="metric-value">' + (r.installed_power || '—') + ' <span class="metric-unit">MW</span></div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Eficiență</div>' +
            '<div class="metric-value">' + (r.current_efficiency != null ? r.current_efficiency + '<span class="metric-unit">%</span>' : '—') + '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Stab. sol</div>' +
            '<div class="metric-value">' + (r.soil_stability != null ? r.soil_stability.toFixed(2) : '—') + '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Locație</div>' +
            '<div class="metric-value" style="font-size:13px">' + (r.location_name || '—') + '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Tip</div>' +
            '<div class="metric-value" style="font-size:13px">' + (r.reactor_type || '—') + '</div>' +
        '</div>';
}

async function loadStatsGrid(reactorId) {
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
            '<div class="stat-label">Citiri totale</div>' +
            '<div class="stat-value" style="color:var(--green)">' + pr.length + '</div>' +
            '<div class="stat-hint">În această perioadă</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Medie valori</div>' +
            '<div class="stat-value">' + (pr.length ? avgVal.toFixed(2) : '—') + '</div>' +
            '<div class="stat-hint">Perioadă selectată</div>' +
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
            '<div class="stat-label">Senzori activi</div>' +
            '<div class="stat-value" style="color:var(--purple)">' + sensors.length + '</div>' +
            '<div class="stat-hint">Pe acest reactor</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Ultima citire</div>' +
            '<div class="stat-value" style="font-size:14px">' + (latest ? formatTime(latest) : '—') + '</div>' +
            '<div class="stat-hint">Cea mai recentă</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Valoare maximă</div>' +
            '<div class="stat-value">' + (pr.length ? Math.max.apply(null, pr.map(function(r) { return parseFloat(r.recorded_value || 0); })).toFixed(1) : '—') + '</div>' +
            '<div class="stat-hint">În această perioadă</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Valoare minimă</div>' +
            '<div class="stat-value">' + (pr.length ? Math.min.apply(null, pr.map(function(r) { return parseFloat(r.recorded_value || 0); })).toFixed(1) : '—') + '</div>' +
            '<div class="stat-hint">În această perioadă</div>' +
        '</div>' +
        '<div class="stat-card">' +
            '<div class="stat-label">Abatere std</div>' +
            '<div class="stat-value">' + (pr.length > 1 ? Math.sqrt(pr.reduce(function(sq, r) { return sq + Math.pow(parseFloat(r.recorded_value || 0) - avgVal, 2); }, 0) / pr.length).toFixed(2) : '—') + '</div>' +
            '<div class="stat-hint">Deviație standard</div>' +
        '</div>';
}

async function loadEfficiencyComparison(ownReactorId) {
    var list = document.getElementById('efficiency-list');
    try {
        var res = await authFetch('/reports/efficiency', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare.</p>'; return; }
        var reactors = await res.json();

        if (!reactors.length) { list.innerHTML = '<p class="empty-msg">Nicio dată disponibilă.</p>'; return; }

        var maxEff = Math.max.apply(null, reactors.map(function(r) { return r.efficiency || 0; }), 1);

        list.innerHTML = reactors.map(function(r) {
            var eff = r.efficiency || 0;
            var pct = Math.round((eff / maxEff) * 100);
            var cls = eff >= 80 ? 'high' : eff >= 50 ? 'medium' : 'low';
            var isOwn = r.reactor_id === ownReactorId || r.id === ownReactorId;
            return '<div class="eff-item"' + (isOwn ? ' style="background:var(--surface-2);font-weight:600"' : '') + '>' +
                '<span class="eff-name">' + (r.name || 'Reactor #' + (r.reactor_id || r.id)) + (isOwn ? ' ← tu' : '') + '</span>' +
                '<div class="eff-bar-track"><div class="eff-bar-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
                '<span class="eff-pct">' + eff + '%</span>' +
            '</div>';
        }).join('');
    } catch(e) {
        list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

function loadSpecs(r) {
    var sub = document.getElementById('specs-sub');
    if (sub) sub.textContent = r.location_name || '';
    document.getElementById('specs-grid').innerHTML =
        '<div class="stats-grid" style="grid-template-columns:1fr">' +
            '<div class="stat-card"><div class="stat-label">Tip reactor</div><div class="stat-value" style="font-size:14px">' + (r.reactor_type || '—') + '</div></div>' +
            '<div class="stat-card"><div class="stat-label">Risc seismic</div><div class="stat-value" style="font-size:14px">' + (r.seismic_risk != null ? r.seismic_risk.toFixed(2) : '—') + '</div></div>' +
            '<div class="stat-card"><div class="stat-label">Altitudine</div><div class="stat-value" style="font-size:14px">' + (r.elevation_meters != null ? r.elevation_meters + ' m' : '—') + '</div></div>' +
            '<div class="stat-card"><div class="stat-label">Distanță oraș</div><div class="stat-value" style="font-size:14px">' + (r.distance_to_nearest_city_km != null ? r.distance_to_nearest_city_km + ' km' : '—') + '</div></div>' +
            '<div class="stat-card"><div class="stat-label">Sursă apă</div><div class="stat-value" style="font-size:14px">' + (r.cooling_water_source || '—') + '</div></div>' +
        '</div>';
}
