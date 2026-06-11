/*
 * stats-init.js — Statistics page entry point.
 * Delegates to StatsState.init() once the DOM
 * is ready. Extracted from monolithic stats.js.
 */

document.addEventListener('DOMContentLoaded', function() {
  StatsState.init();
});
