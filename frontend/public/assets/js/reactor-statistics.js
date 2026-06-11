(async function initStats() {
    const meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }
    const me = await meRes.json();
    if (me.role !== 'manager') { window.location.href = 'dashboard.html'; return; }

    const reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) { document.getElementById('stats-kpis').innerHTML = '<p class="empty-msg">Nu ești asignat la niciun reactor.</p>'; return; }

    const reactor = await reactorRes.json();
    const reactorId = reactor.id;

    const alertContainer = document.getElementById('alerts-container');
    if (alertContainer) alertContainer.dataset.reactorId = reactorId;

    renderReactorInfo(reactor);
    loadStats(reactorId);
    loadEfficiencyComparison(reactorId);
    loadSpecs(reactor);
    loadAlertHistory(reactorId);

    document.getElementById('stats-period').addEventListener('click', e => {
        const btn = e.target.closest('.period-btn');
        if (!btn) return;
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadStats(reactorId);
    });
})();

function renderReactorInfo(r) {
    const st = statusMeta(r.status);
    document.getElementById('stats-kpis').innerHTML = `
        <div class="metric-item">
            <div class="metric-label">Reactor</div>
            <div class="metric-value" style="font-size:15px">${r.name || '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Status</div>
            <div class="metric-value" style="color:${st.color};font-size:15px">
                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${st.color};margin-right:5px;vertical-align:middle;animation:statusPulse 2s ease-in-out infinite"></span>${st.label}
            </div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Putere</div>
            <div class="metric-value">${r.installed_power || '—'} <span class="metric-unit">MW</span></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Eficiență</div>
            <div class="metric-value">${r.current_efficiency != null ? r.current_efficiency + '<span class="metric-unit">%</span>' : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Stab. sol</div>
            <div class="metric-value">${r.soil_stability != null ? r.soil_stability.toFixed(2) : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Locație</div>
            <div class="metric-value" style="font-size:13px">${r.location_name || '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Tip</div>
            <div class="metric-value" style="font-size:13px">${r.reactor_type || '—'}</div>
        </div>
    `;
}

function statusMeta(s) {
    const map = {
        'activ':          { color: 'var(--green)', label: 'Activ' },
        'mentenanță':     { color: 'var(--amber)', label: 'Mentenanță' },
        'oprit':          { color: 'var(--text-3)', label: 'Oprit' },
        'alertă':         { color: 'var(--red)',   label: 'Alertă' },
        'in constructie': { color: 'var(--blue)',  label: 'În construcție' }
    };
    return map[(s || '').toLowerCase()] || { color: 'var(--text-2)', label: s || '—' };
}

