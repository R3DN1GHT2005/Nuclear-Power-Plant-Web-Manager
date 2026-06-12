/*
 * frontend/public/assets/js/features/stats/stats-kpi.js
 * Statistics KPI orchestrator — computes and renders KPI cards (avg
 * efficiency, estimated energy output, avg risk, availability), then
 * calls all sub-renderers: efficiency bars, trend, comparison, risk
 * matrix, environment, and wear.
 */
function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderKpis() {
  var state = StatsState.getState();
  var comparison = Array.isArray(state.comparison) ? state.comparison : [];
  var reactors = Array.isArray(state.reactors) ? state.reactors : [];
  var totalReactors = comparison.length || reactors.length;
  var activeReactors = comparison.filter(function(r) { return normalizeStatus(r.status) === 'activ'; }).length;
  var activeComparison = comparison.filter(function(r) { return normalizeStatus(r.status) === 'activ'; });

  var averageEfficiency = Number(state.kpi && state.kpi.avg_efficiency !== null && state.kpi.avg_efficiency !== undefined ? state.kpi.avg_efficiency : safeAverage(comparison.map(function(r) { return r.efficiency; })));
  var averageRiskRaw = Number(state.kpi && state.kpi.avg_risk !== null && state.kpi.avg_risk !== undefined ? state.kpi.avg_risk : safeAverage(comparison.map(function(r) { return r.risk; })));
  var averageRisk = averageRiskRaw > 10 ? averageRiskRaw / 10 : averageRiskRaw;
  var availability = totalReactors > 0 ? (activeReactors / totalReactors) * 100 : 0;

  var activeInstalledPower = activeComparison.reduce(function(s, r) { return s + toNumber(r.installed_power); }, 0);
  var energyTWh = (activeInstalledPower * (averageEfficiency / 100) * (state.days * 24)) / 1000000;

  setText('kpi-efficiency-value', formatPercent(averageEfficiency, 1) + '%');
  setText('kpi-efficiency-desc', activeReactors + ' reactoare active în calcul');
  setText('kpi-energy-value', formatNumber(energyTWh, 2) + ' TWh');
  setText('kpi-energy-desc', 'Estimare pentru ' + formatDays(state.days) + ' din reactoarele active');
  setText('kpi-risk-value', formatPercent(averageRisk, 1) + ' / 10');
  setText('kpi-risk-desc', 'Media riscului seismic din rețea');
  setText('kpi-availability-value', formatPercent(availability, 1) + '%');
  setText('kpi-availability-desc', activeReactors + ' / ' + totalReactors + ' reactoare active');

  setText('trend-title', 'Trend eficiență medie — ' + formatDays(state.days));
  setText('trend-subtitle', 'Centrala în ansamblu · ' + formatDays(state.days));
  setText('efficiency-bars-subtitle', formatDays(state.days) + ' · comparativ cu ținta de 90%');
  setText('comparison-subtitle', 'Principali indicatori de performanță · ' + formatDays(state.days));
  setText('risk-subtitle', 'Probabilitate × Impact · ' + formatDays(state.days));
  setText('environment-subtitle', 'Date live din senzori · ' + formatDays(state.days));
  setText('wear-subtitle', 'Estimare bazată pe ore funcționare și mentenanță · ' + formatDays(state.days));
  setText('stats-page-subtitle', 'Performanță, eficiență, risc și uzură · ' + formatDays(state.days));
}

function renderAll() {
  renderKpis();
  if (typeof renderEfficiencyBars === 'function') renderEfficiencyBars();
  if (typeof renderTrend === 'function') renderTrend();
  if (typeof renderComparison === 'function') renderComparison();
  if (typeof renderRiskMatrix === 'function') renderRiskMatrix();
  if (typeof renderEnvironment === 'function') renderEnvironment();
  if (typeof renderWear === 'function') renderWear();
}
