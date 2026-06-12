/*
 * frontend/public/assets/js/features/stats/stats-efficiency.js
 * Statistics efficiency charts — draws horizontal bar charts for
 * reactor efficiency and an SVG polyline trend chart with grid lines,
 * axis labels, and date formatting. Colour-codes bars by status.
 */
function formatTrendLabel(value) {
  if (!value) return '—';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

function buildAxisIndexes(length) {
  if (length <= 1) return [0, 0, 0, 0, 0];
  var indexes = [0, Math.floor((length - 1) * 0.25), Math.floor((length - 1) * 0.5), Math.floor((length - 1) * 0.75), length - 1];
  var unique = [];
  for (var i = 0; i < indexes.length; i++) {
    if (unique.indexOf(indexes[i]) === -1) unique.push(indexes[i]);
  }
  return unique;
}

function renderEfficiencyBars() {
  var refs = StatsState.getRefs();
  if (!refs.efficiencyBars) return;

  var state = StatsState.getState();
  var reactors = (state.comparison || []).slice().sort(function(left, right) {
    return toNumber(right.efficiency) - toNumber(left.efficiency);
  });

  if (!reactors.length) {
    refs.efficiencyBars.innerHTML = '<div class="bc-col" style="grid-column:1/-1; text-align:center; color: var(--text-3); padding-top: 24px;">Nu există date pentru reactoare.</div>';
    return;
  }

  refs.efficiencyBars.innerHTML = reactors.map(function(reactor) {
    var efficiency = clamp(toNumber(reactor.efficiency), 0, 100);
    var status = normalizeStatus(reactor.status);
    var style = getStatusStyle(status, efficiency);
    var height = Math.max(4, Math.round(efficiency));
    var label = getReactorShortLabel(reactor.name, reactor.reactor_id);
    return '<div class="bc-col">' +
      '<div class="bc-val ' + style.textClass + '">' + formatPercent(efficiency, 0) + '%</div>' +
      '<div class="bc-bar ' + style.barClass + '" style="height:' + height + 'px;"></div>' +
      '<div class="bc-lbl">' + escapeHtml(label) + '</div>' +
    '</div>';
  }).join('');
}

function renderTrend() {
  var refs = StatsState.getRefs();
  if (!refs.trendSvg || !refs.trendAxisLabels) return;

  var state = StatsState.getState();
  var series = Array.isArray(state.trend) ? state.trend : [];
  if (!series.length) {
    refs.trendSvg.innerHTML = '<text x="24" y="45" class="y-label">Nu există date pentru trend.</text>';
    refs.trendAxisLabels.innerHTML = '';
    return;
  }

  var values = series.map(function(item) { return toNumber(item.avg_efficiency); });
  var min = Math.min.apply(null, values);
  var max = Math.max.apply(null, values);
  var range = Math.max(max - min, 1);
  var xStart = 30;
  var xEnd = 455;
  var yTop = 18;
  var yBottom = 72;
  var width = xEnd - xStart;

  var points = values.map(function(value, index) {
    var x = series.length === 1 ? xStart : xStart + (width * index) / (series.length - 1);
    var normalized = (value - min) / range;
    var y = yBottom - normalized * (yBottom - yTop);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');

  var fillPoints = points + ' 455,90 30,90';
  var yMax = Math.ceil(max / 5) * 5;
  var yMid = Math.round(((min + max) / 2) / 5) * 5;
  var yMin = Math.floor(min / 5) * 5;
  var gradientId = 'eff-grad-live';

  refs.trendSvg.innerHTML =
    '<line x1="0" y1="18" x2="460" y2="18" class="grid-line"></line>' +
    '<line x1="0" y1="45" x2="460" y2="45" class="grid-line"></line>' +
    '<line x1="0" y1="72" x2="460" y2="72" class="grid-line"></line>' +
    '<text x="0" y="16" class="y-label">' + formatPercent(yMax, 0) + '%</text>' +
    '<text x="0" y="43" class="y-label">' + formatPercent(yMid, 0) + '%</text>' +
    '<text x="0" y="70" class="y-label">' + formatPercent(yMin, 0) + '%</text>' +
    '<polyline points="' + points + '" class="trend-line"></polyline>' +
    '<polygon points="' + fillPoints + '" fill="url(#' + gradientId + ')" opacity="0.3"></polygon>' +
    '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#0E9F6E"></stop>' +
      '<stop offset="100%" stop-color="#0E9F6E" stop-opacity="0"></stop>' +
    '</linearGradient></defs>';

  var axisIndexes = buildAxisIndexes(series.length);
  refs.trendAxisLabels.innerHTML = axisIndexes.map(function(index) {
    return '<span>' + escapeHtml(formatTrendLabel(series[index].date)) + '</span>';
  }).join('');
}
