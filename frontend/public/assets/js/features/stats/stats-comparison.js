/*
 * frontend/public/assets/js/features/stats/stats-comparison.js
 * Statistics comparison table — renders efficiency, availability,
 * risk, wear, and trend delta per reactor. Sorts alphabetically,
 * computes trend delta vs average, and colour-codes rows by status.
 */
function renderComparison() {
  var refs = StatsState.getRefs();
  if (!refs.comparisonBody) return;

  var state = StatsState.getState();
  var comparison = (state.comparison || []).slice();
  if (!comparison.length) {
    refs.comparisonBody.innerHTML = '<tr><td colspan="6" style="padding:16px; color: var(--text-3);">Nu există date comparative.</td></tr>';
    return;
  }

  var wearMap = new Map();
  (state.wear || []).forEach(function(item) { wearMap.set(String(item.reactor_id), item); });
  var averageEfficiency = safeAverage(comparison.map(function(r) { return toNumber(r.efficiency); }));

  refs.comparisonBody.innerHTML = comparison
    .sort(function(left, right) { return String(left.name || '').localeCompare(String(right.name || ''), 'ro'); })
    .map(function(reactor) {
      var efficiency = clamp(toNumber(reactor.efficiency), 0, 100);
      var risk = toNumber(reactor.risk);
      var wearItem = wearMap.get(String(reactor.reactor_id));
      var wear = wearItem && wearItem.wear_percent !== null && wearItem.wear_percent !== undefined ? wearItem.wear_percent : Math.max(0, 100 - efficiency);
      var status = normalizeStatus(reactor.status);
      var rowConfig = getRowConfig(status);
      var trendDelta = efficiency - averageEfficiency;
      var trendText = trendDelta > 0.5 ? '↑ +' + formatPercent(trendDelta, 1) + '%' : trendDelta < -0.5 ? '↓ ' + formatPercent(Math.abs(trendDelta), 1) + '%' : '→';
      var availabilityScore = status === 'activ'
        ? efficiency
        : status === 'mentenanta'
          ? Math.min(100, efficiency * 0.6)
          : status === 'constructie'
            ? 0
            : status === 'alerta'
              ? Math.min(100, efficiency * 0.4)
              : 0;

      return '<tr class="' + rowConfig.rowClass + '">' +
        '<td class="fw-500 ' + rowConfig.textClass + '">' + escapeHtml(reactor.name) + '</td>' +
        '<td><span class="' + rowConfig.textClass + '">' + formatPercent(efficiency, 0) + '%</span></td>' +
        '<td>' + formatPercent(availabilityScore, 1) + '%</td>' +
        '<td><span class="' + (risk > 5 ? 'text-red' : risk > 2 ? 'text-amber' : 'text-green') + '">' + formatNumber(risk, 1) + '</span></td>' +
        '<td>' + formatPercent(wear, 0) + '%</td>' +
        '<td class="' + (trendDelta > 0.5 ? 'trend-up' : trendDelta < -0.5 ? 'trend-down' : 'trend-neutral') + '">' + escapeHtml(trendText) + '</td>' +
      '</tr>';
    }).join('');
}
