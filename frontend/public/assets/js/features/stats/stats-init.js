/*
 * frontend/public/assets/js/features/stats/stats-init.js
 * Statistics page entry point (manager view) — waits for
 * DOMContentLoaded and delegates to StatsState.init() to bootstrap
 * the full statistics dashboard.
 */
document.addEventListener('DOMContentLoaded', function() {
  StatsState.init();
});
