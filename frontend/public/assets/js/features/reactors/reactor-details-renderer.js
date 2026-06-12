/*
 * reactor-details-renderer.js — Rendering for
 * the reactor details page. Handles reactor
 * info, sensor cards, history, maintenance,
 * and right-side summary. Extracted from the
 * monolithic reactor-details.js.
 */

var STATUS_OPTIONS_DETAILS = [
  { value: 'Activ', label: 'Activ' },
  { value: 'Mentenanta', label: 'Mentenanță' },
  { value: 'Oprit', label: 'Oprit' },
  { value: 'Alerta', label: 'Alertă' },
  { value: 'In Constructie', label: 'În construcție' }
];

function renderReactorDetails(reactor) {
  setElText('reactor-title', reactor.name);
  setElText('reactor-subtitle', 'ID: NW-' + reactor.id + ' · Locație: ' + reactor.location_name);

  var statusPill = document.getElementById('reactor-status-pill');
  if (statusPill) {
    statusPill.textContent = reactor.status;
    statusPill.className = 'pill ' + getStatusPillClass(reactor.status);
  }

  setElText('spec-type', reactor.reactor_type || '—');
  setElText('spec-cooling', reactor.cooling_water_source || '—');

  var statusStr = (reactor.status || '').toLowerCase();
  var isMaintenance = statusStr.includes('mentenan');

  var powerText = isMaintenance ? '0 MW (Oprit)' : (reactor.installed_power ? reactor.installed_power + ' MW' : '—');
  setElText('spec-power', powerText);

  setElText('spec-distance', reactor.distance_to_nearest_city_km != null ? reactor.distance_to_nearest_city_km + ' km' : '—');
  setElText('spec-elevation', reactor.elevation_meters != null ? reactor.elevation_meters + ' m' : '—');
  setElText('spec-seismic', reactor.seismic_risk != null ? reactor.seismic_risk + '%' : '—');

  var eff = isMaintenance ? 0 : (reactor.current_efficiency || 0);
  setElText('efficiency-val', eff + '%');
  var effBar = document.getElementById('efficiency-bar');
  if (effBar) {
    effBar.style.width = eff + '%';
    effBar.className = 'spec-bar-fill ' + getBarClass(eff);
  }

  var rawStab = reactor.soil_stability || 0;
  var stab = rawStab > 1 ? rawStab : rawStab * 100;
  setElText('stability-val', Math.round(stab) + '%');
  var stabBar = document.getElementById('stability-bar');
  if (stabBar) {
    stabBar.style.width = Math.round(stab) + '%';
    stabBar.className = 'spec-bar-fill ' + getBarClass(stab);
  }

  var maintEl = document.getElementById('last-maintenance-date');
  if (maintEl) {
    var d = new Date(reactor.last_maintenance);
    maintEl.textContent = 'Ultima mentenanță: ' + (reactor.last_maintenance && !isNaN(d) ? d.toLocaleString('ro-RO') : '—');
  }

  var btnMaint = document.getElementById('btn-maint');
  var btnFinishMaint = document.getElementById('btn-finish-maint');
  var btnStart = document.getElementById('btn-start');
  var btnStop = document.getElementById('btn-stop');

  if (isMaintenance) {
    if (btnMaint) btnMaint.classList.add('hidden');
    if (btnFinishMaint) btnFinishMaint.classList.remove('hidden');
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = true;
  } else {
    if (btnMaint) btnMaint.classList.remove('hidden');
    if (btnFinishMaint) btnFinishMaint.classList.add('hidden');
    if (btnStart) btnStart.disabled = false;
    if (btnStop) btnStop.disabled = false;
  }
}

