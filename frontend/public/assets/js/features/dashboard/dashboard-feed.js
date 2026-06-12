/*
 * dashboard-feed.js — RSS feed loader for dashboard
 * Fetches RSS token, then XML feed, and renders
 * entries with severity badges in #rss-list.
 */

async function loadRssFeed() {
    var list = document.getElementById('rss-list');
    try {
        var tokenRes = await authFetch('/rss/token', { method: 'GET' });
        if (!tokenRes.ok) { list.innerHTML = '<p class="empty-msg">Eroare la token RSS.</p>'; return; }

        var tokenData = await tokenRes.json();
        var token = tokenData.rss_token;
        if (!token) { list.innerHTML = '<p class="empty-msg">Token RSS lipsă.</p>'; return; }

        var base = (window.location.protocol === 'http:' && window.location.hostname)
            ? window.location.protocol + '//' + window.location.hostname + ':8082'
            : 'http://127.0.0.1:8082';

        var xmlRes = await fetch(base + '/api/rss/alerts?token=' + encodeURIComponent(token));
        if (!xmlRes.ok) { list.innerHTML = '<p class="empty-msg">Eroare la flux RSS.</p>'; return; }

        var xmlDoc = new DOMParser().parseFromString(await xmlRes.text(), 'text/xml');
        var items = xmlDoc.querySelectorAll('item');

        if (!items.length) { list.innerHTML = '<p class="empty-msg">Nicio intrare RSS.</p>'; return; }

        var entries = [];
        items.forEach(function(item) {
            entries.push({
                title:   item.querySelector('title')?.textContent       || '',
                desc:    item.querySelector('description')?.textContent || '',
                pubDate: item.querySelector('pubDate')?.textContent     || ''
            });
        });

        list.innerHTML = entries.slice(0, 10).map(function(e) {
            var isCritical = e.title.includes('CRITIC');
            var isResolved = e.title.includes('REZOLVAT');
            var isInfo     = e.title.includes('INFO') || e.title.includes('STATISTICI');
            var severity = 'warning';
            if (isCritical)           severity = 'critical';
            if (isResolved || isInfo) severity = 'info';

            return '<div class="rss-item">' +
                '<div class="rss-head">' +
                    '<span class="rss-severity ' + severity + '">' + severity.toUpperCase() + '</span>' +
                    '<span class="rss-date">' + (e.pubDate ? new Date(e.pubDate).toLocaleString('ro-RO') : '') + '</span>' +
                '</div>' +
                '<div class="rss-title">' + e.title + '</div>' +
                '<div class="rss-desc">' + e.desc.replace(/&#8203;/g, '').trim() + '</div>' +
            '</div>';
        }).join('');
    } catch(e) {
        list.innerHTML = '<p class="empty-msg">Eroare de rețea.</p>';
    }
}
