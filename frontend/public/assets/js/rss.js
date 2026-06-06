document.addEventListener('DOMContentLoaded', () => {
    loadRssFeed();
    setupRssButton();
});

async function getCurrentUserRssToken() {
    try {
        const response = await authFetch('/api/users/me'); 
        
        if (response.ok) {
            const data = await response.json();
            return data.rss_token;
        } else {
            console.warn("Nu am putut obține profilul. Status:", response.status);
        }
    } catch (e) {
        console.warn("Eroare la apelarea rutei pentru profil:", e);
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

        const backendUrl = 'http://localhost:8082';
        const rssUrl = `${backendUrl}/api/rss/alerts?token=${rssToken}`;
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
        items.forEach(item => {
            const title = item.querySelector("title")?.textContent || "Fără titlu";
            const description = item.querySelector("description")?.textContent || "";
            const pubDate = item.querySelector("pubDate")?.textContent || "";
            const dateObj = new Date(pubDate);
            const dateFormatted = isNaN(dateObj) ? pubDate : dateObj.toLocaleString('ro-RO', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            });

            let dotColor = "#CBD5E1"; 
            if (title.includes("[CRITICAL]")) dotColor = "var(--red)";
            else if (title.includes("[WARNING]")) dotColor = "var(--amber)";
            else if (title.includes("[INFO]") || title.includes("[STATISTICI]")) dotColor = "var(--green)";
            const cleanTitle = title.replace(/\[.*?\]\s*/, '');

            const feedItemHTML = `
                <div style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <div style="font-weight: 500; font-size: 0.9em; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${dotColor};"></div>
                            ${cleanTitle}
                        </div>
                        <div style="font-size: 0.75em; color: #94a3b8; white-space: nowrap;">
                            ${dateFormatted}
                        </div>
                    </div>
                    <div style="font-size: 0.85em; color: #64748b; padding-left: 16px; line-height: 1.4;">
                        ${description}
                    </div>
                </div>
            `;

            rssContainer.insertAdjacentHTML('beforeend', feedItemHTML);
        });

    } catch (error) {
        console.error("Eroare RSS:", error);
        rssContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--red);">Eroare la procesarea jurnalului RSS.</p>`;
    }
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

            const backendUrl = 'http://localhost:8082';
            const rssUrl = `${backendUrl}/api/rss/alerts?token=${rssToken}`;
            
            await navigator.clipboard.writeText(rssUrl);
            
            alert("Link-ul tău privat pentru fluxul RSS a fost copiat în clipboard!");
            
        } catch (err) {
            console.error('Eroare la generarea link-ului:', err);
            alert("Nu s-a putut copia link-ul. Verificați conexiunea.");
        }
    });
}