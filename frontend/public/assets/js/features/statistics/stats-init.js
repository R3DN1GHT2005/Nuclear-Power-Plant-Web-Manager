/*
 * frontend/public/assets/js/features/statistics/stats-init.js
 * Per-reactor statistics bootstrap (reactor-statistics page) —
 * authenticates, loads assigned reactor, renders KPIs, stats grid,
 * efficiency comparison, specs, and alert history. Wires period button
 * switching.
 */
(async function initStats() {
    document.documentElement.style.visibility = 'hidden';

    var meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }
    var me = await meRes.json();
    if (me.role !== 'manager' && me.role !== 'admin') { window.location.href = 'dashboard.html'; return; }
    document.documentElement.style.visibility = '';

    var reactorRes = await authFetch('/reactors/my', { method: 'GET' });
    if (!reactorRes.ok) { document.getElementById('stats-kpis').innerHTML = '<p class="empty-msg">Nu ești asignat la niciun reactor.</p>'; return; }

    var reactor = await reactorRes.json();
    var reactorId = reactor.id;

    var alertContainer = document.getElementById('alerts-container');
    if (alertContainer) alertContainer.dataset.reactorId = reactorId;

    renderReactorInfo(reactor);
    loadStatsGrid(reactorId);
    loadEfficiencyComparison(reactorId);
    loadSpecs(reactor);
    renderAlertHistory(reactorId, 'alert-history-body', { limit: 15, showResolvedAt: false });

    document.getElementById('stats-period').addEventListener('click', function(e) {
        var btn = e.target.closest('.period-btn');
        if (!btn) return;
        document.querySelectorAll('.period-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        loadStatsGrid(reactorId);
    });
})();
