/*
 * management-init.js — Management page bootstrap
 * Handles auth, reactor loading, maintenance modal
 * wiring, and exposes startMaint/stopMaint as
 * window globals for inline onclick.
 */

(function() {
    var reactorId;

    (async function initManagement() {
        document.documentElement.style.visibility = 'hidden';
        var meRes = await authFetch('/auth/me', { method: 'GET' });
        if (!meRes.ok) { window.location.href = 'login.html'; return; }
        var me = await meRes.json();
        if (me.role !== 'manager') { window.location.href = 'dashboard.html'; return; }
        document.documentElement.style.visibility = '';

        var reactorRes = await authFetch('/reactors/my', { method: 'GET' });
        if (!reactorRes.ok) { document.getElementById('mgt-kpis').innerHTML = '<p class="loading-msg">Nu ești asignat la niciun reactor.</p>'; return; }

        var reactor = await reactorRes.json();
        reactorId = reactor.id;

        window.gReactorId = reactorId;

        renderInfo(reactor);
        renderPersonnel(reactorId);
        renderMaintenanceList(reactorId, 'maint-list', 'maint-tabs', { limit: 20, showStopButton: true });
        renderAlertHistory(reactorId, 'alert-history-body', { limit: 20, showResolvedAt: true });

        document.getElementById('maint-tabs').addEventListener('click', function(e) {
            var btn = e.target.closest('.tab-btn');
            if (!btn) return;
            document.querySelectorAll('#maint-tabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderMaintenanceList(reactorId, 'maint-list', 'maint-tabs', { limit: 20, showStopButton: true });
        });

        bindModalCloseButtons();

        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.addEventListener('click', function(e) { e.stopPropagation(); });
        });

        /* ── Maintenance start modal ── */
        document.getElementById('modal-maint-confirm').addEventListener('click', async function() {
            var dateInput = document.getElementById('maint-date');
            var reasonInput = document.getElementById('maint-reason');
            var endDate = dateInput.value;
            var reason = reasonInput.value;
            if (!endDate) { alert('Data estimată de finalizare este obligatorie.'); return; }
            document.getElementById('modal-start-maint').classList.remove('open');
            try {
                var res = await authFetch('/reactors/' + reactorId + '/maintenance/start', {
                    method: 'POST',
                    body: JSON.stringify({ estimated_end_date: endDate, reason: reason || null })
                });
                if (res.ok) { location.reload(); }
                else { var err = await res.json(); alert(err.error || 'Eroare'); }
            } catch(e) { alert('Eroare de rețea.'); }
        });

        window.startMaint = function() {
            document.getElementById('maint-date').value = '';
            document.getElementById('maint-reason').value = '';
            var today = new Date().toISOString().split('T')[0];
            document.getElementById('maint-date').setAttribute('min', today);
            document.getElementById('modal-start-maint').classList.add('open');
        };

        window.stopMaint = function() {
            if (!confirm('Finalizezi mentenanța? Reactorul va deveni activ.')) return;
            (async function() {
                try {
                    var res = await authFetch('/reactors/' + reactorId + '/maintenance/stop', { method: 'POST' });
                    if (res.ok) { location.reload(); }
                    else { var err = await res.json(); alert(err.error || 'Eroare'); }
                } catch(e) { alert('Eroare de rețea.'); }
            })();
        };
    })();
})();
