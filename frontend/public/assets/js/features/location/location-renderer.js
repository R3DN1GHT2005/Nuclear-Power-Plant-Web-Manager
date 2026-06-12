/*
 * frontend/public/assets/js/features/location/location-renderer.js
 * Location page renderer — builds the reactor list, status-summary
 * cards, and live statistics panels (type/status distribution bars).
 * Normalises reactor types and calculates aggregated stats like
 * total power and count by type and status.
 */
function normalizeReactorType(type) {
  return String(type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function createEmptyStats() {
  return {
    totalPower: 0,
    totalReactors: 0,
    typeCounts: { CANDU: 0, SMR: 0, PWR: 0, OTHER: 0 },
    statusCounts: {
      activ: 0,
      mentenanta: 0,
      constructie: 0,
      oprit: 0,
      alerta: 0,
      other: 0
    }
  };
}

function getTypeLabel(typeKey) {
  var labels = { CANDU: 'CANDU', SMR: 'SMR', PWR: 'PWR', OTHER: 'Alt tip' };
  return labels[typeKey] || 'Alt tip';
}

function calculateReactorStats(reactors) {
  var stats = createEmptyStats();
  reactors.forEach(function(reactor) {
    stats.totalReactors += 1;
    stats.totalPower += safeNumber(reactor.installed_power, 0);
    var typeKey = normalizeReactorType(reactor.reactor_type);
    if (stats.typeCounts.hasOwnProperty(typeKey)) { stats.typeCounts[typeKey] += 1; }
    else { stats.typeCounts.OTHER += 1; }
    var statusKey = getStatusBucket(normalizeStatus(reactor.status));
    stats.statusCounts[statusKey] += 1;
  });
  return stats;
}

function renderStatsList(target, entries, total) {
  if (!target) return;
  if (!entries.length) { target.innerHTML = '<div class="sensor-empty">Nu există date pentru această categorie.</div>'; return; }
  target.innerHTML = entries.map(function(entry) {
    var pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
    return '<div class="stats-row">' +
      '<div class="stats-row-head">' +
        '<strong>' + escapeHtml(entry.label) + '</strong>' +
        '<span>' + entry.value + ' · ' + pct + '%</span>' +
      '</div>' +
      '<div class="stats-track" aria-hidden="true">' +
        '<div class="stats-fill ' + escapeHtml(entry.fillClass) + '" style="width:' + pct + '%"></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderReactorStats(stats) {
  var refs = LocationState.getRefs();
  var safeStats = stats || createEmptyStats();
  var typeTotal = Object.values(safeStats.typeCounts).reduce(function(s, v) { return s + v; }, 0);
  var statusTotal = Object.values(safeStats.statusCounts).reduce(function(s, v) { return s + v; }, 0);

  if (refs.totalPowerValue) refs.totalPowerValue.textContent = formatPower(safeStats.totalPower);
  if (refs.totalReactorsValue) refs.totalReactorsValue.textContent = String(safeStats.totalReactors);
  if (refs.typeTotalValue) refs.typeTotalValue.textContent = typeTotal + '/' + safeStats.totalReactors;
  if (refs.statusTotalValue) refs.statusTotalValue.textContent = statusTotal + '/' + safeStats.totalReactors;

  renderStatsList(refs.typeList, [
    { label: getTypeLabel('CANDU'), value: safeStats.typeCounts.CANDU, fillClass: 'type-candu' },
    { label: getTypeLabel('SMR'), value: safeStats.typeCounts.SMR, fillClass: 'type-smr' },
    { label: getTypeLabel('PWR'), value: safeStats.typeCounts.PWR, fillClass: 'type-pwr' },
    { label: getTypeLabel('OTHER'), value: safeStats.typeCounts.OTHER, fillClass: 'type-other' }
  ], Math.max(safeStats.totalReactors, 1));

  renderStatsList(refs.statusList, [
    { label: getStatusLabel('activ'), value: safeStats.statusCounts.activ, fillClass: 'status-activ' },
    { label: getStatusLabel('mentenanta'), value: safeStats.statusCounts.mentenanta, fillClass: 'status-mentenanta' },
    { label: getStatusLabel('constructie'), value: safeStats.statusCounts.constructie, fillClass: 'status-constructie' },
    { label: getStatusLabel('oprit'), value: safeStats.statusCounts.oprit, fillClass: 'status-oprit' },
    { label: getStatusLabel('alerta'), value: safeStats.statusCounts.alerta, fillClass: 'status-alerta' },
    { label: getStatusLabel('other'), value: safeStats.statusCounts.other, fillClass: 'status-other' }
  ], Math.max(safeStats.totalReactors, 1));
}

function renderReactorList(reactors) {
  var refs = LocationState.getRefs();
  if (!reactors.length) {
    refs.reactorList.innerHTML = '<div class="reactor-list-item"><span>Nu există reactoare disponibile.</span></div>';
    return;
  }
  refs.reactorList.innerHTML = reactors.map(function(reactor) {
    var visual = statusVisual(reactor.status);
    var power = safeNumber(reactor.installed_power).toFixed(2);
    var efficiency = safeNumber(reactor.current_efficiency).toFixed(2);
    return '<div class="reactor-list-item">' +
      '<div><strong>' + escapeHtml(reactor.name || '-') + '</strong><br>' +
      '<span>' + escapeHtml(reactor.location_name || '-') + ' · ' + power + ' MW · ' + efficiency + '%</span></div>' +
      '<span class="badge-status ' + visual.badgeClass + '">' + escapeHtml(reactor.status || '-') + '</span>' +
    '</div>';
  }).join('');
}

function updateLastRefresh() {
  var refs = LocationState.getRefs();
  refs.lastRefresh.textContent = 'Ultima actualizare: ' + new Date().toLocaleTimeString('ro-RO');
}

function renderStatusCards(reactors) {
  var container = document.getElementById('status-cards');
  if (!container) return;

  var list = Array.isArray(reactors) ? reactors : [];
  var totalPower = list.reduce(function(s, r) { return s + safeNumber(r.installed_power, 0); }, 0);
  var totalReactors = list.length;

  var typeBuckets = list.reduce(function(acc, reactor) {
    var typeKey = normalizeReactorType(reactor.reactor_type);
    if (typeKey === 'CANDU') acc.candu += 1;
    else if (typeKey === 'SMR') acc.smr += 1;
    else if (typeKey === 'PWR' || typeKey === 'EPR' || typeKey === 'BWR') acc.pwr += 1;
    else acc.other += 1;
    return acc;
  }, { candu: 0, smr: 0, pwr: 0, other: 0 });

  var statusBuckets = list.reduce(function(acc, reactor) {
    var statusKey = getStatusBucket(normalizeStatus(reactor.status));
    if (acc[statusKey] !== undefined) acc[statusKey] += 1;
    return acc;
  }, { activ: 0, mentenanta: 0, constructie: 0, oprit: 0, alerta: 0, other: 0 });

  var avgSeismic = list.length ? list.reduce(function(s, r) { return s + safeNumber(r.seismic_risk, 0); }, 0) / list.length : 0;
  var seismic10 = avgSeismic > 10 ? avgSeismic / 10 : avgSeismic;

  container.innerHTML =
    '<div class="status-summary-item status-summary-item--power">' +
      '<div class="status-summary-label">Putere totală</div>' +
      '<div class="status-summary-value">' + formatPower(totalPower) + '</div>' +
      '<div class="status-summary-note">' + totalReactors + ' reactoare în calcul</div>' +
    '</div>' +
    '<div class="status-summary-item status-summary-item--types">' +
      '<div class="status-summary-label">Tipuri</div>' +
      '<div class="status-summary-value">' + typeBuckets.candu + '/' + typeBuckets.smr + '/' + typeBuckets.pwr + '/' + typeBuckets.other + '</div>' +
      '<div class="status-summary-note">CANDU / SMR / PWR / Alte tipuri</div>' +
    '</div>' +
    '<div class="status-summary-item status-summary-item--status">' +
      '<div class="status-summary-label">Status</div>' +
      '<div class="status-summary-value">' + statusBuckets.activ + ' active</div>' +
      '<div class="status-summary-note">' + statusBuckets.mentenanta + ' mentenanță · ' + statusBuckets.constructie + ' construcție · ' + statusBuckets.oprit + ' oprite</div>' +
    '</div>' +
    '<div class="status-summary-item status-summary-item--risk">' +
      '<div class="status-summary-label">Risc seismic mediu</div>' +
      '<div class="status-summary-value">' + seismic10.toFixed(3) + ' / 10</div>' +
      '<div class="status-summary-note">Scală normalizată din datele senzorilor</div>' +
    '</div>';
}
