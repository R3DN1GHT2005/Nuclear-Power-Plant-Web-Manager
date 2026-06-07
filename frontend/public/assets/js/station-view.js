(async function initStation() {
    const meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) {
        window.location.href = 'login.html';
        return;
    }
    const me = await meRes.json();
    if (me.role !== 'manager') {
        window.location.href = 'index.html';
        return;
    }

    const banner = document.getElementById('role-banner');
    banner.textContent = 'Manager Stație — ' + (me.first_name || '') + ' ' + (me.last_name || '');
    banner.className = 'role-banner manager';

    const reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) {
        document.querySelector('#station-kpis').innerHTML = '<p>Nu ești asignat la niciun reactor.</p>';
        return;
    }
    const reactor = await reactorRes.json();

    renderKpis(reactor);
    renderSpecs(reactor);

    loadAlerts(reactor.id);
    loadMaintenanceHistory(reactor.id);
    loadPersonnel(reactor.id);
    addMaintenanceControls(reactor.id);
})();

function renderKpis(r) {
    const statusColors = {
        'activ': 'var(--green)',
        'mentenanță': 'var(--amber)',
        'oprit': '#CBD5E1',
        'alertă': 'var(--red)',
        'in constructie': 'var(--blue)'
    };
    const statusColor = statusColors[(r.status || '').toLowerCase()] || 'var(--text-2)';

    document.getElementById('station-kpis').innerHTML = `
        <div class="metric-item">
            <div class="metric-label">Nume reactor</div>
            <div class="metric-value">${r.name || '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Status</div>
            <div class="metric-value" style="color:${statusColor}">${r.status || '—'}</div>
            <div class="metric-status" style="background:${statusColor}22;color:${statusColor}">${r.status || '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Eficiență</div>
            <div class="metric-value">${r.current_efficiency != null ? r.current_efficiency + '%' : '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Putere instalată</div>
            <div class="metric-value">${r.installed_power || '—'} MW</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Stabilitate sol</div>
            <div class="metric-value">${r.soil_stability != null ? r.soil_stability.toFixed(2) : '—'}</div>
        </div>
    `;
}

function renderSpecs(r) {
    const specsEl = document.getElementById('reactor-specs');
    specsEl.style.display = 'block';
    document.getElementById('specs-sub').textContent = r.location_name || '';

    const fields = [
        { label: 'Tip reactor', value: r.reactor_type },
        { label: 'Risc seismic', value: r.seismic_risk != null ? r.seismic_risk.toFixed(2) : '—' },
        { label: 'Altitudine', value: r.elevation_meters != null ? r.elevation_meters + ' m' : '—' },
        { label: 'Distanță oraș', value: r.distance_to_nearest_city_km != null ? r.distance_to_nearest_city_km + ' km' : '—' },
        { label: 'Sursă apă răcire', value: r.cooling_water_source || '—' },
    ];

    document.getElementById('specs-grid').innerHTML = fields.map(f =>
        `<div class="spec-item"><div class="spec-label">${f.label}</div><div class="spec-value">${f.value}</div></div>`
    ).join('');
}

