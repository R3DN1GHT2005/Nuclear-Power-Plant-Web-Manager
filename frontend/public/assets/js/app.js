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
            
            <div class="rcard-body">
                ${reactor.sensors && reactor.sensors.length > 0 ? reactor.sensors.map(sensor => {
                    
                    // AICI ESTE REPARAȚIA: Folosim exact cheile din JSON-ul tău!
                    const type = sensor.type || 'Senzor necunoscut';
                    const value = sensor.value !== null ? sensor.value : '--';
                    const unit = sensor.unit || '';
                    
                    // Adăugăm logică vizuală: dacă e Temperatură peste 350, o facem roșie (hot)
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