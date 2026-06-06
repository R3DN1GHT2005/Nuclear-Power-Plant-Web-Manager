// Salvăm toate reactoarele aici pentru a le putea filtra instantaneu din memorie
let allReactors = []; 

document.addEventListener("DOMContentLoaded", async () => {
    const gridContainer = document.getElementById("reactor-grid-container");

    // Mesaj de încărcare temporar
    gridContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--text-2);'>Se încarcă datele...</p>";

    // 1. Preluăm datele reale folosind api.js
    allReactors = await NuclearAPI.getReactors();

    // 2. Afișăm reactoarele și activăm filtrele
    renderReactors(allReactors);
    setupFilters();
});

// Funcție dedicată pentru afișarea unei liste (fie completă, fie filtrată)
function renderReactors(reactorsList) {
    const gridContainer = document.getElementById("reactor-grid-container");

    if (!reactorsList || reactorsList.length === 0) {
        gridContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--text-3); margin-top: 20px;'>Nu s-au găsit reactoare conform criteriilor selectate.</p>";
        return;
    }

    gridContainer.innerHTML = reactorsList.map(reactor => createReactorHTML(reactor)).join('');
    attachDetailLinks();
}

// ====== LOGICA DE FILTRARE ======
function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const searchInput = document.querySelector('.search-input');

    // Atașăm evenimente de click pe fiecare tab
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Eliminăm clasa "active-tab" de la toate tab-urile
            filterTabs.forEach(t => t.classList.remove('active-tab'));
            
            // O adăugăm doar tab-ului pe care am dat click
            e.currentTarget.classList.add('active-tab');
            
            // Aplicăm filtrele
            applyFilters();
        });
    });

    // Dacă utilizatorul tastează în bara de căutare
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
}

// Funcție ajutătoare pentru a elimina diacriticele și spațiile (ex: "Alertă (1)" -> "alerta")
function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD") // Desparte caracterele de diacritice
        .replace(/[\u0300-\u036f]/g, "") // Elimină diacriticele (ă -> a, ș -> s, etc.)
        .replace(/\([0-9]+\)/g, "") // Elimină orice număr între paranteze ex: "(1)"
        .trim(); // Elimină spațiile de la început și final
}

function applyFilters() {
    // Luăm tab-ul activ curent și textul căutat
    const activeTab = document.querySelector('.filter-tab.active-tab');
    const searchInput = document.querySelector('.search-input');

    // Normalizăm filtrul ales de utilizator (ex: "Alertă (1)" devine "alerta")
    const rawFilterText = activeTab ? activeTab.textContent : 'toate';
    const statusFilter = normalizeString(rawFilterText);
    
    // Normalizăm și căutarea (pentru a nu ține cont de litere mari sau diacritice)
    const searchQuery = normalizeString(searchInput ? searchInput.value : '');

    let filteredList = allReactors;

    // 1. Filtrăm după status (dacă nu este selectat tab-ul "toate")
    if (statusFilter !== 'toate') {
        filteredList = filteredList.filter(reactor => {
            // Normalizăm și statusul venit din baza de date (ex: "Alertă" devine "alerta")
            const currentStatus = normalizeString(reactor.status);
            
            // Verificăm dacă cuvântul din baza de date conține filtrul selectat 
            // (Folosesc includes în loc de egalitate exactă pentru mai multă siguranță)
            return currentStatus.includes(statusFilter) || statusFilter.includes(currentStatus);
        });
    }

    // 2. Filtrăm după căutarea text din input box (nume, locație sau ID)
    if (searchQuery !== '') {
        filteredList = filteredList.filter(reactor => {
            const name = normalizeString(reactor.name);
            const location = normalizeString(reactor.location_name);
            const id = reactor.id ? reactor.id.toString() : '';
            
            return name.includes(searchQuery) || location.includes(searchQuery) || id.includes(searchQuery);
        });
    }

    // Randăm noua listă filtrată
    renderReactors(filteredList);
}


// ====== GENERARE HTML ȘI EVENIMENTE ======

function createReactorHTML(reactor) {
    const config = {
        'activ': { pill: 'pill-active', border: '', bar: 'bf-green', text: 'text-green' },
        'alertă': { pill: 'pill-alert', border: 'border-crit', bar: 'bf-red', text: 'text-red' },
        'mentenanță': { pill: 'pill-maint', border: 'border-maint', bar: 'bf-amber', text: 'text-amber' },
        'oprit': { pill: 'pill-off', border: 'opacity-75', bar: 'bf-gray', text: 'text-muted' }
    };

    const statusLower = reactor.status ? reactor.status.toLowerCase() : 'activ';
    const style = config[statusLower] || config['activ'];

    const dateObj = new Date(reactor.last_maintenance);
    const formattedDate = isNaN(dateObj) ? reactor.last_maintenance : dateObj.toLocaleString('ro-RO');

    return `
        <article class="rcard ${style.border}">
            <header class="rcard-header">
                <div>
                    <h3 class="rcard-name">${reactor.name}</h3>
                    <div class="rcard-id">ID: NW-${reactor.id} · Locație: ${reactor.location_name}</div>
                </div>
                <span class="pill ${style.pill}">${reactor.status}</span>
            </header>
            
            <div class="rcard-bar">
                <div class="bar-label"><span>Eficiență</span><span class="${style.text}">${reactor.current_efficiency}%</span></div>
                <div class="bar-track"><div class="bar-fill ${style.bar}" style="width:${reactor.current_efficiency}%"></div></div>
            </div>

            <div class="rcard-meta" style="display: flex; gap: 12px; padding: 6px 16px; font-size: 12px; color: var(--text-3); border-bottom: 1px solid var(--border);">
                <span>Tip: ${reactor.reactor_type}</span>
                <span>Răcire: ${reactor.cooling_water_source}</span>
                <span>Oraș: ${reactor.distance_to_nearest_city_km}km</span>
                <span>Alt: ${reactor.elevation_meters}m</span>
            </div>
            
            <div class="rcard-body">
                ${reactor.sensors && reactor.sensors.length > 0 ? reactor.sensors.map(sensor => {
                    const type = sensor.sensor_type || 'Senzor necunoscut';
                    const value = sensor.current_value !== null ? sensor.current_value : '--';
                    const unit = sensor.unit || '';
                    const isWarning = (type.toLowerCase() === 'temperatura' && value > 350) ? 'text-red' : '';

                    return `
                    <div class="param-box">
                        <div class="param-label" style="text-transform: capitalize;">${type}</div>
                        <div class="param-val ${isWarning}">${value} ${unit}</div>
                        <div class="param-unit" style="font-size: 0.85em; color: gray;">Senzor ID: ${sensor.id}</div>
                    </div>
                    `;
                }).join('') : '<div class="param-box"><div class="param-label text-muted">Niciun senzor montat</div></div>'}
            </div>

            <footer class="rcard-footer">
                <div class="rcard-upd">
                    <div class="upd-dot ${style.bar.replace('bf-', 'dot-')}"></div>
                    Actualizat: ${formattedDate}
                </div>
                <a class="action-link detail-btn" data-id="${reactor.id}" href="reactor.html?id=${encodeURIComponent(reactor.id)}">Detalii →</a>
            </footer>
        </article>
    `;
}

function attachDetailLinks() {
    const detailButtons = document.querySelectorAll('.detail-btn');
    
    detailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reactorId = e.currentTarget.getAttribute('data-id');
            window.location.href = `reactor.html?id=${reactorId}`;
        });
    });
}