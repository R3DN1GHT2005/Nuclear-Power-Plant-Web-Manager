/* =============================================================
   dashboard-tehnician.js  —  NuclearWatch Technician Dashboard
   ============================================================= */

(async function initTechDashboard() {

    /* ── Auth check ─────────────────────────────────────── */
    const meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }

    const me = await meRes.json();
    if (me.role !== 'tehnician') { window.location.href = 'login.html'; return; }

    /* ── Load reactor ───────────────────────────────────── */
    const reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) {
        document.getElementById('tech-kpis').innerHTML =
            '<p class="loading-msg" style="color:var(--text-3)">Nu ești asignat la niciun reactor.</p>';
        return;
    }

    const reactor   = await reactorRes.json();
    const reactorId = reactor.id;

    /* ── Initial renders ────────────────────────────────── */
    renderKpis(reactor);
    loadSensors(reactorId);
    loadReadingsAndStats(reactorId);
    loadActiveAlerts(reactorId);
    loadAlertHistory(reactorId);
    loadRssFeed();
    loadMaintenance(reactorId);

    /* ── Period switch ──────────────────────────────────── */
    document.getElementById('stats-period').addEventListener('click', e => {
        const btn = e.target.closest('.period-btn');
        if (!btn) return;
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadReadingsAndStats(reactorId);
    });

    /* ── Maintenance tabs ───────────────────────────────── */
    document.getElementById('maint-tabs').addEventListener('click', e => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#maint-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadMaintenance(reactorId);
    });

})();

/* =============================================================
   KPIs
   ============================================================= */
