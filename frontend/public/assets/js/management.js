(async function initManagement() {
    const meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }
    const me = await meRes.json();
    if (me.role !== 'manager') { window.location.href = 'dashboard.html'; return; }

    const reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) { document.getElementById('mgt-kpis').innerHTML = '<p class="loading-msg">Nu ești asignat la niciun reactor.</p>'; return; }

    const reactor = await reactorRes.json();
    const reactorId = reactor.id;

    window.gReactorId = reactorId;

    renderInfo(reactor);
    loadMaintenance(reactorId);
    loadPersonnel(reactorId);
    loadAlertHistory(reactorId);

    document.getElementById('maint-tabs').addEventListener('click', e => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#maint-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadMaintenance(reactorId);
    });

    /* ── Modal maintenance ──────────────────── */
    const modalMaint = document.getElementById('modal-start-maint');
    const dateInput = document.getElementById('maint-date');
    const reasonInput = document.getElementById('maint-reason');

    document.querySelectorAll('.btn-close-modal, .modal-overlay').forEach(el => {
        el.addEventListener('click', e => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-close-modal')) {
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
            }
        });
    });

    document.getElementById('modal-maint-confirm').addEventListener('click', async () => {
        const endDate = dateInput.value;
        const reason = reasonInput.value;
        if (!endDate) { alert('Data estimată de finalizare este obligatorie.'); return; }
        modalMaint.classList.remove('open');
        try {
            const res = await authFetch('/reactors/' + reactorId + '/maintenance/start', {
                method: 'POST',
                body: JSON.stringify({ estimated_end_date: endDate, reason: reason || null })
            });
            if (res.ok) { location.reload(); }
            else { const err = await res.json(); alert(err.error || 'Eroare'); }
        } catch { alert('Eroare de rețea.'); }
    });

    window.startMaint = () => {
        dateInput.value = '';
        reasonInput.value = '';
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        modalMaint.classList.add('open');
    };

    window.stopMaint = () => {
        if (!confirm('Finalizezi mentenanța? Reactorul va deveni activ.')) return;
        (async () => {
            try {
                const res = await authFetch('/reactors/' + reactorId + '/maintenance/stop', { method: 'POST' });
                if (res.ok) { location.reload(); }
                else { const err = await res.json(); alert(err.error || 'Eroare'); }
            } catch { alert('Eroare de rețea.'); }
        })();
    };
})();

function renderInfo(r) {
    const st = statusMeta(r.status);
    document.getElementById('mgt-kpis').innerHTML = `
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
            <div class="metric-label">Locație</div>
            <div class="metric-value" style="font-size:13px">${r.location_name || '—'}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Echipă</div>
            <div class="metric-value" style="font-size:13px" id="team-count">...</div>
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

/* ── Maintenance ─────────────────────── */
async function loadMaintenance(reactorId) {
    const list      = document.getElementById('maint-list');
    const activeTab = document.querySelector('#maint-tabs .tab-btn.active');
    const showActive = activeTab && activeTab.dataset.maint === 'active';

    try {
        const res = await authFetch('/reactors/' + reactorId + '/maintenance/history', { method: 'GET' });
        if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare.</p>'; return; }
        const payload = await res.json();
        const records = payload.data || payload || [];
        const filtered = records.filter(r => showActive ? !r.is_completed : r.is_completed);

        if (!filtered.length) {
            list.innerHTML = `<p class="empty-msg">${showActive ? 'Nicio mentenanță activă.' : 'Nicio mentenanță finalizată.'}</p>`;
            return;
        }

        list.innerHTML = filtered.slice(-20).reverse().map(r => {
            const open = !r.is_completed;
            const date = r.is_completed
                ? (r.completed_at ? new Date(r.completed_at).toLocaleString('ro-RO') : '')
                : (r.started_at   ? new Date(r.started_at).toLocaleString('ro-RO')   : '');
            const text = r.notes || r.reason || 'Mentenanță #' + r.id;
            return `
            <div class="maint-item">
                <div class="maint-left">
                    <span class="maint-badge ${open ? 'active' : 'done'}">${open ? 'Activ' : 'Finalizat'}</span>
                    <span class="maint-reason">${text}</span>
                </div>
                <div class="maint-right">
                    <span class="maint-date">${date}</span>
                    ${open ? '<button class="btn-sm danger" onclick="stopMaint()" style="font-size:9px">Oprește</button>' : ''}
                </div>
            </div>`;
        }).join('');
    } catch { list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}

/* ── Personnel (read-only) ───────────── */
async function loadPersonnel(reactorId) {
    const body = document.getElementById('personnel-body');
    try {
        const personnelRes = await authFetch('/reactors/' + reactorId + '/personnel', { method: 'GET' });
        const personnel = personnelRes.ok ? (await personnelRes.json()) : [];

        const teamCount = document.getElementById('team-count');
        if (teamCount) teamCount.textContent = personnel.length + ' persoane';

        if (!personnel.length) {
            body.innerHTML = '<p class="empty-msg">Nicio persoană asignată.</p>';
            return;
        }

        body.innerHTML = personnel.map(p => `
            <div class="personnel-tag" style="cursor:default">
                ${p.first_name || ''} ${p.last_name || ''}
                <small style="color:var(--text-3)">${p.email || ''}</small>
            </div>
        `).join('');
    } catch { body.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>'; }
}

/* ── Alert history ────────────────────── */
async function loadAlertHistory(reactorId) {
    const body = document.getElementById('alert-history-body');
    try {
        const res = await authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' });
        if (!res.ok) {
            body.innerHTML = '<p class="empty-msg">' + (res.status === 403 ? 'Acces restricționat.' : 'Eroare server.') + '</p>';
            return;
        }
        const payload = await res.json();
        const alerts = payload.data || payload || [];

        if (!alerts.length) { body.innerHTML = '<p class="empty-msg">Nicio alertă anterioară.</p>'; return; }

        body.innerHTML = alerts.slice(-20).reverse().map(a => {
            return `
            <div class="alert-item" style="font-size:11px">
                <div class="alert-left">
                    <span class="alert-severity ${a.severity || ''}">${a.severity || '—'}</span>
                    <span class="alert-msg">${a.message || ''}</span>
                </div>
                <div class="alert-right" style="flex-direction:column;align-items:flex-end;gap:2px">
                    <span class="alert-time">${a.created_at ? new Date(a.created_at).toLocaleString('ro-RO') : ''}</span>
                    ${a.resolved_at ? '<span class="alert-time" style="color:var(--green)">Rezolvată: ' + new Date(a.resolved_at).toLocaleString('ro-RO') + '</span>' : ''}
                </div>
            </div>`;
        }).join('');
    } catch { body.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>'; }
}
