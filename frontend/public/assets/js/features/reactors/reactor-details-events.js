/*
 * reactor-details-events.js — Event binding
 * for the reactor details page. Handles tabs,
 * modals, status changes, maintenance actions,
 * and sensor CRUD. Extracted from the
 * monolithic reactor-details.js.
 */

function bindReactorEvents() {
  var state = ReactorDetailsState.getState();

  /* ── Tabs ── */
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      e.target.classList.add('active');

      var targetId = e.target.getAttribute('data-target');
      if (targetId) {
        document.getElementById(targetId)?.classList.add('active');
      }

      if (targetId === 'tab-istoric') {
        var selectedSensorId = document.getElementById('filter-sensor')?.value || null;
        loadSensorHistory(selectedSensorId || null);
      }
    });
  });

  /* ── Sensor filter ── */
  document.getElementById('filter-sensor')?.addEventListener('change', function(e) {
    var sensorId = e.target.value || null;
    loadSensorHistory(sensorId);
  });

  /* ── Period buttons ── */
  document.querySelectorAll('.period-btn').forEach(function(button) {
    button.addEventListener('click', function() {
      state.selectedPeriodDays = Number(button.dataset.days || 30);
      renderRightSummary();
    });
  });

  /* ── Modal close ── */
  document.querySelectorAll('.btn-close-modal, .modal-overlay').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-close-modal')) {
        document.querySelectorAll('.modal-overlay').forEach(function(m) { m.classList.remove('open'); });
      }
    });
  });

  /* ── Status change modal ── */
  var openStatusModal = function(newStatus, title, icon, warning) {
    var statusSelect = document.getElementById('status-select');
    state.pendingStatus = newStatus ? normalizeStatusChoice(newStatus) : normalizeStatusChoice(state.currentReactor?.status);

    setElText('modal-status-icon', icon);
    setElText('modal-status-title', title);

    if (statusSelect) statusSelect.value = state.pendingStatus;

    var warnEl = document.getElementById('modal-status-warning');
    if (warnEl) {
      if (warning) { warnEl.textContent = warning; warnEl.classList.remove('hidden'); }
      else { warnEl.classList.add('hidden'); }
    }

    document.getElementById('modal-status')?.classList.add('open');
  };

  document.getElementById('btn-change-status')?.addEventListener('click', function() {
    openStatusModal(null, 'Schimbare status', '🔄', 'Alegeți statusul dorit și confirmați.');
  });

  document.getElementById('modal-status-confirm')?.addEventListener('click', async function() {
    document.getElementById('modal-status')?.classList.remove('open');
    var statusSelect = document.getElementById('status-select');
    var chosenStatus = statusSelect ? statusSelect.value : state.pendingStatus;

    try {
      var updated = await window.NuclearAPI.updateReactorStatus(state.currentReactor.id, chosenStatus);
      if (updated) {
        state.currentReactor.status = chosenStatus;
        renderReactorDetails(state.currentReactor);
        showToast('Status actualizat: ' + getStatusLabel(chosenStatus));
      }
    } catch (err) {
      console.error(err);
      showToast('Eroare la actualizare status.', 'error');
    }
  });

  /* ── Maintenance modal ── */
  var openMaintModal = function() {
    document.getElementById('maint-date').value = '';
    document.getElementById('maint-reason').value = '';
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('maint-date').setAttribute('min', today);
    document.getElementById('modal-start-maint')?.classList.add('open');
  };

  document.getElementById('btn-maint')?.addEventListener('click', openMaintModal);
  document.getElementById('btn-schedule-maint')?.addEventListener('click', openMaintModal);

  document.getElementById('modal-maint-confirm')?.addEventListener('click', async function() {
    var endDate = document.getElementById('maint-date').value;
    var reason = document.getElementById('maint-reason').value;

    if (!endDate) { showToast('Data estimată de finalizare este obligatorie.', 'error'); return; }

    document.getElementById('modal-start-maint').classList.remove('open');

    try {
      var res = await window.authFetch('/reactors/' + state.currentReactor.id + '/maintenance/start', {
        method: 'POST',
        body: JSON.stringify({ estimated_end_date: endDate, reason: reason || null })
      });

      if (res.ok) {
        showToast('Reactorul a intrat în mentenanță.');
        state.currentReactor.status = 'Mentenanta';
        renderReactorDetails(state.currentReactor);
        await loadMaintenanceHistory(state.currentReactor.id);
      } else {
        var data = await res.json();
        throw new Error(data.error || 'Eroare la pornirea mentenanței.');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-finish-maint')?.addEventListener('click', async function() {
    if (!confirm('Sunteți sigur că mentenanța a fost finalizată? Reactorul va deveni activ.')) return;

    try {
      var res = await window.authFetch('/reactors/' + state.currentReactor.id + '/maintenance/stop', { method: 'POST' });

      if (res.ok) {
        showToast('Mentenanță finalizată. Reactor activat.');
        state.currentReactor.status = 'Activ';
        renderReactorDetails(state.currentReactor);
        await loadMaintenanceHistory(state.currentReactor.id);
      } else {
        var data = await res.json();
        throw new Error(data.error || 'Eroare la finalizarea mentenanței.');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });

  /* ── Add sensor ── */
  var fetchedSensorProfiles = {};
  var sensorTypeSelect = document.getElementById('sensor-type');
  var btnAddConfirm = document.getElementById('modal-add-sensor-confirm');

  var fetchSensorTypes = async function() {
    if (Object.keys(fetchedSensorProfiles).length > 0) return;
    try {
      var res = await window.authFetch('/sensors/types', { method: 'GET' });
      if (res.ok) {
        fetchedSensorProfiles = await res.json();
        if (sensorTypeSelect) {
          sensorTypeSelect.innerHTML = '<option value="" disabled selected>Alege tipul...</option>';
          for (var type in fetchedSensorProfiles) {
            if (fetchedSensorProfiles.hasOwnProperty(type)) {
              sensorTypeSelect.innerHTML += '<option value="' + type + '">' + type + '</option>';
            }
          }
        }
      }
    } catch (err) { console.error('Eroare preluare senzori', err); }
  };

  document.getElementById('btn-add-sensor')?.addEventListener('click', function() {
    fetchSensorTypes();
    if (sensorTypeSelect) sensorTypeSelect.value = '';
    document.getElementById('sensor-min').value = '';
    document.getElementById('sensor-max').value = '';
    if (btnAddConfirm) btnAddConfirm.disabled = true;
    document.getElementById('modal-add-sensor')?.classList.add('open');
  });

  sensorTypeSelect?.addEventListener('change', function(e) {
    var profile = fetchedSensorProfiles[e.target.value];
    if (profile) {
      document.getElementById('sensor-min').value = profile.defaultMin;
      document.getElementById('sensor-max').value = profile.defaultMax;
      if (btnAddConfirm) btnAddConfirm.disabled = false;
    }
  });

  btnAddConfirm?.addEventListener('click', async function() {
    var type = sensorTypeSelect?.value;
    var minSafe = document.getElementById('sensor-min')?.value;
    var maxSafe = document.getElementById('sensor-max')?.value;

    if (minSafe === '' || maxSafe === '') { showToast('Introduceți limitele de siguranță.', 'error'); return; }

    document.getElementById('modal-add-sensor')?.classList.remove('open');
    try {
      var payload = {
        sensor_type: type,
        min_safe_value: parseFloat(minSafe),
        max_safe_value: parseFloat(maxSafe)
      };

      var res = await window.authFetch('/reactors/' + state.currentReactor.id + '/sensors', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Senzor adăugat cu succes.');
        var updatedReactors = await window.NuclearAPI.getReactors();
        state.currentReactor = updatedReactors.find(function(r) { return r.id.toString() === state.currentReactor.id.toString(); });
        if (state.currentReactor) {
          renderSensors(state.currentReactor.sensors || []);
          populateHistoryFilter(state.currentReactor.sensors || []);
        }
      } else {
        throw new Error('Eroare adăugare senzor');
      }
    } catch (err) {
      console.error(err);
      showToast('Eroare la adăugarea senzorului.', 'error');
    }
  });
}
