/*
 * dashboard-init.js — Dashboard page bootstrap
 * Handles auth, reactor loading, and orchestrates
 * all section renderers. Wires period and maintenance
 * tab switching.
 */

(async function initDashboard() {

    var meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }

    var me = await meRes.json();
    if (me.role !== 'tehnician' && me.role !== 'manager') { window.location.href = 'login.html'; return; }

    var isManager = me.role === 'manager';
    if (isManager) {
        document.getElementById('nav-statistics').style.display = '';
        document.getElementById('nav-management').style.display = '';
        document.getElementById('nav-reactor').style.display = '';
    }

    var reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) {
        document.getElementById('tech-kpis').innerHTML = '<p class="loading-msg">Nu ești asignat la niciun reactor.</p>';
        return;
    }

    var reactor = await reactorRes.json();
    var reactorId = reactor.id;

    var alertContainer = document.getElementById('alerts-container');
    if (alertContainer) alertContainer.dataset.reactorId = reactorId;

    renderKpis(reactor);
    loadSensors(reactorId);
    loadDashboardStats(reactorId);
    loadRssFeed();
    renderMaintenanceList(reactorId, 'maint-list', 'maint-tabs', { limit: 10, showStopButton: false });

    document.getElementById('stats-period').addEventListener('click', function(e) {
        var btn = e.target.closest('.period-btn');
        if (!btn) return;
        document.querySelectorAll('.period-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        loadDashboardStats(reactorId);
    });

    document.getElementById('maint-tabs').addEventListener('click', function(e) {
        var btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#maint-tabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderMaintenanceList(reactorId, 'maint-list', 'maint-tabs', { limit: 10, showStopButton: false });
    });

})();
