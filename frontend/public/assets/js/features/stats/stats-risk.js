/*
 * frontend/public/assets/js/features/stats/stats-risk.js
 * Statistics risk matrix — renders a 5x5 probability-vs-impact grid
 * with colour-coded cells. Populates each cell with reactor names and
 * applies high/medium/low visual classes.
 */
function getRiskCellClass(label) {
  var normalized = normalizeText(label);
  if (normalized === 'critic' || normalized === 'major') return 'rm-hi';
  if (normalized === 'moderat') return 'rm-md';
  return 'rm-lo';
}

function renderRiskMatrix() {
  var refs = StatsState.getRefs();
  if (!refs.riskMatrixWrap) return;

  var state = StatsState.getState();
  var rows = [
    { key: 'Cert', label: 'Cert' },
    { key: 'Probabil', label: 'Probabil' },
    { key: 'Posibil', label: 'Posibil' },
    { key: 'Putin probabil', label: 'Puțin prob.' },
    { key: 'Rar', label: 'Rar' }
  ];
  var columns = [
    { key: 'Neglijabil', label: 'Neg.' },
    { key: 'Minor', label: 'Minor' },
    { key: 'Moderat', label: 'Moderat' },
    { key: 'Major', label: 'Major' },
    { key: 'Critic', label: 'Critic' }
  ];

  var matrix = new Map();
  rows.forEach(function(row) {
    var rowMap = new Map();
    columns.forEach(function(col) { rowMap.set(normalizeText(col.key), []); });
    matrix.set(normalizeText(row.key), rowMap);
  });

  (state.riskMatrix || []).forEach(function(item) {
    var rowKey = normalizeText(item.probability);
    var colKey = normalizeText(item.impact);
    if (matrix.has(rowKey) && matrix.get(rowKey).has(colKey)) {
      matrix.get(rowKey).get(colKey).push(item.name);
    }
  });

  var headerHtml =
    '<div class="matrix-header-row">' +
      '<div class="matrix-y-axis-lbl">Impact ↑</div>' +
      '<div class="matrix-headers">' +
        columns.map(function(col) { return '<div class="rm-hdr">' + escapeHtml(col.label) + '</div>'; }).join('') +
      '</div>' +
    '</div>';

  var bodyHtml = rows.map(function(row) {
    var cells = columns.map(function(col) {
      var names = matrix.get(normalizeText(row.key)).get(normalizeText(col.key)) || [];
      var cellClass = getRiskCellClass(col.key);
      return '<div class="rm-cell ' + cellClass + '">' + (names.length ? names.map(escapeHtml).join('<br>') : '—') + '</div>';
    }).join('');
    return '<div class="matrix-row"><div class="matrix-row-lbl">' + escapeHtml(row.label) + '</div>' + cells + '</div>';
  }).join('');

  refs.riskMatrixWrap.innerHTML =
    headerHtml +
    '<div class="matrix-body">' + bodyHtml + '</div>' +
    '<div class="matrix-x-axis-lbl">← Probabilitate →</div>';
}
