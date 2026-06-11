/*
 * reactor-details-state.js — State management
 * for the reactor details page. Initializes
 * shared state, loads reactor data, and
 * provides auto-refresh. Extracted from the
 * monolithic reactor-details.js.
 */

var ReactorDetailsState = (function() {
  var state = {
    currentReactor: null,
    pendingStatus: null,
    sensorReadings: [],
    alertHistory: [],
    maintenanceHistory: [],
    selectedPeriodDays: 30,
    activeAlertsCount: 0
  };

  var refs = {};

  function cacheRefs() {
    refs = {
      layout: document.getElementById('reactor-details-layout'),
      errorContainer: document.getElementById('error-container'),
      summarySubtitle: document.getElementById('reactor-summary-subtitle'),
      summaryReadingsCount: document.getElementById('summary-readings-count'),
      summaryAverageReading: document.getElementById('summary-average-reading'),
      summaryAlertsCount: document.getElementById('summary-alerts-count'),
      summaryCriticalCount: document.getElementById('summary-critical-count'),
      summarySensorsCount: document.getElementById('summary-sensors-count'),
      summaryLastReading: document.getElementById('summary-last-reading')
    };
  }

  function showError() {
    if (refs.layout) refs.layout.classList.add('hidden');
    if (refs.errorContainer) refs.errorContainer.classList.remove('hidden');
  }

  async function autoRefresh() {
    if (!state.currentReactor) return;
    try {
      var reactors = await window.NuclearAPI.getReactors();
      var updated = reactors.find(function(r) { return r.id.toString() === state.currentReactor.id.toString(); });
      if (!updated) return;
      state.currentReactor = updated;
      if (typeof renderReactorDetails === 'function') renderReactorDetails(updated);
      if (typeof renderSensors === 'function') renderSensors(updated.sensors || []);
    } catch (err) {
      console.warn('Refresh eșuat:', err);
    }
  }

  async function init() {
    document.documentElement.style.visibility = 'hidden';
    cacheRefs();

    var params = new URLSearchParams(window.location.search);
    var reactorId = params.get('id');

    if (!reactorId) {
      try {
        var meRes = await authFetch('/auth/me', { method: 'GET' });
        if (!meRes.ok) { showError(); return; }
        var me = await meRes.json();
        if (me.role !== 'manager' && me.role !== 'admin') { showError(); return; }
        var reactorRes = await authFetch('/reactors/my', { method: 'GET' });
        if (!reactorRes.ok) { showError(); return; }
        var reactor = await reactorRes.json();
        reactorId = reactor.id;
      } catch (e) { showError(); return; }
    }

    document.documentElement.style.visibility = '';

    try {
      var reactors = await window.NuclearAPI.getReactors();
      state.currentReactor = reactors.find(function(r) { return r.id.toString() === reactorId.toString(); });

      if (!state.currentReactor) { showError(); return; }

      if (typeof renderReactorDetails === 'function') renderReactorDetails(state.currentReactor);
      if (typeof renderSensors === 'function') renderSensors(state.currentReactor.sensors || []);
      if (typeof populateHistoryFilter === 'function') populateHistoryFilter(state.currentReactor.sensors || []);

      if (typeof loadReactorSpecificAlerts === 'function') await loadReactorSpecificAlerts(state.currentReactor.id);
      if (typeof loadMaintenanceHistory === 'function') await loadMaintenanceHistory(state.currentReactor.id);
      if (typeof loadSensorHistory === 'function') await loadSensorHistory();

      if (refs.layout) {
        refs.layout.classList.remove('hidden');
        refs.layout.style.display = 'grid';
      }

      if (typeof bindReactorEvents === 'function') bindReactorEvents();

      setInterval(autoRefresh, 10000);
    } catch (err) {
      console.error('Eroare critică:', err);
      showError();
    }
  }

  function getState() { return state; }
  function getRefs() { return refs; }

  return {
    init: init,
    getState: getState,
    getRefs: getRefs,
    autoRefresh: autoRefresh,
    showError: showError
  };
})();
