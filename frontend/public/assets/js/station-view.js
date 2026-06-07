(async function initStation() {
    const meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }
    const me = await meRes.json();
    if (me.role !== 'manager') { window.location.href = 'index.html'; return; }

    document.getElementById('page-title').textContent = 'Stația mea';
    document.getElementById('page-sub').textContent = (me.first_name || '') + ' ' + (me.last_name || '');

    const reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) {
        document.getElementById('station-kpis').innerHTML = '<p class="empty-msg">Nu ești asignat la niciun reactor.</p>';
        return;
    }
    const reactor = await reactorRes.json();
    const reactorId = reactor.id;

    renderKpis(reactor);
    renderSpecs(reactor);
    loadReadingsAndStats(reactorId);
    loadActiveAlerts(reactorId);
    loadAlertHistory(reactorId);
    loadMaintenance(reactorId);
    loadPersonnel(reactorId);
    loadEfficiencyComparison(reactorId);

    document.getElementById('stats-period').addEventListener('click', e => {
        const btn = e.target.closest('.period-btn');
        if (!btn) return;
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadReadingsAndStats(reactorId);
    });

    window.startMaint = () => startMaint(reactorId);
    window.stopMaint  = () => stopMaint(reactorId);
    window.resolveAlert = resolveAlert;
    window.assignTechnician = assignTechnician;
    window.removeTechnician = removeTechnician;
})();

function renderKpis(r) {
    const st = statusMeta(r.status);
    document.getElementById('kpi-sub').textContent = r.name || '—';
    document.getElementById('station-kpis').innerHTML = `
        <div class="metric-item">
            <div class="metric-label">Status</div>
            <div class="metric-value" style="color:${st.color}">${st.label}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Eficiență</div>
            <div class="metric-value">${r.current_efficiency != null ? r.current_efficiency + '%' : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Putere</div>
            <div class="metric-value">${r.installed_power || '—'} <span style="font-size:10px;color:var(--text-3)">MW</span></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Stab. sol</div>
            <div class="metric-value">${r.soil_stability != null ? r.soil_stability.toFixed(2) : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Amplasare</div>
            <div class="metric-value" style="font-size:13px">${r.location_name || '—'}</div>
        </div>
    `;
}

function renderSpecs(r) {
    const card = document.getElementById('specs-card');
    card.style.display = 'block';
    document.getElementById('specs-sub').textContent = r.location_name || '';
    const fields = [
        { label: 'Tip reactor',  value: r.reactor_type || '—' },
        { label: 'Risc seismic', value: r.seismic_risk != null ? r.seismic_risk.toFixed(2) : '—' },
        { label: 'Altitudine',   value: r.elevation_meters != null ? r.elevation_meters + ' m' : '—' },
        { label: 'Distanță oraș', value: r.distance_to_nearest_city_km != null ? r.distance_to_nearest_city_km + ' km' : '—' },
        { label: 'Sursă apă',    value: r.cooling_water_source || '—' },
    ];
    document.getElementById('specs-grid').innerHTML = fields.map(f =>
        `<div class="spec-item"><div class="spec-label">${f.label}</div><div class="spec-value">${f.value}</div></div>`
    ).join('');
}

function statusMeta(s) {
    const map = {
        'activ':          { color: 'var(--green)', label: 'Activ' },
        'mentenanță':     { color: 'var(--amber)', label: 'Mentenanță' },
        'oprit':          { color: 'var(--text-3)', label: 'Oprit' },
        'alertă':         { color: 'var(--red)',   label: 'Alertă' },
        'in constructie': { color: 'var(--blue)',  label: 'În construcție' },
    };
    return map[(s || '').toLowerCase()] || { color: 'var(--text-2)', label: s || '—' };
}

