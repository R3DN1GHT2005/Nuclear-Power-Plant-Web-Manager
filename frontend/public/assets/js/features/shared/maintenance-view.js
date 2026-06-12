/*
 * frontend/public/assets/js/features/shared/maintenance-view.js
 * Shared maintenance history component — fetches maintenance records,
 * filters by active/completed status based on tab selection,
 * and renders the list with optional stop-maintenance buttons.
 */
function renderMaintenanceList(reactorId, listId, tabContainerId, options) {
    if (!options) options = {};
    var limit      = options.limit || 10;
    var showStop   = options.showStopButton || false;
    var list       = document.getElementById(listId);
    var tabContainer = document.getElementById(tabContainerId);
    var activeTab  = tabContainer ? tabContainer.querySelector('.tab-btn.active') : null;
    var showActive = activeTab && activeTab.dataset.maint === 'active';
    var reactorIdLocal = reactorId;

    (async function() {
        try {
            var res = await authFetch('/reactors/' + reactorIdLocal + '/maintenance/history', { method: 'GET' });
            if (!res.ok) { list.innerHTML = '<p class="empty-msg">Eroare la încărcare.</p>'; return; }

            var payload  = await res.json();
            var records  = payload.data || payload || [];
            var filtered = records.filter(function(r) { return showActive ? !r.is_completed : r.is_completed; });

            if (!filtered.length) {
                list.innerHTML = '<p class="empty-msg">' + (showActive ? 'Nicio mentenanță activă.' : 'Nicio mentenanță finalizată.') + '</p>';
                return;
            }

            var items = filtered.slice(-limit).reverse().map(function(r) {
                var open = !r.is_completed;
                var date = r.is_completed
                    ? (r.completed_at ? new Date(r.completed_at).toLocaleString('ro-RO') : '')
                    : (r.started_at   ? new Date(r.started_at).toLocaleString('ro-RO')   : '');
                var text = r.notes || r.reason || 'Mentenanță #' + r.id;
                var stopBtn = (open && showStop)
                    ? '<button class="btn-sm danger" onclick="stopMaint()" style="font-size:9px">Oprește</button>'
                    : '';
                return '<div class="maint-item">' +
                    '<div class="maint-left">' +
                        '<span class="maint-badge ' + (open ? 'active' : 'done') + '">' + (open ? 'Activ' : 'Finalizat') + '</span>' +
                        '<span class="maint-reason">' + text + '</span>' +
                    '</div>' +
                    '<div class="maint-right">' +
                        '<span class="maint-date">' + date + '</span>' +
                        stopBtn +
                    '</div>' +
                '</div>';
            }).join('');

            list.innerHTML = items;
        } catch (e) {
            list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
        }
    })();
}