function renderSensors(sensors) {
  var container = document.getElementById('sensor-grid-container');
  if (!container) return;

  if (sensors.length === 0) {
    container.innerHTML = '<div class="history-empty">Niciun senzor montat pe acest reactor.</div>';
    return;
  }

  container.innerHTML = sensors.map(function(sensor) {
    var type = (sensor.sensor_type || 'Senzor') + ' #' + sensor.id;
    var val  = sensor.current_value !== null && sensor.current_value !== undefined ? sensor.current_value : '—';
    var unit = sensor.unit || '';
    var min  = sensor.min_safe_value !== null && sensor.min_safe_value !== undefined ? sensor.min_safe_value : -Infinity;
    var max  = sensor.max_safe_value !== null && sensor.max_safe_value !== undefined ? sensor.max_safe_value :  Infinity;

    var sensorState = 'ok';
    if (val !== '—') {
      var v = parseFloat(val);
      var margin = (max - min) * 0.15;
      if (v > max || v < min) sensorState = 'crit';
      else if (v > max - margin || v < min + margin) sensorState = 'warn';
    }

    var styles = {
      ok:   { bg: '#EAF3DE', border: '#C0DD97', lbl: '#3B6D11', val: '#27500A', bdg: '#C0DD97', bdgT: '#27500A', icon: 'ti-check', txt: 'Normal' },
      warn: { bg: '#FAEEDA', border: '#FAC775', lbl: '#854F0B', val: '#633806', bdg: '#FAC775', bdgT: '#633806', icon: 'ti-alert-triangle', txt: 'Avertizare' },
      crit: { bg: '#FCEBEB', border: '#F7C1C1', lbl: '#A32D2D', val: '#791F1F', bdg: '#F7C1C1', bdgT: '#791F1F', icon: 'ti-alert-circle', txt: 'Critic' }
    };
    var s = styles[sensorState];

    return [
      '<div class="sensor-state-card" style="background:' + s.bg + ';border:1px solid ' + s.border + ';">',
        '<span class="sensor-state-type" style="color:' + s.lbl + '">' + type + '</span>',
        '<div class="sensor-state-value" style="color:' + s.val + '">',
          val,
          '<span class="sensor-state-unit">' + unit + '</span>',
        '</div>',
        '<span class="sensor-state-badge" style="background:' + s.bdg + ';color:' + s.bdgT + '">',
          '<i class="ti ' + s.icon + '" style="font-size:10px" aria-hidden="true"></i> ' + s.txt,
        '</span>',
      '</div>'
    ].join('');
  }).join('');
}

function populateHistoryFilter(sensors) {
  var select = document.getElementById('filter-sensor');
  if (!select) return;

  select.innerHTML = '<option value="">Toți senzorii</option>';
  sensors.forEach(function(s) {
    select.innerHTML += '<option value="' + s.id + '">' + s.sensor_type + ' #' + s.id + '</option>';
  });
}

async function loadSensorHistory(sensorId) {
  if (sensorId === undefined) sensorId = null;
  var container = document.getElementById('history-list');
  if (!container) return;

  container.innerHTML = '<div class="history-empty">Se încarcă istoricul...</div>';

  try {
    var url = sensorId ? '/sensors/' + sensorId + '/readings' : '/sensors/readings/all';
    var res = await window.authFetch(url);

    if (!res.ok) {
      container.innerHTML = '<div class="history-empty">Eroare la încărcarea datelor.</div>';
      return;
    }

    var readings = await res.json();

    var state = ReactorDetailsState.getState();

    if (!sensorId) {
      state.sensorReadings = Array.isArray(readings) ? readings : [];
      renderRightSummary();
    }

    if (!readings || readings.length === 0) {
      container.innerHTML = '<div class="history-empty">Niciun istoric disponibil.</div>';
      return;
    }

    var sensorMap = {};
    (state.currentReactor?.sensors || []).forEach(function(s) { sensorMap[s.id] = s; });

    container.innerHTML = readings.map(function(reading) {
      var sensor = sensorMap[reading.sensor_id];
      var sensorLabel = sensor ? sensor.sensor_type + ' #' + reading.sensor_id : 'Senzor #' + reading.sensor_id;
      var unit = sensor?.unit || '';

      var stateColor = '#3B6D11';
      var stateBg = '#EAF3DE';
      var stateText = 'Normal';

      if (sensor) {
        var v = parseFloat(reading.recorded_value);
        var mn = sensor.min_safe_value !== null && sensor.min_safe_value !== undefined ? sensor.min_safe_value : -Infinity;
        var mx = sensor.max_safe_value !== null && sensor.max_safe_value !== undefined ? sensor.max_safe_value :  Infinity;
        var margin = (mx - mn) * 0.15;

        if (v > mx || v < mn) {
          stateColor = '#A32D2D'; stateBg = '#FCEBEB'; stateText = 'Critic';
        } else if (v > mx - margin || v < mn + margin) {
          stateColor = '#854F0B'; stateBg = '#FAEEDA'; stateText = 'Avertizare';
        }
      }

      return [
        '<div class="reading-row">',
          '<span class="reading-label">' + sensorLabel + '</span>',
          '<span class="reading-value" style="color:' + stateColor + ';background:' + stateBg + '">' + reading.recorded_value + ' ' + unit + '</span>',
          '<span class="reading-time">' + formatSmallTime(reading.recorded_at) + '</span>',
        '</div>'
      ].join('');
    }).join('');
  } catch (err) {
    console.error('Eroare la încărcarea istoricului senzori:', err);
    container.innerHTML = '<div class="history-empty">Eroare la încărcarea datelor.</div>';
  }
}

