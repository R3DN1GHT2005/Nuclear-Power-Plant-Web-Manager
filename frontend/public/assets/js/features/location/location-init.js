/*
 * location-init.js — Location page entry point.
 * Delegates to LocationState.init() once the DOM
 * is ready. Extracted from monolithic location.js.
 */

document.addEventListener('DOMContentLoaded', function() {
  LocationState.init();
});
