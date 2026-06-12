/*
 * frontend/public/assets/js/features/stats/stats-environment.js
 * Statistics environmental panel — displays soil stability, seismic
 * risk, average elevation, and mean city distance as four metric boxes
 * with colour-coded impact badges.
 */
function operationalBadge(score, okThreshold, warnThreshold) {
  if (score >= okThreshold) return 'Impact: minim';
  if (score >= warnThreshold) return 'Atenție';
  return 'Critic';
}

function renderEnvironment() {
  var refs = StatsState.getRefs();
  if (!refs.environmentGrid) return;

  var state = StatsState.getState();
  var reactors = Array.isArray(state.reactors) ? state.reactors : [];
  if (!reactors.length) {
    refs.environmentGrid.innerHTML = '<div class="met-box" style="grid-column:1/-1;">Nu există date pentru condițiile operaționale.</div>';
    return;
  }

  var averages = {
    soil: safeAverage(reactors.map(function(r) { return toNumber(r.soil_stability); })),
    seismic: safeAverage(reactors.map(function(r) { return toNumber(r.seismic_risk); })),
    elevation: safeAverage(reactors.map(function(r) { return toNumber(r.elevation_meters); })),
    distance: safeAverage(reactors.map(function(r) { return toNumber(r.distance_to_nearest_city_km); }))
  };
  var seismic10 = averages.seismic > 10 ? averages.seismic / 10 : averages.seismic;
  var seismicImpactScore = 100 - (seismic10 * 10);

  refs.environmentGrid.innerHTML =
    '<div class="met-box">' +
      '<div class="met-icon">🪨</div>' +
      '<div class="met-v">' + formatPercent(averages.soil, 1) + '%</div>' +
      '<div class="met-l">Stabilitate sol</div>' +
      '<div class="met-impact ' + (averages.soil >= 70 ? 'mi-ok' : averages.soil >= 40 ? 'mi-warn' : 'mi-bad') + '">' + operationalBadge(averages.soil, 70, 40) + '</div>' +
    '</div>' +
    '<div class="met-box">' +
      '<div class="met-icon">🌋</div>' +
      '<div class="met-v">' + formatNumber(seismic10, 1) + ' / 10</div>' +
      '<div class="met-l">Risc seismic</div>' +
      '<div class="met-impact ' + (seismicImpactScore >= 70 ? 'mi-ok' : seismicImpactScore >= 40 ? 'mi-warn' : 'mi-bad') + '">' + operationalBadge(seismicImpactScore, 70, 40) + '</div>' +
    '</div>' +
    '<div class="met-box">' +
      '<div class="met-icon">🏔️</div>' +
      '<div class="met-v">' + formatNumber(averages.elevation, 0) + ' m</div>' +
      '<div class="met-l">Altitudine medie</div>' +
      '<div class="met-impact mi-ok">Date live</div>' +
    '</div>' +
    '<div class="met-box">' +
      '<div class="met-icon">📍</div>' +
      '<div class="met-v">' + formatNumber(averages.distance, 1) + ' km</div>' +
      '<div class="met-l">Distanță medie oraș</div>' +
      '<div class="met-impact ' + (averages.distance >= 30 ? 'mi-ok' : averages.distance >= 10 ? 'mi-warn' : 'mi-bad') + '">' + (averages.distance >= 30 ? 'Optim' : averages.distance >= 10 ? 'Atenție' : 'Critic') + '</div>' +
    '</div>';
}