function renderRightSummary() {
  var refs = ReactorDetailsState.getRefs();
  var state = ReactorDetailsState.getState();

  if (!refs.summaryReadingsCount || !refs.summaryAverageReading || !refs.summaryAlertsCount || !refs.summaryCriticalCount || !refs.summarySensorsCount || !refs.summaryLastReading) return;

  var periodDays = state.selectedPeriodDays || 30;
  var sensors = state.currentReactor?.sensors || [];
  var readings = filterByPeriod(state.sensorReadings, function(r) { return r.recorded_at; }, periodDays);
  var alerts = filterByPeriod(state.alertHistory, function(a) { return a.created_at; }, periodDays);

  var sensorMap = new Map(sensors.map(function(s) { return [String(s.id), s]; }));
  var criticalReadings = readings.filter(function(reading) {
    var sensor = sensorMap.get(String(reading.sensor_id));
    if (!sensor) return false;
    var value = Number(reading.recorded_value);
    var min = Number(sensor.min_safe_value !== null && sensor.min_safe_value !== undefined ? sensor.min_safe_value : -Infinity);
    var max = Number(sensor.max_safe_value !== null && sensor.max_safe_value !== undefined ? sensor.max_safe_value :  Infinity);
    return Number.isFinite(value) && (value < min || value > max);
  });

  var averageReading = readings.length
    ? readings.reduce(function(sum, r) { return sum + Number(r.recorded_value || 0); }, 0) / readings.length
    : 0;
  var latestReading = readings.map(function(r) { return parseDateValue(r.recorded_at); }).filter(Boolean).sort(function(a, b) { return b.getTime() - a.getTime(); })[0];

  function setVal(el, val, colorClass) {
    el.textContent = val;
    el.className = 'right-stat-value' + (colorClass ? ' ' + colorClass : '');
  }

  setVal(refs.summaryReadingsCount, String(readings.length), 'text-green');
  setVal(refs.summaryAverageReading, readings.length ? averageReading.toFixed(1) : '—');
  var alertColor = alerts.length === 0 ? 'text-green' : alerts.length > 5 ? 'text-red' : 'text-amber';
  setVal(refs.summaryAlertsCount, String(alerts.length), alertColor);
  var critColor = criticalReadings.length === 0 ? 'text-green' : 'text-red';
  setVal(refs.summaryCriticalCount, String(criticalReadings.length), critColor);
  setVal(refs.summarySensorsCount, String(sensors.length), 'text-purple');
  setVal(refs.summaryLastReading, latestReading ? formatSmallTime(latestReading.toISOString()) : '—');

  if (refs.summarySubtitle) {
    refs.summarySubtitle.textContent = formatPeriodLabel(periodDays) + ' · ' + readings.length + ' citiri, ' + alerts.length + ' alerte';
  }

  document.querySelectorAll('.period-btn').forEach(function(button) {
    var isActive = Number(button.dataset.days || 0) === periodDays;
    button.classList.toggle('active', isActive);
  });
}