/* ── Statistics ────────────────────────────────── */
async function loadReadingsAndStats(reactorId) {
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

        const avg = periodReadings.length
            ? periodReadings.reduce((sum, r) => sum + parseFloat(r.recorded_value || 0), 0) / periodReadings.length
            : 0;

        const times  = periodReadings.map(r => r.recorded_at ? new Date(r.recorded_at) : null).filter(Boolean);
        const latest = times.length ? times.sort((a, b) => b - a)[0] : null;
        const criticalAlerts = periodAlerts.filter(a => a.severity === 'critical').length;
        const alertColor     = periodAlerts.length === 0
            ? 'var(--green)'
            : periodAlerts.length > 3 ? 'var(--red)' : 'var(--amber)';

        grid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Citiri</div>
                <div class="stat-value" style="color:var(--green)">${periodReadings.length}</div>
                <div class="stat-hint">În această perioadă</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Medie</div>
                <div class="stat-value">${periodReadings.length ? avg.toFixed(1) : '—'}</div>
                <div class="stat-hint">Media valorilor</div>
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
                <div class="stat-label">Senzori</div>
                <div class="stat-value" style="color:var(--purple)">${sensors.length}</div>
                <div class="stat-hint">Activi pe reactor</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ultima citire</div>
                <div class="stat-value" style="font-size:14px">${latest ? formatTime(latest) : '—'}</div>
                <div class="stat-hint">Cea mai recentă</div>
            </div>
        `;
    } catch {
        grid.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

function formatTime(d) {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

/* ── Active Alerts ─────────────────────────────── */
async function loadActiveAlerts(reactorId) {
    const list = document.getElementById('alerts-list');
    try {
        const res = await authFetch('/alerts/active', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>'; return; }
        const payload = await res.json();
        const alerts  = payload.data || payload || [];
        const mine    = alerts.filter(a => a.reactor_id === reactorId);

        if (!mine.length) { list.innerHTML = '<p class="empty-msg">Nicio alertă activă.</p>'; return; }

        list.innerHTML = mine.map(a => `
            <div class="list-item">
                <div class="list-left">
                    <span class="badge ${a.severity || ''}">${a.severity || '—'}</span>
                    <span class="list-msg">${a.message || ''}</span>
                </div>
                <div class="list-right">
                    <span class="list-date">${a.created_at ? new Date(a.created_at).toLocaleString('ro-RO') : ''}</span>
                    <button class="btn-sm primary" onclick="resolveAlert(${a.id})">Rezolvă</button>
                </div>
            </div>
        `).join('');
    } catch { list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}

async function resolveAlert(alertId) {
    const notes = prompt('Descrie intervenția:');
    if (!notes) return;
    try {
        const res = await authFetch('/alerts/' + alertId + '/resolve', {
            method: 'POST',
            body: JSON.stringify({ notes })
        });
        if (res.ok) { alert('Alertă rezolvată!'); location.reload(); }
        else { const err = await res.json(); alert(err.error || 'Eroare'); }
    } catch { alert('Eroare de rețea.'); }
}

/* ── Alert History ─────────────────────────────── */
async function loadAlertHistory(reactorId) {
    const list = document.getElementById('alerts-history-list');
    try {
        const res = await authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare.</p>'; return; }
        const payload = await res.json();
        const alerts  = payload.data || payload || [];

        if (!alerts.length) { list.innerHTML = '<p class="empty-msg">Nicio alertă anterioară.</p>'; return; }

        list.innerHTML = alerts.slice(-10).reverse().map(a => `
            <div class="list-item">
                <div class="list-left">
                    <span class="badge ${a.severity || ''}">${a.severity || '—'}</span>
                    <span class="list-msg">${a.message || ''}</span>
                </div>
                <div class="list-right">
                    <span class="list-date">${a.created_at ? new Date(a.created_at).toLocaleDateString('ro-RO') : ''}</span>
                </div>
            </div>
        `).join('');
    } catch { list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}

/* ── Maintenance ────────────────────────────────── */
async function loadMaintenance(reactorId) {
    const ctrl = document.getElementById('maint-controls');
    ctrl.innerHTML = `
        <button class="btn-sm primary" onclick="startMaint()">Pornește mentenanța</button>
        <button class="btn-sm danger" onclick="stopMaint()">Finalizează mentenanța</button>
        <span class="maint-msg" id="maint-msg"></span>
    `;

    const list = document.getElementById('maintenance-list');
    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/history', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare.</p>'; return; }
        const payload = await res.json();
        const records = payload.data || payload || [];

        if (!records.length) { list.innerHTML = '<p class="empty-msg">Nu există istoric de mentenanță.</p>'; return; }

        list.innerHTML = records.slice(-10).reverse().map(r => {
            const closed = r.is_completed || r.completed_at;
            return `
                <div class="maint-item">
                    <div class="maint-top">
                        <span class="maint-date">${r.started_at ? new Date(r.started_at).toLocaleString('ro-RO') : '—'}</span>
                        <span class="maint-status ${closed ? 'closed' : 'open'}">${closed ? 'Finalizat' : 'În desfășurare'}</span>
                    </div>
                    <div class="maint-reason">${r.reason || r.notes || 'Fără motiv'}</div>
                    ${r.completed_at ? '<div class="maint-completed">Finalizat: ' + new Date(r.completed_at).toLocaleString('ro-RO') + '</div>' : ''}
                </div>
            `;
        }).join('');
    } catch { list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}

async function startMaint(reactorId) {
    const reason = prompt('Motivul mentenanței:');
    if (!reason) return;
    const days = prompt('Durata estimată (zile):', '1');
    if (!days) return;
    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/start', {
            method: 'POST',
            body: JSON.stringify({ estimated_end_date: days + ' days', reason })
        });
        if (res.ok) { document.getElementById('maint-msg').textContent = 'Mentenanța a început!'; setTimeout(() => location.reload(), 800); }
        else { const err = await res.json(); document.getElementById('maint-msg').textContent = err.error || 'Eroare'; }
    } catch { document.getElementById('maint-msg').textContent = 'Eroare de rețea'; }
}

async function stopMaint(reactorId) {
    if (!confirm('Ești sigur că vrei să finalizezi mentenanța?')) return;
    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/stop', { method: 'POST' });
        if (res.ok) { document.getElementById('maint-msg').textContent = 'Mentenanța s-a încheiat!'; setTimeout(() => location.reload(), 800); }
        else { const err = await res.json(); document.getElementById('maint-msg').textContent = err.error || 'Eroare'; }
    } catch { document.getElementById('maint-msg').textContent = 'Eroare de rețea'; }
}

/* ── Personnel ──────────────────────────────────── */
async function loadPersonnel(reactorId) {
    const body = document.getElementById('personnel-body');
    try {
        const [personnelRes, techsRes] = await Promise.all([
            authFetch('/reactors/' + reactorId + '/personnel', { method: 'GET' }),
            authFetch('/users/technicians', { method: 'GET' })
        ]);

        const personnel = personnelRes.ok ? (await personnelRes.json()) : [];
        const allTechs  = techsRes.ok ? (await techsRes.json()) : [];

        const assignedIds = personnel.map(p => p.user_id);
        const unassigned  = allTechs.filter(t => !t.reactor_id || t.reactor_id === null);

        let html = '';

        if (personnel.length) {
            html += '<div class="personnel-list">';
            personnel.forEach(p => {
                html += '<span class="personnel-tag">' +
                    (p.first_name || '') + ' ' + (p.last_name || '') +
                    ' <small>(' + (p.intervention_role || 'tehnician') + ')</small>' +
                    '<button class="remove-btn" onclick="removeTechnician(' + p.user_id + ')" title="Elimină de la reactor">✕</button>' +
                    '</span>';
            });
            html += '</div>';
        } else {
            html += '<p class="empty-msg" style="padding:8px 0">Nicio persoană asignată.</p>';
        }

        if (unassigned.length) {
            html += '<div class="assign-row">' +
                '<select id="tech-select">' +
                '<option value="">— Alege un tehnician —</option>' +
                unassigned.map(t => '<option value="' + t.id + '">' + (t.first_name || '') + ' ' + (t.last_name || '') + ' (' + (t.email || '') + ')</option>').join('') +
                '</select>' +
                '<button class="btn-sm primary" onclick="assignTechnician(' + reactorId + ')">Asignează</button>' +
                '</div>';
        } else {
            html += '<p style="font-size:11px;color:var(--text-3);margin-top:6px">Toți tehnicienii sunt deja asignați.</p>';
        }

        body.innerHTML = html;
    } catch {
        body.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>';
    }
}

async function assignTechnician(reactorId) {
    const select = document.getElementById('tech-select');
    if (!select) return;
    const userId = select.value;
    if (!userId) { alert('Selectează un tehnician.'); return; }
    try {
        const res = await authFetch('/users/' + userId + '/reactor', {
            method: 'PUT',
            body: JSON.stringify({ reactor_id: reactorId })
        });
        if (res.ok) { location.reload(); }
        else { const err = await res.json(); alert(err.error || 'Eroare la asignare'); }
    } catch { alert('Eroare de rețea.'); }
}

async function removeTechnician(userId) {
    if (!confirm('Elimini acest tehnician de la reactor?')) return;
    try {
        const res = await authFetch('/users/' + userId + '/reactor', {
            method: 'PUT',
            body: JSON.stringify({ reactor_id: null })
        });
        if (res.ok) { location.reload(); }
        else { const err = await res.json(); alert(err.error || 'Eroare'); }
    } catch { alert('Eroare de rețea.'); }
}

/* ── Efficiency Comparison ──────────────────────── */
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
