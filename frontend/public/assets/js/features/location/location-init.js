/*
 * location-init.js — Location page auth guard.
 * Runs before Leaflet CDN loads so unauthorized
 * users are redirected immediately.
 */

(async function initLocation() {
    document.documentElement.style.visibility = 'hidden';
    try {
        var meRes = await authFetch('/auth/me', { method: 'GET' });
        if (!meRes.ok) { window.location.href = 'login.html'; return; }
        var me = await meRes.json();
        if (me.role !== 'admin') { window.location.href = 'login.html'; return; }
    } catch (e) { window.location.href = 'login.html'; return; }
    document.documentElement.style.visibility = '';
})();