async function loadReactorSpecificAlerts(id) {
  var logBox = document.getElementById('alert-list');
  var countPill = document.getElementById('alert-count-pill');
  var alertSub = document.getElementById('alert-sub');
  var state = ReactorDetailsState.getState();
  if (!logBox) return;

  try {
    var res = await window.authFetch('/alerts/history/reactor/' + id);
    if (res.ok) {
      var historyAlerts = await res.json();
      state.alertHistory = Array.isArray(historyAlerts) ? historyAlerts : [];

      if (historyAlerts.length === 0) {
        state.activeAlertsCount = 0;
        logBox.innerHTML = '<div class="system-stable-msg">Sistem stabil. Nicio alertă.</div>';
        if (countPill) countPill.classList.add('hidden');
        if (alertSub) alertSub.textContent = 'Evenimente înregistrate';
        renderRightSummary();
        return;
      }

      if (countPill) {
        countPill.textContent = historyAlerts.length;
        countPill.classList.remove('hidden');
      }
      state.activeAlertsCount = historyAlerts.filter(function(a) { return !a.is_resolved; }).length;
      if (alertSub) alertSub.textContent = historyAlerts.length + ' evenimente recente';

      var recentAlerts = historyAlerts.slice(0, 15);
      logBox.innerHTML = recentAlerts.map(function(alert) {
        var isCrit = alert.severity === 'critical';
        return [
          '<div class="alert-log-item">',
            '<div class="alert-log-header">',
              '<span class="alert-log-severity ' + (isCrit ? 'critical' : 'warning') + '" style="color:' + (isCrit ? '#E24B4A' : '#BA7517') + '">' + (isCrit ? 'CRITICĂ' : 'AVERTIZARE') + '</span>',
              '<span class="alert-log-time">' + formatSmallTime(alert.created_at) + '</span>',
            '</div>',
            '<div class="alert-log-message">' + (alert.message || '') + '</div>',
            alert.is_resolved ? '<div class="alert-log-resolved">✔ Rezolvat</div>' : '<div class="alert-log-active">⚠️ Activă</div>',
          '</div>'
        ].join('');
      }).join('');

      renderRightSummary();
    }
  } catch (e) {
    console.error('Eroare la încărcarea jurnalului de alerte:', e);
    logBox.innerHTML = '<div class="history-empty">Eroare la aducerea datelor.</div>';
  }
}

async function loadMaintenanceHistory(id) {
  try {
    var res = await window.authFetch('/reactors/' + id + '/maintenance/history');
    if (res.ok) {
      var history = await res.json();
      var state = ReactorDetailsState.getState();
      state.maintenanceHistory = Array.isArray(history) ? history : [];
      renderMaintenanceHistoryList(history);
    }
  } catch (err) {
    console.error('Eroare la încărcarea istoricului de mentenanță:', err);
    var container = document.getElementById('maintenance-history-list');
    if (container) container.innerHTML = '<div class="history-empty">Eroare la încărcarea datelor.</div>';
  }
}

function renderMaintenanceHistoryList(historyArray) {
  var container = document.getElementById('maintenance-history-list');
  if (!container) return;

  if (!historyArray || historyArray.length === 0) {
    container.innerHTML = '<div class="history-empty">Niciun istoric de mentenanță.</div>';
    return;
  }

  container.innerHTML = historyArray.map(function(item) {
    var isCompleted = item.is_completed;
    var startDate = new Date(item.started_at).toLocaleDateString('ro-RO');
    var reason = item.reason || 'Revizie generală';

    var statusColor = isCompleted ? 'color: var(--status-operational);' : 'color: var(--status-warning); font-weight: bold;';
    var statusText = isCompleted ? 'Finalizată' : 'În curs';

    var dateText = '';
    if (isCompleted) {
      var endDate = item.completed_at ? new Date(item.completed_at).toLocaleDateString('ro-RO') : 'N/A';
      dateText = 'Finalizat: ' + endDate;
    } else {
      var estDate = item.estimated_end_date ? new Date(item.estimated_end_date).toLocaleDateString('ro-RO') : 'N/A';
      dateText = 'Estimare finalizare: ' + estDate;
    }

    return [
      '<div class="alert-row maint-history-row">',
        '<div class="alert-sev ' + (isCompleted ? 'sev-info' : 'sev-warn') + '"></div>',
        '<div class="alert-body" style="flex:1;">',
          '<div class="alert-msg" style="display:flex;justify-content:space-between;align-items:center;">',
            '<span>' + reason + '</span>',
            '<span class="maint-history-status" style="' + statusColor + '">' + statusText + '</span>',
          '</div>',
          '<div class="maint-history-dates">',
            'Pornit: ' + startDate + '<span class="maint-history-separator">|</span> ' + dateText,
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');
}
