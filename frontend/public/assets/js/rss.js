document.addEventListener('DOMContentLoaded', () => {
    loadRssFeed();
    setupRssButton();
    startDayRefresh();
});

async function getCurrentUserRssToken() {
    try {
        const response = await authFetch('/rss/token'); 
        
        if (response.ok) {
            const data = await response.json();
            return data.rss_token;
        } else {
            console.warn("Nu am putut obține token-ul RSS. Status:", response.status);
        }
    } catch (e) {
        console.warn("Eroare la apelarea endpoint-ului RSS token:", e);
    }
    
    return null;
}

async function loadRssFeed() {
    const rssContainer = document.getElementById('rss-container');
    if (!rssContainer) return;

    try {
        const rssToken = await getCurrentUserRssToken();
        
        if (!rssToken) {
            rssContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--red);">Eroare: Nu s-a putut obține accesul la fluxul RSS.</p>';
            return;
        }

        const serverUrl = 'http://localhost:8082';
        const rssUrl = `${serverUrl}/api/rss/alerts?token=${rssToken}`;
        const response = await fetch(rssUrl);
        
        if (!response.ok) {
            throw new Error(`Eroare la obținerea fluxului: ${response.status}`);
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = xmlDoc.querySelectorAll("item");

        if (items.length === 0) {
            rssContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #666;">Nu există evenimente recente în jurnal.</p>';
            return;
        }

        rssContainer.innerHTML = '';
        const itemsArray = Array.from(items);

        const statsItem = itemsArray.find(item => {
            const title = item.querySelector("title")?.textContent || "";
            return title.includes("[STATISTICI]");
        });

        const otherItems = itemsArray.filter(item => {
            const title = item.querySelector("title")?.textContent || "";
            return !title.includes("[STATISTICI]");
        });

        const recentItems = otherItems.slice(0, 4);

        recentItems.forEach(item => {
            const title = item.querySelector("title")?.textContent || "Fără titlu";
            const description = item.querySelector("description")?.textContent || "";
            const pubDate = item.querySelector("pubDate")?.textContent || "";
            const dateObj = new Date(pubDate);
            const dateFormatted = isNaN(dateObj) ? pubDate : dateObj.toLocaleString('ro-RO', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            });

            let dotColor = "#CBD5E1"; 
            if (title.includes("[CRITICAL]")) dotColor = "var(--red)";
            else if (title.includes("[REZOLVAT]")) dotColor = "#22c55e";
            else if (title.includes("[WARNING]")) dotColor = "var(--amber)";
            else if (title.includes("[MENTENANȚĂ]")) dotColor = "var(--green)";
            const cleanTitle = title.replace(/\[.*?\]\s*/, '');

            const feedItemHTML = `
                <div style="padding: 10px 15px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <div style="font-weight: 500; font-size: 0.85em; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 7px; height: 7px; border-radius: 50%; background-color: ${dotColor}; flex-shrink: 0;"></div>
                            ${cleanTitle}
                        </div>
                        <div style="font-size: 0.7em; color: #94a3b8; white-space: nowrap; flex-shrink: 0;">
                            ${dateFormatted}
                        </div>
                    </div>
                    <div style="font-size: 0.8em; color: #64748b; padding-left: 15px; line-height: 1.3;">
                        ${description}
                    </div>
                </div>
            `;

            rssContainer.insertAdjacentHTML('beforeend', feedItemHTML);
        });

        if (statsItem) {
            const statsTitle = statsItem.querySelector("title")?.textContent || "";
            const statsDesc = statsItem.querySelector("description")?.textContent || "";
            const cleanStatsTitle = statsTitle.replace(/\[.*?\]\s*/, '');

            const reactorLines = statsDesc.split('\n').filter(line => line.trim().startsWith('-'));
            let reactorsHtml = '';
            reactorLines.forEach(line => {
                const match = line.match(/-\s*(.+?):\s*([\d.]+)%\s*\(Status:\s*(.+?)\)/);
                if (match) {
                    const name = match[1];
                    const eff = match[2];
                    const status = match[3].toLowerCase();
                    let statusClass = 'stats-ok';
                    if (status === 'alertă' || status === 'critic') statusClass = 'stats-crit';
                    else if (status === 'mentenanță') statusClass = 'stats-maint';
                    else if (status === 'oprit') statusClass = 'stats-off';
                    reactorsHtml += `
                        <div class="stats-reactor ${statusClass}">
                            <div class="stats-reactor-name">${name}</div>
                            <div class="stats-reactor-eff">${eff}%</div>
                            <div class="stats-bar"><div class="stats-bar-fill" style="width:${eff}%"></div></div>
                        </div>
                    `;
                }
            });

            const statsHtml = `
                <div style="border-bottom: 1px solid #f1f5f9;">
                    <div style="padding: 10px 15px 6px; font-weight: 600; font-size: 0.85em; color: var(--text); display: flex; align-items: center; gap: 8px;">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        ${cleanStatsTitle}
                    </div>
                    <div class="stats-grid">
                        ${reactorsHtml}
                    </div>
                </div>
            `;

            rssContainer.insertAdjacentHTML('beforeend', statsHtml);
        }

        if (itemsArray.length === 0 || (!statsItem && otherItems.length === 0)) {
            rssContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #666;">Nu există evenimente recente în jurnal.</p>';
        }

    } catch (error) {
        console.error("Eroare RSS:", error);
        rssContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--red);">Eroare la procesarea jurnalului RSS.</p>`;
    }
}

function startDayRefresh() {
    let lastDate = new Date().toDateString();
    setInterval(() => {
        const now = new Date().toDateString();
        if (now !== lastDate) {
            lastDate = now;
            loadRssFeed();
        }
    }, 30000);
}

function setupRssButton() {
    const subBtn = document.querySelector('.rss-sub-btn');
    if (!subBtn) return;

    subBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            const rssToken = await getCurrentUserRssToken();
            if (!rssToken) {
                alert("Eroare: Nu s-a putut obține link-ul. (Lipsește token-ul)");
                return;
            }

            const serverUrl = 'http://localhost:8082';
            const rssUrl = `${serverUrl}/api/rss/alerts?token=${rssToken}`;
            
            await navigator.clipboard.writeText(rssUrl);
            
            alert("Link-ul tău privat pentru fluxul RSS a fost copiat în clipboard!");
            
        } catch (err) {
            console.error('Eroare la generarea link-ului:', err);
            alert("Nu s-a putut copia link-ul. Verificați conexiunea.");
        }
    });
}