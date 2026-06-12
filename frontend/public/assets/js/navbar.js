/*
 * frontend/public/assets/js/navbar.js
 * Navigation bar builder — fetches the current user role via /auth/me
 * and dynamically renders role-appropriate nav links. Admin sees full
 * menu (panou, reactoare, statistici, amplasare, alerte, conturi).
 * Manager sees station-specific links. Tehnician sees only logo + logout.
 */
const NAV_API_URL = window.FRONTEND_API_URL;

(async function initNavbar() {
    let role = 'viewer';
    try {
        const res = await fetch(`${NAV_API_URL}/auth/me`, {
            method: 'GET', credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            role = data.role || 'viewer';
        }
    } catch {}

    const nav = document.getElementById('top-navbar');
    if (!nav) return;

    const links = [];
    if (role === 'admin') {
        links.push({ href: 'index.html', label: 'Panou principal' });
        links.push({ href: 'reactors.html', label: 'Reactoare' });
        links.push({ href: 'stats.html', label: 'Statistici' });
        links.push({ href: 'location.html', label: 'Amplasare' });
        links.push({ href: 'alerts-history.html', label: 'Alerte' });
        links.push({ href: 'admin-accounts.html', label: 'Administrare Conturi' });
    } else if (role === 'manager') {
        links.push({ href: 'dashboard.html', label: 'Stația mea' });
        links.push({ href: 'reactor-statistics.html', label: 'Statistici' });
        links.push({ href: 'management.html', label: 'Management' });
        links.push({ href: 'reactor.html', label: 'Vezi reactorul' });
    }

    


    const left = nav.querySelector('.nav-left');
    if (!left) return;

    const logoLink = left.querySelector('.logo');
    left.innerHTML = '';
    if (logoLink) left.appendChild(logoLink);

    links.forEach(link => {
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.href = link.href;
        a.textContent = link.label;
        if (location.pathname.endsWith(link.href) || location.pathname.endsWith('/' + link.href.split('/').pop())) {
            a.classList.add('active');
        }
        left.appendChild(a);
    });
})();
