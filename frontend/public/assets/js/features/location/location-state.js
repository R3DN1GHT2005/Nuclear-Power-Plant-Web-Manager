/*
 * location-state.js — State management for the
 * location/ map page. Initializes shared state,
 * refs, polling, and the main fetch-and-render
 * loop. Extracted from the monolithic location.js.
 */

var LocationState = (function() {
  var pollingIntervalMs = 5000;

  var state = {
    reactors: [],
    sensors: [],
    pollingId: null,
    map: null,
    pickerMap: null,
    pickerMarker: null,
    activeSensorReactorId: null,
    editingSensorId: null,
    selectedStatusReactorId: null,
    sensorTypeProfiles: {},
    sensorTypesLoaded: false,
    sensorTypesLoading: null
  };

  var refs = {};

  function cacheRefs() {
    refs = {
      reactorList: document.getElementById('reactor-list'),
      lastRefresh: document.getElementById('last-refresh-pill'),
      openAddButton: document.getElementById('open-add-reactor'),
      reactorModal: document.getElementById('reactor-modal'),
      closeReactorModalBtn: document.getElementById('close-reactor-modal'),
      cancelReactorModalBtn: document.getElementById('cancel-reactor-modal'),
      form: document.getElementById('reactor-form'),
      formError: document.getElementById('reactor-form-error'),
      submitButton: document.getElementById('submit-reactor-btn'),
      openPickerButton: document.getElementById('open-picker'),
      pickerModal: document.getElementById('picker-modal'),
      closePickerModalBtn: document.getElementById('close-picker-modal'),
      totalPowerValue: document.getElementById('stat-total-power'),
      totalReactorsValue: document.getElementById('stat-total-reactors'),
      typeTotalValue: document.getElementById('stat-type-total'),
      statusTotalValue: document.getElementById('stat-status-total'),
      typeList: document.getElementById('stats-type-list'),
      statusList: document.getElementById('stats-status-list'),
      latitudeInput: document.getElementById('latitude'),
      longitudeInput: document.getElementById('longitude'),
      nameInput: document.getElementById('name'),
      locationNameInput: document.getElementById('location_name'),
      reactorTypeInput: document.getElementById('reactor_type'),
      installedPowerInput: document.getElementById('installed_power'),
      webhookUrlInput: document.getElementById('webhook_url'),
      macAddressInput: document.getElementById('mac_address'),
      toast: document.getElementById('toast-success'),
      mapContainer: document.getElementById('reactors-map'),
      sensorModal: document.getElementById('sensor-modal'),
      sensorModalSubtitle: document.getElementById('sensor-modal-subtitle'),
      closeSensorModalBtn: document.getElementById('close-sensor-modal'),
      sensorError: document.getElementById('sensor-form-error'),
      sensorCountPill: document.getElementById('sensor-count-pill'),
      sensorListBody: document.getElementById('sensor-list-body'),
      sensorForm: document.getElementById('sensor-form'),
      sensorTypeInput: document.getElementById('sensor_type'),
      sensorUnitInput: document.getElementById('sensor_unit'),
      sensorMinInput: document.getElementById('min_safe_value'),
      sensorMaxInput: document.getElementById('max_safe_value'),
      submitSensorButton: document.getElementById('submit-sensor-btn'),
      statusModal: document.getElementById('status-modal'),
      statusModalSubtitle: document.getElementById('status-modal-subtitle'),
      closeStatusModalBtn: document.getElementById('close-status-modal'),
      cancelStatusModalBtn: document.getElementById('cancel-status-modal'),
      confirmStatusModalBtn: document.getElementById('confirm-status-modal'),
      statusSelect: document.getElementById('status-select')
    };
  }

  function getHeaders() {
    if (typeof getAuthHeaders === 'function') {
      var h = getAuthHeaders();
      if (h && h.Authorization === '') { delete h.Authorization; }
      return h;
    }
    var h = { 'Content-Type': 'application/json' };
    var token = localStorage.getItem('access_token');
    if (token) { h.Authorization = 'Bearer ' + token; }
    return h;
  }

  function getReactorById(reactorId) {
    var found = null;
    for (var i = 0; i < state.reactors.length; i++) {
      if (Number(state.reactors[i].id) === Number(reactorId)) { found = state.reactors[i]; break; }
    }
    return found;
  }

  async function refreshReactors() {
    try {
      var raw = await NuclearAPI.getReactors();
      var reactors = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      state.reactors = reactors;
      if (typeof renderMarkers === 'function') renderMarkers(reactors);
      if (typeof renderStatusCards === 'function') renderStatusCards(reactors);
      if (typeof renderReactorList === 'function') renderReactorList(reactors);
      var stats;
      if (typeof calculateReactorStats === 'function') { stats = calculateReactorStats(reactors); }
      else { stats = createEmptyStats(); }
      if (typeof renderReactorStats === 'function') renderReactorStats(stats);
      if (typeof updateLastRefresh === 'function') updateLastRefresh();
    } catch (error) {
      console.error('refreshReactors: EROARE', error);
      if (typeof renderReactorStats === 'function') renderReactorStats(createEmptyStats());
    }
  }

  function startPolling() {
    stopPolling();
    state.pollingId = window.setInterval(refreshReactors, pollingIntervalMs);
  }

  function stopPolling() {
    if (state.pollingId) { window.clearInterval(state.pollingId); state.pollingId = null; }
  }

  function showToast() {
    refs.toast.classList.add('show');
    window.setTimeout(function() { refs.toast.classList.remove('show'); }, 2600);
  }

  function showToastMessage(message) {
    refs.toast.textContent = message;
    showToast();
  }

  async function submitStatusChange(reactorId, statusValue) {
    var targetId = reactorId || state.selectedStatusReactorId;
    if (!targetId) return;
    var reactor = getReactorById(targetId);
    if (!reactor) { showToastMessage('Reactorul nu a fost găsit.'); return; }
    var nextStatus = statusValue || (refs.statusSelect ? refs.statusSelect.value : null) || normalizeStatusChoice(reactor.status);
    try {
      var updated = await window.NuclearAPI.updateReactorStatus(reactor.id, nextStatus);
      if (updated) {
        if (refs.statusModal) closeModal(refs.statusModal);
        showToastMessage('Status actualizat: ' + getStatusLabel(nextStatus));
        await refreshReactors();
      }
    } catch (error) {
      console.error(error);
      showToastMessage(error.message || 'Eroare la actualizarea statusului.', 'error');
    }
  }

  function init() {
    if (!window.L) { console.error('Leaflet nu este încărcat.'); return; }
    cacheRefs();
    if (typeof initMainMap === 'function') initMainMap();
    if (typeof bindEvents === 'function') bindEvents();
    window.requestAnimationFrame(function() {
      if (state.map && typeof state.map.invalidateSize === 'function') state.map.invalidateSize();
    });
    window.addEventListener('resize', function() {
      if (state.map && typeof state.map.invalidateSize === 'function') state.map.invalidateSize();
    });
    refreshReactors();
    startPolling();
  }

  return {
    init: init,
    getState: function() { return state; },
    getRefs: function() { return refs; },
    getHeaders: getHeaders,
    getReactorById: getReactorById,
    refreshReactors: refreshReactors,
    startPolling: startPolling,
    stopPolling: stopPolling,
    submitStatusChange: submitStatusChange,
    showToast: showToast,
    showToastMessage: showToastMessage,
    showFormError: function(msg) { refs.formError.textContent = msg; refs.formError.classList.add('show'); },
    hideFormError: function() { refs.formError.textContent = ''; refs.formError.classList.remove('show'); },
    showSensorError: function(msg) { refs.sensorError.textContent = msg; refs.sensorError.classList.add('show'); },
    hideSensorError: function() { refs.sensorError.textContent = ''; refs.sensorError.classList.remove('show'); }
  };
})();