async function loadStats(reactorId) {
    const activeBtn = document.querySelector('#stats-period .period-btn.active');
    const days      = parseInt(activeBtn ? activeBtn.dataset.days : '1', 10);
    const sub       = document.getElementById('stats-sub');
    const grid      = document.getElementById('stats-grid');

    grid.innerHTML = '<p class="empty-msg">Se calculează...</p>';
    if (sub) sub.textContent = days === 1 ? 'Ultimele 24 ore' : 'Ultimele ' + days + ' zile';

    try {
        const [readingsRes, alertsRes, sensorsRes] = await Promise.all([
            authFetch('/sensors/readings/all',               { method: 'GET' }),
            authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' }),
            authFetch('/reactors/' + reactorId + '/sensors',  { method: 'GET' })
        ]);

        const allReadings = readingsRes.ok ? (await readingsRes.json()) : [];
        const allAlerts   = alertsRes.ok  ? (await alertsRes.json())   : [];
        const sensorsData = sensorsRes.ok ? (await sensorsRes.json())  : [];

        const readings = Array.isArray(allReadings) ? allReadings : (allReadings.data || []);
        const sensors  = Array.isArray(sensorsData) ? sensorsData : (sensorsData.data || []);
        const alerts   = Array.isArray(allAlerts)   ? allAlerts   : (allAlerts.data  || []);

        const cutoff         = Date.now() - days * 86400000;
        const periodReadings = readings.filter(r => new Date(r.recorded_at).getTime() >= cutoff);
        const periodAlerts   = alerts.filter(a   => new Date(a.created_at).getTime()  >= cutoff);

        const criticalReadings = periodReadings.filter(r => {
            const s = sensors.find(s => s.id === r.sensor_id);
            if (!s) return false;
            const v  = parseFloat(r.recorded_value);
            const mn = parseFloat(s.min_safe_value ?? -Infinity);
            const mx = parseFloat(s.max_safe_value ??  Infinity);
            return isFinite(v) && (v < mn || v > mx);
        });

        const avgVal = periodReadings.length
            ? periodReadings.reduce((sum, r) => sum + parseFloat(r.recorded_value || 0), 0) / periodReadings.length
            : 0;

        const times  = periodReadings.map(r => r.recorded_at ? new Date(r.recorded_at) : null).filter(Boolean);
        const latest = times.length ? times.sort((a, b) => b - a)[0] : null;
        const criticalAlerts = periodAlerts.filter(a => a.severity === 'critical').length;
        const alertColor     = periodAlerts.length === 0 ? 'var(--green)' : periodAlerts.length > 3 ? 'var(--red)' : 'var(--amber)';

        grid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Citiri totale</div>
                <div class="stat-value" style="color:var(--green)">${periodReadings.length}</div>
                <div class="stat-hint">În această perioadă</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Medie valori</div>
                <div class="stat-value">${periodReadings.length ? avgVal.toFixed(2) : '—'}</div>
                <div class="stat-hint">Perioadă selectată</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Alerte</div>
                <div class="stat-value" style="color:${alertColor}">${periodAlerts.length}</div>
                <div class="stat-hint">${criticalAlerts ? criticalAlerts + ' critice' : 'Nicio alertă'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Citiri critice</div>
                <div class="stat-value" style="color:${criticalReadings.length ? 'var(--red)' : 'var(--green)'}">${criticalReadings.length}</div>
                <div class="stat-hint">În afara limitelor</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Senzori activi</div>
                <div class="stat-value" style="color:var(--purple)">${sensors.length}</div>
                <div class="stat-hint">Pe acest reactor</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ultima citire</div>
                <div class="stat-value" style="font-size:14px">${latest ? formatTime(latest) : '—'}</div>
                <div class="stat-hint">Cea mai recentă</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Valoare maximă</div>
                <div class="stat-value">${periodReadings.length ? Math.max(...periodReadings.map(r => parseFloat(r.recorded_value || 0))).toFixed(1) : '—'}</div>
                <div class="stat-hint">În această perioadă</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Valoare minimă</div>
                <div class="stat-value">${periodReadings.length ? Math.min(...periodReadings.map(r => parseFloat(r.recorded_value || 0))).toFixed(1) : '—'}</div>
                <div class="stat-hint">În această perioadă</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Abatere std</div>
                <div class="stat-value">${periodReadings.length > 1 ? Math.sqrt(periodReadings.reduce((sq, r) => sq + Math.pow(parseFloat(r.recorded_value || 0) - avgVal, 2), 0) / periodReadings.length).toFixed(2) : '—'}</div>
                <div class="stat-hint">Deviație standard</div>
            </div>`;
    } catch {
        grid.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

function formatTime(d) {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

async function loadEfficiencyComparison(ownReactorId) {
    const list = document.getElementById('efficiency-list');
    try {
        const res = await authFetch('/reports/efficiency', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare.</p>'; return; }
        const reactors = await res.json();

        if (!reactors.length) { list.innerHTML = '<p class="empty-msg">Nicio dată disponibilă.</p>'; return; }

        const maxEff = Math.max(...reactors.map(r => r.efficiency || 0), 1);

        list.innerHTML = reactors.map(r => {
            const eff = r.efficiency || 0;
            const pct = Math.round((eff / maxEff) * 100);
            const cls = eff >= 80 ? 'high' : eff >= 50 ? 'medium' : 'low';
            const isOwn = r.reactor_id === ownReactorId || r.id === ownReactorId;
            return '<div class="eff-item"' + (isOwn ? ' style="background:var(--surface-2);font-weight:600"' : '') + '>' +
                '<span class="eff-name">' + (r.name || 'Reactor #' + (r.reactor_id || r.id)) + (isOwn ? ' ← tu' : '') + '</span>' +
                '<div class="eff-bar-track"><div class="eff-bar-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
                '<span class="eff-pct">' + eff + '%</span>' +
                '</div>';
        }).join('');
    } catch { list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}

function loadSpecs(r) {
    const sub = document.getElementById('specs-sub');
    if (sub) sub.textContent = r.location_name || '';
    document.getElementById('specs-grid').innerHTML = `
        <div class="stats-grid" style="grid-template-columns:1fr">
            <div class="stat-card"><div class="stat-label">Tip reactor</div><div class="stat-value" style="font-size:14px">${r.reactor_type || '—'}</div></div>
            <div class="stat-card"><div class="stat-label">Risc seismic</div><div class="stat-value" style="font-size:14px">${r.seismic_risk != null ? r.seismic_risk.toFixed(2) : '—'}</div></div>
            <div class="stat-card"><div class="stat-label">Altitudine</div><div class="stat-value" style="font-size:14px">${r.elevation_meters != null ? r.elevation_meters + ' m' : '—'}</div></div>
            <div class="stat-card"><div class="stat-label">Distanță oraș</div><div class="stat-value" style="font-size:14px">${r.distance_to_nearest_city_km != null ? r.distance_to_nearest_city_km + ' km' : '—'}</div></div>
            <div class="stat-card"><div class="stat-label">Sursă apă</div><div class="stat-value" style="font-size:14px">${r.cooling_water_source || '—'}</div></div>
        </div>
    `;
}

async function loadAlertHistory(reactorId) {
    const body = document.getElementById('alert-history-body');
    try {
        const res = await authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' });
        if (!res.ok) {
            body.innerHTML = '<p class="empty-msg">' + (res.status === 403 ? 'Acces restricționat.' : 'Eroare server.') + '</p>';
            return;
        }
        const payload = await res.json();
        const alerts  = payload.data || payload || [];

        if (!alerts.length) { body.innerHTML = '<p class="empty-msg">Nicio alertă anterioară.</p>'; return; }

        body.innerHTML = alerts.slice(-15).reverse().map(a => `
            <div class="alert-item" style="font-size:11px">
                <div class="alert-left">
                    <span class="alert-severity ${a.severity || ''}">${a.severity || '—'}</span>
                    <span class="alert-msg">${a.message || ''}</span>
                </div>
                <div class="alert-right">
                    <span class="alert-time">${a.created_at ? new Date(a.created_at).toLocaleString('ro-RO') : ''}</span>
                </div>
            </div>
        `).join('');
    } catch { body.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}
