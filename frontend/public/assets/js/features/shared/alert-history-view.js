/*
 * frontend/public/assets/js/features/shared/alert-history-view.js
 * Shared alert history component — fetches alert data for a given
 * reactor and renders a list with severity badges, timestamps,
 * and optional resolved-at information.
 */
function renderAlertHistory(reactorId, containerId, options) {
    if (!options) options = {};
    var limit         = options.limit || 20;
    var showResolved  = options.showResolvedAt || false;
    var body          = document.getElementById(containerId);

    (async function() {
        try {
            var res = await authFetch('/alerts/history/reactor/' + reactorId, { method: 'GET' });
            if (!res.ok) {
                body.innerHTML = '<p class="empty-msg">' + (res.status === 403 ? 'Acces restricționat.' : 'Eroare server.') + '</p>';
                return;
            }
            var payload = await res.json();
            var alerts  = payload.data || payload || [];

            if (!alerts.length) { body.innerHTML = '<p class="empty-msg">Nicio alertă anterioară.</p>'; return; }

            var items = alerts.slice(0, limit).map(function(a) {
                var resolvedHtml = '';
                if (showResolved && a.resolved_at) {
                    resolvedHtml = '<span class="alert-time" style="color:var(--green)">Rezolvată: ' + new Date(a.resolved_at).toLocaleString('ro-RO') + '</span>';
                }

                return '<div class="alert-item" style="font-size:11px">' +
                    '<div class="alert-left">' +
                        '<span class="alert-severity ' + (a.severity || '') + '">' + (a.severity || '—') + '</span>' +
                        '<span class="alert-msg">' + (a.message || '') + '</span>' +
                    '</div>' +
                    '<div class="alert-right"' + (showResolved ? ' style="flex-direction:column;align-items:flex-end;gap:2px"' : '') + '>' +
                        '<span class="alert-time">' + (a.created_at ? new Date(a.created_at).toLocaleString('ro-RO') : '') + '</span>' +
                        resolvedHtml +
                    '</div>' +
                '</div>';
            }).join('');

            body.innerHTML = items;
        } catch (e) {
            body.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
        }
    })();
}
