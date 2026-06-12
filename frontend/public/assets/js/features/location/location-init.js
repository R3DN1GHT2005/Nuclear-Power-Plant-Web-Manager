/*
 * frontend/public/assets/js/features/location/location-init.js
 * Location page bootstrap — authenticates as admin, redirects to
 * login if unauthorized, then reveals the page. Entry point for
 * the map-based reactor location management interface.
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
