/*
 * dashboard-index-init.js — Index (admin landing) page bootstrap
 * Fetches all reactors, computes global metrics, renders the
 * reactor table sorted by urgency. No role guard — navbar.js
 * handles role-specific navigation.
 */

(async function initDashboardIndex() {
    document.documentElement.style.visibility = 'hidden';
    var meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }
    var me = await meRes.json();
    if (me.role !== 'admin') { window.location.href = 'login.html'; return; }
    document.documentElement.style.visibility = '';

    var reactors = await NuclearAPI.getReactors();
    if (!reactors.length) {
        document.getElementById('dashboard-metrics').innerHTML = '<p class="empty-msg">Nu s-au putut încărca datele reactoarelor.</p>';
        return;
    }

    /* ── Compute global metrics ─────────── */
    var total = reactors.length;
    var active = reactors.filter(function(r) { return /^activ$/i.test(r.status); }).length;
    var alertCount = reactors.filter(function(r) { return /^alertă$/i.test(r.status); }).length;
    var maintCount = reactors.filter(function(r) { return /^mentenanță$/i.test(r.status); }).length;
    var offCount = reactors.filter(function(r) { return /^oprit$/i.test(r.status); }).length;
    var avgEff = reactors.reduce(function(s, r) { return s + (parseFloat(r.current_efficiency) || 0); }, 0) / total;

    /* ── Render metric cards ────────────── */
    var effColor = avgEff >= 80 ? 'green' : avgEff >= 60 ? 'amber' : 'red';
    document.getElementById('dashboard-metrics').innerHTML =
        '<div class="metric-card green">' +
            '<div class="metric-label">Reactoare active</div>' +
            '<div class="metric-value">' + active + ' <span class="metric-sub">/ ' + total + '</span></div>' +
            '<div class="metric-sub">' + (offCount ? offCount + ' inactiv' + (offCount > 1 ? 'e' : '') + ' momentan' : 'Toate operaționale') + '</div>' +
        '</div>' +
        '<div class="metric-card ' + effColor + '">' +
            '<div class="metric-label">Eficiență medie</div>' +
            '<div class="metric-value">' + avgEff.toFixed(1) + ' <span class="metric-sub">%</span></div>' +
            '<div class="metric-sub">Media tuturor reactoarelor</div>' +
        '</div>' +
        '<div class="metric-card ' + (alertCount ? 'red' : 'green') + '">' +
            '<div class="metric-label">Alerte active</div>' +
            '<div class="metric-value">' + alertCount + '</div>' +
            '<div class="metric-sub">' + (alertCount ? alertCount + ' reactor' + (alertCount > 1 ? 'e' : '') + ' în alertă' : 'Nicio alertă activă') + '</div>' +
        '</div>' +
        '<div class="metric-card amber">' +
            '<div class="metric-label">Mentenanță</div>' +
            '<div class="metric-value">' + maintCount + '</div>' +
            '<div class="metric-sub">' + (maintCount ? maintCount + ' reactor' + (maintCount > 1 ? 'e' : '') + ' în mentenanță' : 'Nicio operațiune activă') + '</div>' +
        '</div>';

    /* ── Sort reactors by priority ──────── */
    var priority = { 'alertă': 0, 'mentenanță': 1, 'oprit': 2, 'in constructie': 3 };
    reactors.sort(function(a, b) {
        var pa = priority[a.status.toLowerCase()] !== undefined ? priority[a.status.toLowerCase()] : 4;
        var pb = priority[b.status.toLowerCase()] !== undefined ? priority[b.status.toLowerCase()] : 4;
        return pa - pb || (a.name || '').localeCompare(b.name || '');
    });

    /* ── Render reactor table ───────────── */
    var tbody = document.getElementById('dashboard-reactor-table');
    tbody.innerHTML = reactors.map(function(r) {
        var st = statusMeta(r.status);
        var temp = getTemperature(r);
        var tempDisplay = temp != null ? temp + '°' : '—';
        var tempDanger = temp > 350 ? 'critical-value' : '';
        var lastUpdate = getLastUpdate(r);
        var eff = Math.round(parseFloat(r.current_efficiency) || 0);

        return '<tr>' +
            '<td><strong>' + r.name + '</strong></td>' +
            '<td><div class="bar-cell"><div class="bar-bg"><div class="bar-fill" style="width:' + eff + '%;background:' + st.color + '"></div></div>' + eff + '%</div></td>' +
            '<td class="' + tempDanger + '">' + tempDisplay + '</td>' +
            '<td><span class="pill" style="background:' + st.color + '20;color:' + st.color + '">' + st.label + '</span></td>' +
            '<td class="muted-cell">' + lastUpdate + '</td>' +
        '</tr>';
    }).join('');
})();

function getTemperature(reactor) {
    if (!reactor.sensors || !reactor.sensors.length) return null;
    for (var i = 0; i < reactor.sensors.length; i++) {
        if (reactor.sensors[i].sensor_type && reactor.sensors[i].sensor_type.toLowerCase() === 'temperatura') {
            return parseFloat(reactor.sensors[i].current_value);
        }
    }
    return null;
}

function getLastUpdate(reactor) {
    var date = reactor.last_maintenance || reactor.updated_at;
    if (!date) return '—';
    var d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('ro-RO');
}
