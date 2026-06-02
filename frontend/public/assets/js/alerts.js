document.addEventListener("DOMContentLoaded", () => {
    // 1. INJECTĂM STRUCTURA HTML CURATĂ
    const alertHTML = `
        <div id="nwGlobalOverlay" class="nw-alert-overlay">
            <div class="nw-alert-box">
                
                <div id="nwAlertHeader" class="nw-alert-header">
                    <span id="nwAlertIcon">⚠️</span> 
                    <span id="nwAlertTitle">ALARMĂ SISTEM</span>
                </div>
                
                <div class="nw-alert-body">
                    <h2 id="nwAlertReactor" class="nw-alert-reactor-name">Reactor</h2>
                    <p id="nwAlertMessage" class="nw-alert-message">Mesaj alertă</p>
                </div>
                
                <div class="nw-alert-footer">
                    <button id="nwBtnShowForm" class="nw-btn nw-btn-action">
                        INTERVINO / REZOLVĂ ALARMA
                    </button>

                    <div id="nwResolveForm" class="nw-resolve-form">
                        <label class="nw-form-label">Jurnal de intervenție (Obligatoriu):</label>
                        <textarea id="nwResolveNotes" class="nw-textarea" rows="3" placeholder="Ex: Am redus puterea pompei la 80%..."></textarea>
                        
                        <button id="nwBtnSubmit" class="nw-btn nw-btn-submit">
                            CONFIRMĂ SALVAREA
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);

    // 2. PRELUĂM ELEMENTELE DIN DOM
    const overlay = document.getElementById('nwGlobalOverlay');
    const header = document.getElementById('nwAlertHeader');
    const iconText = document.getElementById('nwAlertIcon');
    const reactorText = document.getElementById('nwAlertReactor');
    const messageText = document.getElementById('nwAlertMessage');
    
    const btnShowForm = document.getElementById('nwBtnShowForm');
    const formContainer = document.getElementById('nwResolveForm');
    const btnSubmit = document.getElementById('nwBtnSubmit');
    const notesInput = document.getElementById('nwResolveNotes');

    let currentAlertId = null;

    // 3. FUNCȚIA CARE AFIȘEAZĂ ALARMA
    function showGlobalAlert(alert) {
        if (overlay.classList.contains('nw-show')) return; // Dacă e deja vizibilă, nu facem nimic

        currentAlertId = alert.id;
        reactorText.textContent = alert.reactor_name;
        messageText.textContent = alert.message;

        // Setăm culorile în funcție de severitate
        header.classList.remove('nw-severity-critical', 'nw-severity-warning');
        
        if (alert.severity === 'critical') {
            header.classList.add('nw-severity-critical');
            iconText.textContent = '🚨';
        } else {
            header.classList.add('nw-severity-warning');
            iconText.textContent = '⚠️';
        }

        // Resetăm starea formularului (în caz că a rămas deschis de la o alertă anterioară)
        btnShowForm.style.display = 'block';
        formContainer.classList.remove('nw-show-form');
        notesInput.value = '';

        // Arătăm overlay-ul
        overlay.classList.add('nw-show');
        
        // Opțional: Aici poți pune sunet
        // new Audio('assets/sounds/alarm.mp3').play().catch(e => console.log('Sunet blocat de browser.'));
    }

    // 4. LOGICA DE VERIFICARE (POLLING LA 5 SECUNDE)
    async function checkAlerts() {
        try {
            // Se presupune că folosești funcția globală authFetch pe care ai configurat-o deja
            const res = await window.authFetch('/alerts/active');
            
            if (res.ok) {
                const alerts = await res.json();
                
                if (alerts.length > 0) {
                    showGlobalAlert(alerts[0]); // Arătăm cea mai recentă alertă
                } else {
                    // Dacă un alt operator a rezolvat alerta între timp, ascundem fereastra automat
                    overlay.classList.remove('nw-show');
                    currentAlertId = null;
                }
            }
        } catch (e) {
            console.error("Eroare la preluarea alertelor", e);
        }
    }

    // 5. EVENIMENTE BUTOANE
    btnShowForm.addEventListener('click', () => {
        btnShowForm.style.display = 'none';
        formContainer.classList.add('nw-show-form');
        notesInput.focus();
    });

    btnSubmit.addEventListener('click', async () => {
        if (!currentAlertId) return;
        
        const notes = notesInput.value.trim();
        if (!notes) {
            alert("Te rog să completezi acțiunile întreprinse!");
            notesInput.focus();
            return;
        }
        
        btnSubmit.textContent = "SE SALVEAZĂ...";
        btnSubmit.disabled = true;

        try {
            const res = await window.authFetch(`/alerts/${currentAlertId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ notes: notes })
            });
            
            if (res.ok) {
                // Succes! Ascundem fereastra.
                overlay.classList.remove('nw-show');
                currentAlertId = null;
            } else {
                const data = await res.json();
                alert(data.error || "Eroare la confirmare.");
            }
        } catch (e) {
            alert("Eroare de rețea.");
        } finally {
            // Resetăm butonul indiferent de rezultat
            btnSubmit.textContent = "CONFIRMĂ SALVAREA";
            btnSubmit.disabled = false;
        }
    });

    // 6. PORNIREA VERIFICĂRILOR
    setInterval(checkAlerts, 5000);
    checkAlerts(); // Executăm o dată imediat cum se încarcă pagina
});