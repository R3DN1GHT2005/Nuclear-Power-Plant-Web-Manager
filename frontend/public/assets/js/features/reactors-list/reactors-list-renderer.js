/*
 * frontend/public/assets/js/features/reactors-list/reactors-list-renderer.js
 * Reactors list card renderer — generates HTML for individual reactor
 * cards displaying status, efficiency bar, sensor readings, metadata,
 * and a detail navigation link.
 */
function createReactorHTML(reactor) {
    var config = {
        'activ':          { pill: 'pill-active', border: '', bar: 'bf-green', text: 'text-green' },
        'alerta':         { pill: 'pill-alert', border: 'border-crit', bar: 'bf-red', text: 'text-red' },
        'mentenanta':     { pill: 'pill-maint', border: 'border-maint', bar: 'bf-amber', text: 'text-amber' },
        'oprit':          { pill: 'pill-off', border: 'opacity-75', bar: 'bf-gray', text: 'text-muted' }
    };

    var statusLower = reactor.status ? reactor.status.toLowerCase() : 'activ';
    var style = config[statusLower] || config['activ'];

    var dateObj = new Date(reactor.last_maintenance);
    var formattedDate = isNaN(dateObj) ? reactor.last_maintenance : dateObj.toLocaleString('ro-RO');

    var sensorsHtml = reactor.sensors && reactor.sensors.length > 0
        ? reactor.sensors.map(function(sensor) {
            var type = sensor.sensor_type || 'Senzor necunoscut';
            var value = sensor.current_value !== null ? sensor.current_value : '--';
            var unit = sensor.unit || '';
            var isWarning = (type.toLowerCase() === 'temperatura' && value > 350) ? 'text-red' : '';

            return '<div class="param-box">' +
                '<div class="param-label" style="text-transform: capitalize;">' + type + '</div>' +
                '<div class="param-val ' + isWarning + '">' + value + ' ' + unit + '</div>' +
                '<div class="param-unit" style="font-size: 0.85em; color: gray;">Senzor ID: ' + sensor.id + '</div>' +
            '</div>';
        }).join('')
        : '<div class="param-box"><div class="param-label text-muted">Niciun senzor montat</div></div>';

    return '<article class="rcard ' + style.border + '">' +
        '<header class="rcard-header">' +
            '<div>' +
                '<h3 class="rcard-name">' + reactor.name + '</h3>' +
                '<div class="rcard-id">ID: NW-' + reactor.id + ' · Locație: ' + reactor.location_name + '</div>' +
            '</div>' +
            '<span class="pill ' + style.pill + '">' + reactor.status + '</span>' +
        '</header>' +
        '<div class="rcard-bar">' +
            '<div class="bar-label"><span>Eficiență</span><span class="' + style.text + '">' + reactor.current_efficiency + '%</span></div>' +
            '<div class="bar-track"><div class="bar-fill ' + style.bar + '" style="width:' + reactor.current_efficiency + '%"></div></div>' +
        '</div>' +
        '<div class="rcard-meta">' +
            '<span>Tip: ' + reactor.reactor_type + '</span>' +
            '<span>Răcire: ' + reactor.cooling_water_source + '</span>' +
            '<span>Oraș: ' + reactor.distance_to_nearest_city_km + 'km</span>' +
            '<span>Alt: ' + reactor.elevation_meters + 'm</span>' +
        '</div>' +
        '<div class="rcard-body">' + sensorsHtml + '</div>' +
        '<footer class="rcard-footer">' +
            '<div class="rcard-upd">' +
                '<div class="upd-dot ' + style.bar.replace('bf-', 'dot-') + '"></div>' +
                'Actualizat: ' + formattedDate +
            '</div>' +
            '<a class="action-link detail-btn" data-id="' + reactor.id + '" href="reactor.html?id=' + encodeURIComponent(reactor.id) + '">Detalii →</a>' +
        '</footer>' +
    '</article>';
}

function renderReactors(reactorsList) {
    var gridContainer = document.getElementById("reactor-grid-container");

    if (!reactorsList || reactorsList.length === 0) {
        gridContainer.innerHTML = '<p class="grid-placeholder-msg" style="color: var(--text-3); margin-top: 20px;">Nu s-au găsit reactoare conform criteriilor selectate.</p>';
        return;
    }

    gridContainer.innerHTML = reactorsList.map(function(r) { return createReactorHTML(r); }).join('');
    attachDetailLinks();
}

function attachDetailLinks() {
    document.querySelectorAll('.detail-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var reactorId = e.currentTarget.getAttribute('data-id');
            window.location.href = 'reactor.html?id=' + reactorId;
        });
    });
}
