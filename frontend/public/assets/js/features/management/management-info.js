/*
 * management-info.js — KPI rendering + personnel loading
 * Depends on statusMeta from utils/status.js.
 * Called by management-init.js after reactor fetch.
 */

function renderInfo(r) {
    var st = statusMeta(r.status);
    document.getElementById('mgt-kpis').innerHTML =
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
            '<div class="metric-label">Locație</div>' +
            '<div class="metric-value" style="font-size:13px">' + (r.location_name || '—') + '</div>' +
        '</div>' +
        '<div class="metric-item">' +
            '<div class="metric-label">Echipă</div>' +
            '<div class="metric-value" style="font-size:13px" id="team-count">...</div>' +
        '</div>';
}

async function renderPersonnel(reactorId) {
    var body = document.getElementById('personnel-body');
    try {
        var personnelRes = await authFetch('/reactors/' + reactorId + '/personnel', { method: 'GET' });
        var personnel = personnelRes.ok ? (await personnelRes.json()) : [];

        var teamCount = document.getElementById('team-count');
        if (teamCount) teamCount.textContent = personnel.length + ' persoane';

        if (!personnel.length) {
            body.innerHTML = '<p class="empty-msg">Nicio persoană asignată.</p>';
            return;
        }

        body.innerHTML = personnel.map(function(p) {
            return '<div class="personnel-tag" style="cursor:default">' +
                (p.first_name || '') + ' ' + (p.last_name || '') +
                ' <small style="color:var(--text-3)">' + (p.email || '') + '</small>' +
            '</div>';
        }).join('');
    } catch(e) {
        body.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>';
    }
}
