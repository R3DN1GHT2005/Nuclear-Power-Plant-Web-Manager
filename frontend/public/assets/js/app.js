document.addEventListener("DOMContentLoaded", async () => {
    const gridContainer = document.getElementById("reactor-grid-container");

    // 1. Preluăm datele reale folosind api.js
    const reactors = await NuclearAPI.getReactors();

    if (!reactors || reactors.length === 0) {
        gridContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Nu s-au găsit reactoare în baza de date.</p>";
        return;
    }

    // 2. Generăm și injectăm cardurile HTML
    gridContainer.innerHTML = reactors.map(reactor => createReactorHTML(reactor)).join('');
});

function createReactorHTML(reactor) {
    // Setăm culorile din CSS-ul tău în funcție de status
    const config = {
        'activ': { pill: 'pill-active', border: '', bar: 'bf-green', text: 'text-green' },
        'alertă': { pill: 'pill-alert', border: 'border-crit', bar: 'bf-red', text: 'text-red' },
        'mentenanță': { pill: 'pill-maint', border: 'border-maint', bar: 'bf-amber', text: 'text-amber' },
        'oprit': { pill: 'pill-off', border: 'opacity-75', bar: 'bf-gray', text: 'text-muted' }
    };

    // Luăm statusul (cu fallback pe "activ" în caz că e gol)
    const statusLower = reactor.status ? reactor.status.toLowerCase() : 'activ';
    const style = config[statusLower] || config['activ'];

    // Formatăm data ca să arate mai frumos (opțional)
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
                    
                    const type = sensor.type || 'Senzor necunoscut';
                    const value = sensor.value !== null ? sensor.value : '--';
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
                <a class="action-link" href="#">Detalii →</a>
            </footer>
        </article>
    `;
}

// ====== LOGICĂ PENTRU ADĂUGARE REACTOR ======

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("reactor-modal");
    const btnNew = document.getElementById("btn-new-reactor");
    const btnClose = document.getElementById("close-modal");
    const form = document.getElementById("new-reactor-form");

    // 1. Deschide fereastra
    if(btnNew) {
        btnNew.addEventListener("click", () => {
            modal.style.display = "flex"; // Afișăm pe ecran
        });
    }

    // 2. Închide fereastra
    if(btnClose) {
        btnClose.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Închide fereastra dacă dai click în afara ei (pe fundalul întunecat)
    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // 3. Când dăm "Salvează"
    if(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault(); // Oprim pagina să dea refresh (comportament clasic HTML)

            // Generăm data curentă în formatul acceptat de baza de date
            const now = new Date();
            const lastMaintenanceDate = now.toISOString().slice(0, 19).replace('T', ' ');

            const newData = {
                name: document.getElementById("r-name").value,
                location_name: document.getElementById("r-location").value,
                latitude: parseFloat(document.getElementById("r-lat").value),
                longitude: parseFloat(document.getElementById("r-lng").value),
                status: document.getElementById("r-status").value,
                installed_power: parseFloat(document.getElementById("r-power").value),
                current_efficiency: 100.0,
                last_maintenance: lastMaintenanceDate,
                soil_stability: parseFloat(document.getElementById("r-soil-stability").value),
                seismic_risk: parseFloat(document.getElementById("r-seismic-risk").value),
                reactor_type: document.getElementById("r-type").value,
                cooling_water_source: document.getElementById("r-cooling").value,
                distance_to_nearest_city_km: parseFloat(document.getElementById("r-distance").value),
                elevation_meters: parseFloat(document.getElementById("r-elevation").value),
            };

            // Schimbăm textul butonului ca să arătăm că se încarcă
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = "Se salvează...";

            // Trimitem prin API
            const success = await NuclearAPI.createReactor(newData);

            if (success) {
                // Dacă s-a salvat cu succes, ascundem fereastra, resetăm formularul și...
                modal.style.display = "none";
                form.reset();
                submitBtn.textContent = "Salvează Reactor";
                
                // ... dăm refresh automat doar la carduri!
                alert("Reactor creat cu succes!");
                
                // Opțional: Aici am putea re-apela funcția de afișare ca să apară pe ecran instant fără F5:
                // window.location.reload(); 
            } else {
                alert("Eroare la salvare! Verifică consola (F12).");
                submitBtn.textContent = "Salvează Reactor";
            }
        });
    }
});