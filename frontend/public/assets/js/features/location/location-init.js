/*
 * location-init.js — Location page entry point.
 * Delegates to LocationState.init() once the DOM
 * is ready. Extracted from monolithic location.js.
 */

document.addEventListener('DOMContentLoaded', async function() {
  document.documentElement.style.visibility = 'hidden';
  try {
    var meRes = await authFetch('/auth/me', { method: 'GET' });
    if (!meRes.ok) { window.location.href = 'login.html'; return; }
    var me = await meRes.json();
    if (me.role !== 'admin') { window.location.href = 'login.html'; return; }
  } catch (e) { window.location.href = 'login.html'; return; }
  document.documentElement.style.visibility = '';
  LocationState.init();
});
