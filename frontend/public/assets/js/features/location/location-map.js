/*
 * location-map.js — Map initialisation, markers,
 * and popups for the location page. Handles the
 * main Leaflet map, the coordinate-picker map,
 * marker rendering with custom sizing, and popup
 * content building. Extracted from monolithic
 * location.js.
 */

function initMainMap() {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  if (!refs.mapContainer) { console.warn('Containerul pentru hartă lipsește din DOM.'); return; }

  state.map = L.map('reactors-map', {
    zoomControl: true,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
    minZoom: 2
  }).setView([46.2, 20.2], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    noWrap: true,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);

  window.addEventListener('load', function() {
    if (state.map && typeof state.map.invalidateSize === 'function') {
      state.map.invalidateSize(true);
      state.map.setView([46.2, 20.2], 4);
    }
  }, { once: true });

  setTimeout(function() {
    if (state.map) { state.map.invalidateSize(true); state.map.setView([46.2, 20.2], 4); }
  }, 500);

  state.map.whenReady(function() {
    if (typeof state.map.invalidateSize === 'function') { state.map.invalidateSize(true); state.map.setView([46.2, 20.2], 4); }
  });
}

function ensurePickerMap() {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  if (!state.pickerMap) {
    state.pickerMap = L.map('picker-map', {
      zoomControl: true,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
      minZoom: 2
    }).setView([46.2, 20.2], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      noWrap: true,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.pickerMap);

    state.pickerMap.on('click', function(event) {
      var lat = event.latlng.lat;
      var lng = event.latlng.lng;
      if (!state.pickerMarker) {
        state.pickerMarker = L.marker([lat, lng]).addTo(state.pickerMap);
      } else {
        state.pickerMarker.setLatLng([lat, lng]);
      }
      refs.latitudeInput.value = lat.toFixed(6);
      refs.longitudeInput.value = lng.toFixed(6);
      closeModal(refs.pickerModal);
    });
  }
  window.setTimeout(function() { state.pickerMap.invalidateSize(); }, 50);
}

function getMarkerRadius(reactor) {
  var power = safeNumber(reactor.installed_power, 0);
  var normalized = normalizeStatus(reactor.status);
  var radius = 7;
  if (power > 0) { radius += Math.min(5, Math.max(0, power / 220)); }
  if (normalized === 'activ') { radius += 0.5; }
  else if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') { radius += 1; }
  else if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') { radius += 2.2; }
  else if (normalized === 'oprit') { radius -= 0.5; }
  return Math.max(6, Math.min(14, radius));
}

function buildPopupContent(reactor) {
  var power = safeNumber(reactor.installed_power).toFixed(2);
  var efficiency = safeNumber(reactor.current_efficiency).toFixed(2);

  return '<div style="font-size:12px; line-height:1.45; min-width: 280px;">' +
    '<div style="margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #0f172a;">' + escapeHtml(reactor.name || '-') + '</div>' +
    '<div><strong>Locație:</strong> ' + escapeHtml(reactor.location_name || '-') + '</div>' +
    '<div><strong>Tip:</strong> ' + escapeHtml(reactor.reactor_type || '-') + '</div>' +
    '<div><strong>Status curent:</strong> ' + escapeHtml(reactor.status || '-') + '</div>' +
    '<div><strong>Putere instalată:</strong> ' + power + ' MW</div>' +
    '<div><strong>Eficiență curentă:</strong> ' + efficiency + '%</div>' +
    '<div style="margin-top:12px; padding: 12px; border: 1px solid rgba(37,99,235,.2); border-radius: 12px; background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%); box-shadow: 0 8px 18px rgba(37,99,235,.08);">' +
      '<div style="font-size: 11px; font-weight: 800; margin-bottom: 8px; color: #1d4ed8; text-transform: uppercase; letter-spacing: .04em;">Schimbă status</div>' +
      '<select class="form-select" data-status-select="' + reactor.id + '" style="width: 100%; margin-bottom: 10px; min-height: 38px;">' +
        STATUS_OPTIONS.map(function(option) {
          return '<option value="' + option.value + '" ' + (option.value === normalizeStatusChoice(reactor.status) ? 'selected' : '') + '>' + option.label + '</option>';
        }).join('') +
      '</select>' +
      '<button type="button" class="btn reactor-status-btn" data-reactor-id="' + reactor.id + '" style="width: 100%;">Salvează status</button>' +
    '</div>' +
    '<div style="margin-top:8px;">' +
      '<button type="button" class="btn sensor-manage-btn" data-sensor-reactor-id="' + reactor.id + '">Gestiune Senzori</button>' +
    '</div>' +
  '</div>';
}

function renderMarkers(reactors) {
  var state = LocationState.getState();
  if (!state.map) return;

  var openReactorId = null;
  if (state.markerLayer) {
    state.markerLayer.eachLayer(function(marker) {
      if (marker.isPopupOpen && marker.isPopupOpen()) {
        var content = marker.getPopup() ? marker.getPopup().getContent() : null;
        if (typeof content === 'string') {
          var match = content.match(/data-reactor-id="(\d+)"/);
          if (match) openReactorId = match[1];
        }
      }
    });
    state.markerLayer.remove();
  }

  state.markerLayer = L.layerGroup().addTo(state.map);

  reactors.forEach(function(reactor) {
    var lat = safeNumber(reactor.latitude, NaN);
    var lng = safeNumber(reactor.longitude, NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    var visual = statusVisual(reactor.status);
    var marker = L.circleMarker([lat, lng], {
      radius: getMarkerRadius(reactor),
      color: 'rgba(255, 255, 255, 0.95)',
      weight: 2.5,
      fillColor: visual.color,
      fillOpacity: 0.94,
      opacity: 1,
      className: statusCircleClass(reactor.status),
      title: reactor.name || 'Reactor'
    });

    marker.bindPopup(buildPopupContent(reactor));
    marker.on('popupopen', function(event) {
      var popupElement = event.popup ? event.popup.getElement() : null;
      if (!popupElement) return;

      var statusButton = popupElement.querySelector('.reactor-status-btn');
      if (statusButton) {
        statusButton.addEventListener('click', async function() {
          var statusSelect = popupElement.querySelector('[data-status-select="' + reactor.id + '"]');
          var nextStatus = statusSelect ? statusSelect.value : normalizeStatusChoice(reactor.status);
          await LocationState.submitStatusChange(reactor.id, nextStatus);
        });
      }

      var sensorButton = popupElement.querySelector('.sensor-manage-btn');
      if (sensorButton) {
        sensorButton.addEventListener('click', function() {
          loadSensorsForReactor(reactor.id);
        });
      }
    });
    marker.addTo(state.markerLayer);
  });

  if (openReactorId) {
    state.markerLayer.eachLayer(function(marker) {
      var content = marker.getPopup() ? marker.getPopup().getContent() : null;
      if (typeof content === 'string' && content.indexOf('data-reactor-id="' + openReactorId + '"') !== -1) {
        marker.openPopup();
      }
    });
  }
}
