/*
 * frontend/public/assets/js/features/dashboard/dashboard-kpis.js
 * Dashboard KPI renderer — displays reactor metrics (name, status,
 * power, efficiency, soil stability, location, type) and live sensor
 * data cards on the technician/manager dashboard.
 */
function renderKpis(r) {
    var st = statusMeta(r.status);
    document.getElementById('tech-kpis').innerHTML =
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
            '<div class="metric-label">Amplasare</div>' +
            '<div class="metric-value" style="font-size:13px">' + (r.location_name || '—') + '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Tip</div>' +
            '<div class="metric-value" style="font-size:13px">' + (r.reactor_type || '—') + '</div>' +
        '</div>';
}

async function loadSensors(reactorId) {
    var sub  = document.getElementById('sensors-sub');
    var grid = document.getElementById('sensor-grid');
    try {
        var res = await authFetch('/reactors/' + reactorId + '/sensors', { method: 'GET' });
        if (!res.ok) { sub.textContent = 'Eroare la încărcare'; return; }

        var payload = await res.json();
        var sensors = Array.isArray(payload) ? payload : (payload.data || []);

        if (!sensors.length) {
            sub.textContent = 'Niciun senzor';
            grid.innerHTML  = '<p class="empty-msg">Nicio citire disponibilă.</p>';
            return;
        }

        sub.textContent = sensors.length + ' senzori · date live';

        grid.innerHTML = sensors.map(function(s) {
            var v  = parseFloat(s.current_value);
            var mn = parseFloat(s.min_safe_value);
            var mx = parseFloat(s.max_safe_value);
            var cls = '';
            if (!isNaN(v) && !isNaN(mn) && !isNaN(mx)) {
                if (v < mn || v > mx)                    cls = 'danger';
                else if (v < mn * 1.1 || v > mx * 0.9)  cls = 'warning';
            }
            return '<div class="sensor-card ' + cls + '">' +
                '<div class="sensor-type">' + (s.sensor_type || '—') + '</div>' +
                '<div class="sensor-value">' + (s.current_value != null ? s.current_value : '—') + ' <span class="sensor-unit">' + (s.unit || '') + '</span></div>' +
                '<div class="sensor-range">Limite: ' + mn + ' — ' + mx + ' ' + (s.unit || '') + '</div>' +
                '<div class="sensor-update">' + (s.last_update ? new Date(s.last_update).toLocaleString('ro-RO') : '') + '</div>' +
            '</div>';
        }).join('');
    } catch(e) {
        sub.textContent = 'Eroare de rețea';
        grid.innerHTML  = '<p class="empty-msg">Nu s-au putut încărca senzorii.</p>';
    }
}
