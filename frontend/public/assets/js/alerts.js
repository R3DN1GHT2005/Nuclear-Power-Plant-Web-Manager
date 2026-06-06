document.addEventListener("DOMContentLoaded", () => {
    const sunetAlarma = new Audio('./assets/alert_sound.mp3');
    sunetAlarma.loop = true; 

    // Set cu alertele ignorate — nu se resetează niciodată automat
    const ignoredAlertIds = new Set();

    const alertHTML = `
        <div id="nwGlobalOverlay" class="nw-alert-overlay">
            <div class="nw-alert-box" style="position: relative;">
                <div id="nwAlertHeader" class="nw-alert-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span id="nwAlertIcon">⚠️</span> 
                        <span id="nwAlertTitle">ALARMĂ SISTEM</span>
                    </div>
                    <button id="nwBtnClosePopup" style="background: none; border: none; color: inherit; font-size: 24px; font-weight: bold; cursor: pointer; padding: 0 10px;">&times;</button>
                </div>
                <div class="nw-alert-body">
                    <h2 id="nwAlertReactor" class="nw-alert-reactor-name">Reactor</h2>
                    <p id="nwAlertMessage" class="nw-alert-message">Mesaj alertă</p>
                </div>
                <div class="nw-alert-footer">
                    <button id="nwBtnShowForm" class="nw-btn nw-btn-action">INTERVINO / REZOLVĂ ALARMA</button>
                    <div id="nwResolveForm" class="nw-resolve-form">
                        <label class="nw-form-label">Jurnal de intervenție (Obligatoriu):</label>
                        <textarea id="nwResolveNotes" class="nw-textarea" rows="3" placeholder="Ex: Am redus puterea pompei la 80%..."></textarea>
                        <button id="nwBtnSubmit" class="nw-btn nw-btn-submit">CONFIRMĂ SALVAREA</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);

    const overlay = document.getElementById('nwGlobalOverlay');
    const header = document.getElementById('nwAlertHeader');
    const iconText = document.getElementById('nwAlertIcon');
    const reactorText = document.getElementById('nwAlertReactor');
    const messageText = document.getElementById('nwAlertMessage');
    const btnShowForm = document.getElementById('nwBtnShowForm');
    const formContainer = document.getElementById('nwResolveForm');
    const btnSubmit = document.getElementById('nwBtnSubmit');
    const notesInput = document.getElementById('nwResolveNotes');
    const btnClosePopup = document.getElementById('nwBtnClosePopup');

    let currentAlertId = null;

    function showGlobalAlert(alert) {
        // Nu redeschide dacă e deja vizibil
        if (overlay.classList.contains('nw-show')) return;
        // Nu redeschide dacă a fost ignorat de utilizator
        if (ignoredAlertIds.has(alert.id)) return;

        currentAlertId = alert.id;
        reactorText.textContent = alert.reactor_name;
        messageText.textContent = alert.message;

        header.classList.remove('nw-severity-critical', 'nw-severity-warning');
        if (alert.severity === 'critical') {
            header.classList.add('nw-severity-critical');
            iconText.textContent = '🚨';
        } else {
            header.classList.add('nw-severity-warning');
            iconText.textContent = '⚠️';
        }

        btnShowForm.style.display = 'block';
        formContainer.classList.remove('nw-show-form');
        notesInput.value = '';

        overlay.classList.add('nw-show');

        // Sunetul pornește odată cu popup-ul
        if (sunetAlarma.paused) {
            sunetAlarma.play().catch(e => console.log('Sunet blocat de browser.', e));
        }
    }

    async function checkAlerts() {
        try {
            const res = await window.authFetch('/alerts/active');
            if (res.ok) {
                const alerts = await res.json();
                
                if (alerts.length > 0) {
                    const latestAlert = alerts[0];
                    showGlobalAlert(latestAlert);

                    // Dacă alerta e ignorată, sunetul continuă în fundal
                    if (ignoredAlertIds.has(latestAlert.id) && sunetAlarma.paused) {
                        sunetAlarma.play().catch(e => console.log('Sunet blocat de browser.', e));
                    }
                } else {
                    // Nu mai există alerte active — curățăm tot
                    overlay.classList.remove('nw-show');
                    currentAlertId = null;
                    ignoredAlertIds.clear();
                    sunetAlarma.pause();
                    sunetAlarma.currentTime = 0;
                }
            }
        } catch (e) {
            console.error("Eroare:", e);
        }
    }

    btnClosePopup.addEventListener('click', () => {
        // Adăugăm alerta în Set — popup-ul nu va mai reapărea, sunetul continuă
        if (currentAlertId !== null) {
            ignoredAlertIds.add(currentAlertId);
        }
        overlay.classList.remove('nw-show');
    });

    btnShowForm.addEventListener('click', () => {
        btnShowForm.style.display = 'none';
        formContainer.classList.add('nw-show-form');
        notesInput.focus();
    });

    btnSubmit.addEventListener('click', async () => {
        if (!currentAlertId) return;
        const notes = notesInput.value.trim();
        if (!notes) { alert("Completează acțiunile!"); return; }
        
        btnSubmit.disabled = true;
        try {
            const res = await window.authFetch(`/alerts/${currentAlertId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ notes: notes })
            });
            if (res.ok) {
                overlay.classList.remove('nw-show');
                ignoredAlertIds.delete(currentAlertId);
                currentAlertId = null;
                sunetAlarma.pause();
                sunetAlarma.currentTime = 0;
            }
        } finally {
            btnSubmit.disabled = false;
        }
    });

    setInterval(checkAlerts, 5000);
    checkAlerts();
});