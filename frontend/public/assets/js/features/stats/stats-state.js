/*
 * stats-state.js — State management for the
 * reactor statistics page. Initialises shared
 * state, refs, ReportsAPI, and the main data
 * load-and-render loop. Extracted from
 * monolithic stats.js.
 */

var StatsState = (function() {
  var state = {
    days: 30,
    reactors: [],
    kpi: null,
    comparison: [],
    trend: [],
    riskMatrix: [],
    wear: []
  };

  var refs = {};

  function cacheRefs() {
    refs = {
      timeRange: document.getElementById('stats-time-range'),
      kpiGrid: document.getElementById('stats-kpi-grid'),
      efficiencyBars: document.getElementById('efficiency-bars'),
      trendTitle: document.getElementById('trend-title'),
      trendSubtitle: document.getElementById('trend-subtitle'),
      trendSvg: document.getElementById('trend-svg'),
      trendAxisLabels: document.getElementById('trend-axis-labels'),
      comparisonBody: document.getElementById('comparison-table-body'),
      riskMatrixWrap: document.getElementById('risk-matrix-wrap'),
      environmentGrid: document.getElementById('environment-grid'),
      wearList: document.getElementById('wear-list'),
      logoutBtn: document.getElementById('btn-logout')
    };
  }

  async function callApiFallback(path) {
    if (typeof window.authFetch !== 'function') throw new Error('Funcția authFetch nu este disponibilă în fereastră.');
    var resp = await window.authFetch(path, { method: 'GET' });
    if (!resp.ok) { var txt = await resp.text().catch(function() { return null; }); throw new Error(txt || 'HTTP ' + resp.status); }
    return await resp.json();
  }

  var ReportsAPI = {
    async getReactors() {
      if (window.NuclearAPI && typeof window.NuclearAPI.getReactors === 'function') return await window.NuclearAPI.getReactors();
      return await callApiFallback('/reactors');
    },
    async getKpi() {
      if (window.NuclearAPI && typeof window.NuclearAPI.getKpi === 'function') return await window.NuclearAPI.getKpi();
      return await callApiFallback('/reports/kpi');
    },
    async getComparison() {
      if (window.NuclearAPI && typeof window.NuclearAPI.getComparison === 'function') return await window.NuclearAPI.getComparison();
      return await callApiFallback('/reports/comparison');
    },
    async getEfficiencyTrend(days) {
      if (window.NuclearAPI && typeof window.NuclearAPI.getEfficiencyTrend === 'function') return await window.NuclearAPI.getEfficiencyTrend(days);
      return await callApiFallback('/reports/efficiency/trend?days=' + encodeURIComponent(days));
    },
    async getRiskMatrix() {
      if (window.NuclearAPI && typeof window.NuclearAPI.getRiskMatrix === 'function') return await window.NuclearAPI.getRiskMatrix();
      return await callApiFallback('/reports/risk-matrix');
    },
    async getWear() {
      if (window.NuclearAPI && typeof window.NuclearAPI.getWear === 'function') return await window.NuclearAPI.getWear();
      return await callApiFallback('/reports/wear');
    }
  };

  function setLoadingState() {
    if (refs.kpiGrid) {
      refs.kpiGrid.innerHTML =
        '<div class="kpi-card"><div class="kpi-label">Eficiență medie</div><div class="kpi-val text-green" id="kpi-efficiency-value">Se încarcă...</div><div class="kpi-desc trend-up" id="kpi-efficiency-desc">Preluare date live</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Energie produsă</div><div class="kpi-val text-purple" id="kpi-energy-value">Se încarcă...</div><div class="kpi-desc trend-up" id="kpi-energy-desc">Preluare date live</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Indice de risc</div><div class="kpi-val text-amber" id="kpi-risk-value">Se încarcă...</div><div class="kpi-desc trend-down" id="kpi-risk-desc">Preluare date live</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Disponibilitate</div><div class="kpi-val text-green" id="kpi-availability-value">Se încarcă...</div><div class="kpi-desc trend-neutral" id="kpi-availability-desc">Preluare date live</div></div>';
    }
    if (refs.efficiencyBars) refs.efficiencyBars.innerHTML = '<div class="bc-col" style="grid-column:1/-1; text-align:center; color: var(--text-3); padding-top: 24px;">Se încarcă datele din sistem...</div>';
    if (refs.trendSvg) refs.trendSvg.innerHTML = '';
    if (refs.trendAxisLabels) refs.trendAxisLabels.innerHTML = '';
    if (refs.comparisonBody) refs.comparisonBody.innerHTML = '<tr><td colspan="6" style="padding:16px; color: var(--text-3);">Se încarcă datele din sistem...</td></tr>';
    if (refs.riskMatrixWrap) refs.riskMatrixWrap.innerHTML = '<div style="padding:14px; color: var(--text-3);">Se încarcă matricea de risc...</div>';
    if (refs.environmentGrid) refs.environmentGrid.innerHTML = '<div style="grid-column:1/-1; padding:14px; color: var(--text-3);">Se încarcă condițiile operaționale...</div>';
    if (refs.wearList) refs.wearList.innerHTML = '<div style="padding:14px; color: var(--text-3);">Se încarcă uzura reactoarelor...</div>';
  }

  function renderFallback(error) {
    var msg = error && error.message ? error.message : 'Nu s-au putut încărca statisticile.';
    if (refs.kpiGrid) refs.kpiGrid.innerHTML = '<div class="kpi-card" style="grid-column:1/-1;"><div class="kpi-label">Eroare</div><div class="kpi-val text-red">Date indisponibile</div><div class="kpi-desc">' + escapeHtml(msg) + '</div></div>';
    if (refs.comparisonBody) refs.comparisonBody.innerHTML = '<tr><td colspan="6" style="padding:16px; color: var(--red);">' + escapeHtml(msg) + '</td></tr>';
    if (refs.efficiencyBars) refs.efficiencyBars.innerHTML = '<div class="bc-col" style="grid-column:1/-1; text-align:center; color: var(--red); padding-top: 24px;">' + escapeHtml(msg) + '</div>';
    if (refs.riskMatrixWrap) refs.riskMatrixWrap.innerHTML = '<div style="padding:14px; color: var(--red);">' + escapeHtml(msg) + '</div>';
    if (refs.environmentGrid) refs.environmentGrid.innerHTML = '<div style="grid-column:1/-1; padding:14px; color: var(--red);">' + escapeHtml(msg) + '</div>';
    if (refs.wearList) refs.wearList.innerHTML = '<div style="padding:14px; color: var(--red);">' + escapeHtml(msg) + '</div>';
  }

  async function loadDashboard() {
    setLoadingState();
    try {
      var results = await Promise.allSettled([
        ReportsAPI.getReactors(),
        ReportsAPI.getKpi(),
        ReportsAPI.getComparison(),
        ReportsAPI.getEfficiencyTrend(state.days),
        ReportsAPI.getRiskMatrix(),
        ReportsAPI.getWear()
      ]);
      state.reactors = unwrapSettled(results[0], []);
      state.kpi = unwrapSettled(results[1], null);
      state.comparison = unwrapSettled(results[2], []);
      state.trend = unwrapSettled(results[3], []);
      state.riskMatrix = unwrapSettled(results[4], []);
      state.wear = unwrapSettled(results[5], []);
      renderAll();
    } catch (error) {
      console.error('Eroare la încărcarea statisticilor:', error);
      renderFallback(error);
    }
  }

  function bindTimeRange() {
    if (!refs.timeRange) return;
    refs.timeRange.querySelectorAll('.tr').forEach(function(button) {
      button.addEventListener('click', function() {
        var nextDays = Number(button.dataset.days || 30);
        state.days = Number.isFinite(nextDays) ? nextDays : 30;
        refs.timeRange.querySelectorAll('.tr').forEach(function(item) { item.classList.remove('active'); });
        button.classList.add('active');
        loadDashboard();
      });
    });
  }

  function bindLogout() {
    if (!refs.logoutBtn) return;
    refs.logoutBtn.addEventListener('click', async function() {
      try { if (typeof window.authFetch === 'function') await window.authFetch('/auth/logout', { method: 'POST' }); }
      catch (e) { console.warn('Logout request failed:', e); }
      finally { window.location.href = 'login.html'; }
    });
  }

  function init() {
    cacheRefs();
    bindTimeRange();
    bindLogout();
    loadDashboard();
  }

  return {
    init: init,
    getState: function() { return state; },
    getRefs: function() { return refs; },
    loadDashboard: loadDashboard,
    ReportsAPI: ReportsAPI
  };
})();