function renderKpis(r) {
    const st = statusMeta(r.status);

    document.getElementById('tech-kpis').innerHTML = `
        <div class="metric-item">
            <div class="metric-label">Reactor</div>
            <div class="metric-value" style="font-size:15px">${r.name || '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Status</div>
            <div class="metric-value" style="color:${st.color};font-size:15px">
                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${st.color};margin-right:5px;vertical-align:middle;animation:livepulse 2s ease-in-out infinite"></span>${st.label}
            </div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Putere</div>
            <div class="metric-value">${r.installed_power || '—'} <span class="metric-unit">MW</span></div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Eficiență</div>
            <div class="metric-value">${r.current_efficiency != null
                ? r.current_efficiency + '<span class="metric-unit">%</span>'
                : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Stab. sol</div>
            <div class="metric-value">${r.soil_stability != null ? r.soil_stability.toFixed(2) : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Amplasare</div>
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

/* =============================================================
   Sensors
   ============================================================= */
async function loadSensors(reactorId) {
    const sub  = document.getElementById('sensors-sub');
    const grid = document.getElementById('sensor-grid');

    try {
        const res = await authFetch('/reactors/' + reactorId + '/sensors', { method: 'GET' });
        if (!res.ok) { sub.textContent = 'Eroare la încărcare'; return; }

        const payload = await res.json();
        const sensors = Array.isArray(payload) ? payload : (payload.data || []);

        if (!sensors.length) {
            sub.textContent    = 'Niciun senzor';
            grid.innerHTML     = '<p class="empty-msg">Nicio citire disponibilă.</p>';
            return;
        }

        sub.textContent = sensors.length + ' senzori · date live';

        grid.innerHTML = sensors.map(s => {
            const v  = parseFloat(s.current_value);
            const mn = parseFloat(s.min_safe_value);
            const mx = parseFloat(s.max_safe_value);

            let cls = '';
            if (!isNaN(v) && !isNaN(mn) && !isNaN(mx)) {
                if (v < mn || v > mx)                           cls = 'danger';
                else if (v < mn * 1.1 || v > mx * 0.9)         cls = 'warning';
            }

            return `
            <div class="sensor-card ${cls}">
                <div class="sensor-type">${s.sensor_type || '—'}</div>
                <div class="sensor-value">${s.current_value != null ? s.current_value : '—'} <span class="sensor-unit">${s.unit || ''}</span></div>
                <div class="sensor-range">Limite: ${mn} — ${mx} ${s.unit || ''}</div>
                <div class="sensor-update">${s.last_update ? new Date(s.last_update).toLocaleString('ro-RO') : ''}</div>
            </div>`;
        }).join('');

    } catch {
        sub.textContent = 'Eroare de rețea';
        grid.innerHTML  = '<p class="empty-msg">Nu s-au putut încărca senzorii.</p>';
    }
}

/* =============================================================
   Statistics
   ============================================================= */
async function loadReadingsAndStats(reactorId) {
    const activeBtn = document.querySelector('#stats-period .period-btn.active');
    const days      = parseInt(activeBtn ? activeBtn.dataset.days : '1', 10);
    const statsSub  = document.getElementById('stats-sub');
    const statsGrid = document.getElementById('stats-grid');

    statsGrid.innerHTML = '<p class="empty-msg">Se calculează...</p>';

    try {
        const [readingsRes, alertsRes, sensorsRes] = await Promise.all([
            authFetch('/sensors/readings/all',               { method: 'GET' }),
            authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' }),
            authFetch('/reactors/' + reactorId + '/sensors',  { method: 'GET' })
        ]);

        const allReadings = readingsRes.ok ? await readingsRes.json() : [];
        const allAlerts   = alertsRes.ok  ? await alertsRes.json()   : [];
        const sensorsData = sensorsRes.ok ? await sensorsRes.json()  : [];

        const readings = Array.isArray(allReadings) ? allReadings : (allReadings.data || []);
        const sensors  = Array.isArray(sensorsData) ? sensorsData : (sensorsData.data || []);
        const alerts   = Array.isArray(allAlerts)   ? allAlerts   : (allAlerts.data  || []);

        const cutoff         = Date.now() - days * 86400000;
        const periodReadings = readings.filter(r => new Date(r.recorded_at).getTime() >= cutoff);
        const periodAlerts   = alerts.filter(a   => new Date(a.created_at).getTime()  >= cutoff);

        /* Build sensor map for critical readings check */
        const sensorMap = {};
        sensors.forEach(s => { sensorMap[s.id] = s; });

        const criticalReadings = periodReadings.filter(r => {
            const s  = sensorMap[r.sensor_id];
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

        /* Update subtitle */
        if (statsSub) {
            statsSub.textContent = days === 1 ? 'Ultimele 24 ore' : `Ultimele ${days} zile`;
        }

        statsGrid.innerHTML = `
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
        statsGrid.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

/* =============================================================
   Active Alerts
   ============================================================= */
async function loadActiveAlerts(reactorId) {
    const list        = document.getElementById('alerts-list');
    const countBadge  = document.getElementById('active-alerts-count');

    try {
        const res = await authFetch('/alerts/active', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>'; return; }

        const payload = await res.json();
        const alerts  = payload.data || payload || [];
        const mine    = alerts.filter(a => a.reactor_id === reactorId);

        /* Update badge */
        if (countBadge) {
            countBadge.textContent = mine.length ? mine.length + ' activă' : '';
        }

        if (!mine.length) {
            list.innerHTML = '<p class="empty-msg">Nicio alertă activă.</p>';
            return;
        }

        list.innerHTML = mine.map(a => `
            <div class="alert-item">
                <div class="alert-left">
                    <span class="alert-severity ${a.severity || ''}">${a.severity || '—'}</span>
                    <span class="alert-msg">${a.message || ''}</span>
                </div>
                <div class="alert-right">
                    <span class="alert-time">${a.created_at ? new Date(a.created_at).toLocaleString('ro-RO') : ''}</span>
                    <button class="btn-sm primary" onclick="intervine(${a.id})">Intervine</button>
                </div>
            </div>
        `).join('');

    } catch {
        list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

/* =============================================================
   Intervine (resolve alert)
   ============================================================= */
async function intervine(alertId) {
    const notes = prompt('Descrie intervenția ta:');
    if (!notes) return;

    try {
        const res = await authFetch('/alerts/' + alertId + '/resolve', {
            method: 'POST',
            body:   JSON.stringify({ notes })
        });

        if (res.ok) {
            alert('Alertă rezolvată cu succes!');
            location.reload();
        } else {
            const err = await res.json();
            alert(err.error || 'A apărut o eroare.');
        }
    } catch {
        alert('Eroare de rețea.');
    }
}

/* =============================================================
   Alert History
   ============================================================= */
async function loadAlertHistory(reactorId) {
    const list = document.getElementById('alerts-history-list');

    try {
        const res = await authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>'; return; }

        const payload = await res.json();
        const alerts  = payload.data || payload || [];

        if (!alerts.length) {
            list.innerHTML = '<p class="empty-msg">Nicio alertă anterioară.</p>';
            return;
        }

        list.innerHTML = alerts.slice(-10).reverse().map(a => `
            <div class="alert-item">
                <div class="alert-left">
                    <span class="alert-severity ${a.severity || ''}">${a.severity || '—'}</span>
                    <span class="alert-msg">${a.message || ''}</span>
                </div>
                <div class="alert-right">
                    <span class="alert-time">${a.created_at ? new Date(a.created_at).toLocaleDateString('ro-RO') : ''}</span>
                </div>
            </div>
        `).join('');

    } catch {
        list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

/* =============================================================
   RSS Feed
   ============================================================= */
async function loadRssFeed() {
    const list = document.getElementById('rss-list');

    try {
        const tokenRes = await authFetch('/rss/token', { method: 'GET' });
        if (!tokenRes.ok) { list.innerHTML = '<p class="empty-msg">Eroare la token RSS.</p>'; return; }

        const tokenData = await tokenRes.json();
        const token     = tokenData.rss_token;
        if (!token) { list.innerHTML = '<p class="empty-msg">Token RSS lipsă.</p>'; return; }

        const base = (window.location.protocol === 'http:' && window.location.hostname)
            ? window.location.protocol + '//' + window.location.hostname + ':8082'
            : 'http://127.0.0.1:8082';

        const xmlRes = await fetch(base + '/api/rss/alerts?token=' + encodeURIComponent(token));
        if (!xmlRes.ok) { list.innerHTML = '<p class="empty-msg">Eroare la flux RSS.</p>'; return; }

        const xmlText = await xmlRes.text();
        const xmlDoc  = new DOMParser().parseFromString(xmlText, 'text/xml');
        const items   = xmlDoc.querySelectorAll('item');

        if (!items.length) {
            list.innerHTML = '<p class="empty-msg">Nicio intrare RSS.</p>';
            return;
        }

        const entries = [];
        items.forEach(item => {
            entries.push({
                title:   item.querySelector('title')?.textContent   || '',
                desc:    item.querySelector('description')?.textContent || '',
                pubDate: item.querySelector('pubDate')?.textContent || ''
            });
        });

        list.innerHTML = entries.slice(0, 10).map(e => {
            const isCritical = e.title.includes('CRITIC');
            const isResolved = e.title.includes('REZOLVAT');
            const isInfo     = e.title.includes('INFO') || e.title.includes('STATISTICI');

            let severity = 'warning';
            if (isCritical)          severity = 'critical';
            if (isResolved || isInfo) severity = 'info';

            const cleanDesc = e.desc.replace(/&#8203;/g, '').trim();
            const dateStr   = e.pubDate ? new Date(e.pubDate).toLocaleString('ro-RO') : '';

            return `
            <div class="rss-item">
                <div class="rss-head">
                    <span class="rss-severity ${severity}">${severity.toUpperCase()}</span>
                    <span class="rss-date">${dateStr}</span>
                </div>
                <div class="rss-title">${e.title}</div>
                <div class="rss-desc">${cleanDesc}</div>
            </div>`;
        }).join('');

    } catch {
        list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

/* =============================================================
   Maintenance
   ============================================================= */
async function loadMaintenance(reactorId) {
    const list      = document.getElementById('maint-list');
    const activeTab = document.querySelector('#maint-tabs .tab-btn.active');
    const showActive = activeTab && activeTab.dataset.maint === 'active';

    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/history', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>'; return; }

        const payload = await res.json();
        const records = payload.data || payload || [];
        const filtered = records.filter(r => showActive ? !r.is_completed : r.is_completed);

        if (!filtered.length) {
            list.innerHTML = `<p class="empty-msg">${showActive ? 'Nicio mentenanță activă.' : 'Nicio mentenanță finalizată.'}</p>`;
            return;
        }

        list.innerHTML = filtered.slice(-10).reverse().map(r => {
            const badge = r.is_completed ? 'done' : 'active';
            const label = r.is_completed ? 'Finalizat' : 'Activ';
            const date  = r.is_completed
                ? (r.completed_at ? new Date(r.completed_at).toLocaleDateString('ro-RO') : '')
                : (r.started_at   ? new Date(r.started_at).toLocaleDateString('ro-RO')   : '');
            const text  = r.notes || r.reason || 'Mentenanță #' + r.id;

            return `
            <div class="maint-item">
                <div class="maint-left">
                    <span class="maint-badge ${badge}">${label}</span>
                    <span class="maint-reason">${text}</span>
                </div>
                <div class="maint-right">
                    <span class="maint-date">${date}</span>
                </div>
            </div>`;
        }).join('');

    } catch {
        list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}

/* =============================================================
   Utilities
   ============================================================= */
function formatTime(d) {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}