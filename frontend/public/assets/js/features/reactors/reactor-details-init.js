/*
 * frontend/public/assets/js/features/reactors/reactor-details-init.js
 * Reactor details page entry point — listens for DOMContentLoaded
 * and delegates to ReactorDetailsState.init() to bootstrap the page.
 */
document.addEventListener('DOMContentLoaded', async function() {
  ReactorDetailsState.init();
});
