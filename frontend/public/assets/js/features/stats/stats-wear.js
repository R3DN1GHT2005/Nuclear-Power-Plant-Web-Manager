/*
 * stats-wear.js — Wear percentage rendering
 * for the reactor statistics page. Displays
 * horizontal wear bars with colour-coded
 * thresholds and a legend footer. Extracted
 * from monolithic stats.js.
 */

function wearTone(value) {
  if (value > 40) return { barClass: 'bg-red', textClass: 'text-red' };
  if (value >= 30) return { barClass: 'bg-amber', textClass: 'text-amber' };
  return { barClass: 'bg-green', textClass: 'text-green' };
}

function renderWear() {
  var refs = StatsState.getRefs();
  if (!refs.wearList) return;

  var state = StatsState.getState();
  var wear = (state.wear || []).slice().sort(function(left, right) {
    return toNumber(right.wear_percent) - toNumber(left.wear_percent);
  });

  if (!wear.length) {
    refs.wearList.innerHTML = '<div style="padding:14px; color: var(--text-3);">Nu există date pentru uzură.</div>';
    return;
  }

  var rows = wear.map(function(item) {
    var wearPercent = clamp(toNumber(item.wear_percent), 0, 100);
    var tone = wearTone(wearPercent);
    var label = getReactorShortLabel(item.name, item.reactor_id);
    return '<div class="wear-item">' +
      '<span class="wear-lbl">' + escapeHtml(label) + '</span>' +
      '<div class="wear-bar-bg"><div class="wear-bar-f ' + tone.barClass + '" style="width:' + wearPercent + '%"></div></div>' +
      '<span class="wear-val ' + tone.textClass + '">' + formatPercent(wearPercent, 0) + '%</span>' +
    '</div>';
  }).join('');

  refs.wearList.innerHTML = rows +
    '<footer class="wear-legend">' +
      '<span class="wl-item"><span class="wl-dot bg-green"></span>0–30% Bună</span>' +
      '<span class="wl-item"><span class="wl-dot bg-amber"></span>30–40% Medie</span>' +
      '<span class="wl-item"><span class="wl-dot bg-red"></span>&gt;40% Critică</span>' +
    '</footer>';
}