async function loadAlerts(reactorId) {
    const list = document.getElementById('alerts-list');
    try {
        const res = await authFetch('/alerts/active', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Eroare la încărcare</p>'; return; }
        const alerts = await res.json();
        const data = alerts.data || alerts || [];

        if (!data.length) {
            list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Nu există alerte active.</p>';
            return;
        }

        list.innerHTML = data.map(a => `
            <div class="alert-item">
                <span class="alert-severity ${a.severity}">${a.severity}</span>
                <span class="alert-msg">${a.message || '—'}</span>
                <div class="alert-actions">
                    <button class="btn-sm primary" onclick="resolveAlert(${a.id})">Rezolvă</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Eroare de rețea</p>';
    }
}

async function resolveAlert(alertId) {
    try {
        const res = await authFetch('/alerts/' + alertId + '/resolve', {
            method: 'POST',
            body: JSON.stringify({ notes: 'Rezolvat din Stația mea' })
        });
        if (res.ok) {
            loadAlerts();
        } else {
            const err = await res.json();
            alert(err.error || 'Eroare la rezolvare');
        }
    } catch (e) {
        alert('Eroare de rețea');
    }
}

async function loadMaintenanceHistory(reactorId) {
    const list = document.getElementById('maintenance-list');
    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/history', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Eroare</p>'; return; }
        const data = await res.json();
        const records = data.data || data || [];

        if (!records.length) {
            list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Nu există istoric de mentenanță.</p>';
            return;
        }

        list.innerHTML = records.map(r => {
            const closed = r.is_completed || r.completed_at;
            return `
                <div class="maintenance-item">
                    <div class="maint-date">${r.started_at ? new Date(r.started_at).toLocaleString('ro-RO') : '—'}</div>
                    <div class="maint-reason">${r.reason || 'Fără motiv'}</div>
                    <div class="maint-status ${closed ? 'closed' : ''}">${closed ? 'Finalizat' : 'În desfășurare'}</div>
                    ${r.completed_at ? '<div class="maint-date">Finalizat: ' + new Date(r.completed_at).toLocaleString('ro-RO') + '</div>' : ''}
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Eroare de rețea</p>';
    }
}

async function loadPersonnel(reactorId) {
    const card = document.getElementById('alerts-card');
    const header = card.querySelector('.section-header');
    const personnelHtml = `
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border);">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Personal asignat</div>
            <div id="personnel-list" class="tech-list">Se încarcă...</div>
        </div>
    `;
    header.insertAdjacentHTML('afterend', personnelHtml);

    try {
        const res = await authFetch('/reactors/' + reactorId + '/personnel', { method: 'GET' });
        if (!res.ok) { document.getElementById('personnel-list').innerHTML = '<span>Eroare</span>'; return; }
        const personnel = await res.json();
        const list = document.getElementById('personnel-list');

        if (!personnel.length) {
            list.innerHTML = '<span style="color:var(--text-3)">Nicio persoană asignată</span>';
        } else {
            list.innerHTML = personnel.map(p =>
                '<span class="tech-badge">' + (p.first_name || '') + ' ' + (p.last_name || '') + ' <small>(' + (p.intervention_role || p.role || '') + ')</small></span>'
            ).join('');
        }
    } catch {}
}

function addMaintenanceControls(reactorId) {
    const maintCard = document.getElementById('maintenance-card');
    const header = maintCard.querySelector('.section-header');
    const controls = document.createElement('div');
    controls.style.cssText = 'margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;';
    controls.innerHTML = `
        <button class="btn-sm primary" onclick="startMaint(${reactorId})">Pornește mentenanța</button>
        <button class="btn-sm danger" onclick="stopMaint(${reactorId})">Finalizează mentenanța</button>
        <span id="maint-msg" style="font-size:12px;color:var(--text-3);margin-left:8px;"></span>
    `;
    header.after(controls);
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
        if (res.ok) {
            document.getElementById('maint-msg').textContent = 'Mentenanța a început!';
            location.reload();
        } else {
            const err = await res.json();
            document.getElementById('maint-msg').textContent = err.error || 'Eroare';
        }
    } catch {
        document.getElementById('maint-msg').textContent = 'Eroare de rețea';
    }
}

async function stopMaint(reactorId) {
    if (!confirm('Ești sigur că vrei să finalizezi mentenanța?')) return;
    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/stop', {
            method: 'POST'
        });
        if (res.ok) {
            document.getElementById('maint-msg').textContent = 'Mentenanța s-a încheiat!';
            location.reload();
        } else {
            const err = await res.json();
            document.getElementById('maint-msg').textContent = err.error || 'Eroare';
        }
    } catch {
        document.getElementById('maint-msg').textContent = 'Eroare de rețea';
    }
}
