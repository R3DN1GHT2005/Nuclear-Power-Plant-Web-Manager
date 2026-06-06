document.addEventListener("DOMContentLoaded", () => {
    
    // =====================================================================
    // 1. LOGICA PENTRU POP-UP GLOBAL (ALARMĂ SONORĂ)
    // =====================================================================
    const sunetAlarma = new Audio('./assets/alert_sound.mp3');
    sunetAlarma.loop = true; 

    // Set cu alertele ignorate — nu se resetează niciodată automat în sesiune
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
        if (overlay.classList.contains('nw-show')) return;
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

        if (sunetAlarma.paused) {
            sunetAlarma.play().catch(e => console.log('Sunet blocat de browser. Interacționează cu pagina.', e));
        }
    }

    btnClosePopup.addEventListener('click', () => {
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
                // Forțăm reîncărcarea listei din dreapta instantaneu
                fetchAndRenderList(); 
            }
        } finally {
            btnSubmit.disabled = false;
        }
    });

    // =====================================================================
    // 2. LOGICA PENTRU LISTA DE ALERTE (COLOANA DREAPTĂ)
    // =====================================================================
    const listContainer = document.getElementById('alerts-container');
    
    // Injectăm CSS-ul doar dacă există containerul pe pagină
    if (listContainer) {
        listContainer.style.cssText = 'display:flex; flex-direction:column; gap:10px;';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes alertPulseRing { 0% { box-shadow: 0 0 0 0 rgba(226,75,74,0.35); } 70% { box-shadow: 0 0 0 8px rgba(226,75,74,0); } 100% { box-shadow: 0 0 0 0 rgba(226,75,74,0); } }
            @keyframes alertPulseRingAmber { 0% { box-shadow: 0 0 0 0 rgba(186,117,23,0.35); } 70% { box-shadow: 0 0 0 8px rgba(186,117,23,0); } 100% { box-shadow: 0 0 0 0 rgba(186,117,23,0); } }
            @keyframes dotBlink { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
            .alert-card-v2 { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; }
            .alert-card-body { padding: 14px 18px 16px; display: flex; flex-direction: column; gap: 12px; }
            .alert-dot { width: 8px; height: 8px; border-radius: 50%; animation: dotBlink 1.4s ease-in-out infinite; flex-shrink: 0; }
            .alert-resolve-btn-v2 { align-self: flex-start; color: #fff; border: none; border-radius: var(--border-radius-md); padding: 9px 18px; font-size: 12.5px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: background 0.15s, box-shadow 0.15s; font-family: inherit; }
            .alert-resolve-btn-v2.crit { background: #E24B4A; animation: alertPulseRing 2s ease-out infinite; }
            .alert-resolve-btn-v2.crit:hover { background: #C53030; }
            .alert-resolve-btn-v2.warn { background: #BA7517; animation: alertPulseRingAmber 2s ease-out infinite; }
            .alert-resolve-btn-v2.warn:hover { background: #9A5F0F; }
            .alert-confirm-btn-v2 { align-self: flex-start; background: var(--color-background-success); color: var(--color-text-success); border: 0.5px solid var(--color-border-success); border-radius: var(--border-radius-md); padding: 9px 18px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
            .alert-confirm-btn-v2:hover { opacity: 0.85; }
            .alert-textarea-v2 { background: var(--color-background-secondary); border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); color: var(--color-text-primary); padding: 9px 11px; font-size: 12px; line-height: 1.5; resize: vertical; font-family: inherit; width: 100%; box-sizing: border-box; }
            .alert-textarea-v2:focus { outline: none; border-color: var(--color-border-primary); }
        `;
        document.head.appendChild(style);
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '';
        const normalized = dateStr.replace(' ', 'T');
        const diff = Math.floor((Date.now() - new Date(normalized)) / 1000);
        if (diff < 60) return `acum ${diff}s`;
        if (diff < 3600) return `acum ${Math.floor(diff / 60)}min`;
        if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
        return `acum ${Math.floor(diff / 86400)}z`;
    }

    function formatExactTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr.replace(' ', 'T'));
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${hours}:${minutes} — ${day}.${month}`;
    }

    function renderList(alerts) {
        if (!listContainer) return;
        
        // === 1. SALVĂM STAREA ÎNAINTE DE REDESENARE ===
        const openForms = {};
        document.querySelectorAll('[id^="list-resolve-form-"]').forEach(form => {
            if (form.style.display === 'flex') {
                const idStr = form.id.replace('list-resolve-form-', '');
                const textarea = document.getElementById(`list-resolve-notes-${idStr}`);
                openForms[idStr] = textarea ? textarea.value : '';
            }
        });

        // Desenăm alertele active
        listContainer.innerHTML = alerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const dotColor      = isCritical ? '#E24B4A'  : '#BA7517';
            const iconColor     = isCritical ? '#E24B4A'  : '#BA7517';
            const badgeBg       = isCritical ? '#FCEBEB'  : '#FAEEDA';
            const badgeColor    = isCritical ? '#A32D2D'  : '#854F0B';
            const badgeBorder   = isCritical ? '#F09595'  : '#FAC775';
            const msgBg         = isCritical ? '#FCEBEB'  : '#FAEEDA';
            const msgColor      = isCritical ? '#791F1F'  : '#633806';
            const msgBorderL    = isCritical ? '#E24B4A'  : '#BA7517';
            const msgBorderRest = isCritical ? '#F09595'  : '#FAC775';
            const severityText  = isCritical ? 'CRITICĂ'  : 'AVERTIZARE';
            const iconName      = isCritical ? 'ti-alert-circle' : 'ti-alert-triangle';
            const btnClass      = isCritical ? 'crit'     : 'warn';

            return `
            <div class="alert-card-v2" data-alert-id="${alert.id}">
                <div class="alert-card-body">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="alert-dot" style="background:${dotColor};"></div>
                        <i class="ti ${iconName}" style="font-size:18px; color:${iconColor};" aria-hidden="true"></i>
                        <span style="font-size:19px; font-weight:500; color:var(--color-text-primary);">
                            ${alert.reactor_name || 'Reactor necunoscut'}
                        </span>
                        <span style="font-size:10px; font-weight:500; letter-spacing:0.5px; padding:3px 9px; border-radius:20px; background:${badgeBg}; color:${badgeColor}; border:0.5px solid ${badgeBorder};">${severityText}</span>
                        <span style="font-size:12px; color:var(--color-text-secondary); margin-left:auto;">${timeAgo(alert.created_at)}</span>
                    </div>
                    <div style="font-size:12.5px; line-height:1.65; color:${msgColor}; background:${msgBg}; border:0.5px solid ${msgBorderRest}; border-left:3px solid ${msgBorderL}; border-radius:0 var(--border-radius-md) var(--border-radius-md) 0; padding:10px 14px;">${alert.message || ''}</div>
                    <div>
                        <button class="alert-resolve-btn-v2 ${btnClass}" onclick="toggleResolveFormList(this, ${alert.id})">
                            <i class="ti ti-tool" style="font-size:14px;" aria-hidden="true"></i> Intervino / Rezolvă alarma
                        </button>
                    </div>
                    <div id="list-resolve-form-${alert.id}" style="display:none; flex-direction:column; gap:8px;">
                        <div style="font-size:11px; color:var(--color-text-secondary); font-weight:500;">Jurnal de intervenție <span style="color:${dotColor};">*</span></div>
                        <textarea class="alert-textarea-v2" id="list-resolve-notes-${alert.id}" rows="3" placeholder="Ex: Am redus puterea pompei la 80%..."></textarea>
                        <button class="alert-confirm-btn-v2" onclick="submitResolveList(${alert.id}, this)">
                            <i class="ti ti-check" style="font-size:14px;" aria-hidden="true"></i> Confirmă salvarea
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');

        // === 2. RESTAURĂM STAREA IMEDIAT DUPĂ REDESENARE ===
        Object.keys(openForms).forEach(alertId => {
            const form = document.getElementById(`list-resolve-form-${alertId}`);
            const textarea = document.getElementById(`list-resolve-notes-${alertId}`);
            const btn = document.querySelector(`button[onclick="toggleResolveFormList(this, ${alertId})"]`);

            if (form && textarea && btn) {
                form.style.display = 'flex'; 
                textarea.value = openForms[alertId]; 

                const icon = btn.querySelector('i');
                if (icon) icon.className = 'ti ti-x';
                btn.childNodes[btn.childNodes.length - 1].textContent = ' Anulează';
                
                if (document.activeElement.id === `list-resolve-notes-${alertId}`) {
                    textarea.focus();
                }
            }
        });
    }

    // =====================================================================
    // 3. LOGICĂ NOUĂ PENTRU ISTORIC (CÂND NU SUNT ALERTE ACTIVE)
    // =====================================================================
    async function fetchAndRenderHistory() {
        if (!listContainer) return;

        // Căutăm dacă suntem pe pagina unui anumit reactor (ex: reactor.html?id=5)
        const urlParams = new URLSearchParams(window.location.search);
        const reactorId = urlParams.get('id');

        // Dacă avem ID în URL, cerem istoricul acelui reactor. Altfel, cerem pe tot sistemul (pentru index).
        const endpoint = reactorId 
            ? `/alerts/history/reactor/${reactorId}` 
            : `/alerts/history`;

        try {
            const res = await window.authFetch(endpoint);
            
            if (res.ok) {
                const historyAlerts = await res.json();
                renderHistoryCards(historyAlerts, listContainer);
            } else if (res.status === 403) {
                // Dacă un tehnician e pe Dashboard (fără ID) și nu are voie la istoricul global
                listContainer.innerHTML = `
                    <div style="padding:32px 18px; display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--color-text-secondary);">
                        <i class="ti ti-shield-lock" style="font-size:36px; opacity:0.4;"></i>
                        <div style="font-size:13px; font-weight:500;">Sistem stabil</div>
                        <div style="font-size:12px; opacity:0.6;">(Vizualizarea istoricului global necesită drepturi de administrator)</div>
                    </div>`;
            }
        } catch (e) {
            console.error('Eroare la preluarea istoricului:', e);
        }
    }

    function renderHistoryCards(historyAlerts, listContainer) {
        if (!historyAlerts || historyAlerts.length === 0) {
            listContainer.innerHTML = `
                <div style="padding:32px 18px; display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--color-text-secondary);">
                    <i class="ti ti-circle-check" style="font-size:36px; opacity:0.4;"></i>
                    <div style="font-size:13px; font-weight:500;">Istoric curat</div>
                    <div style="font-size:12px; opacity:0.6;">Nu s-au înregistrat erori anterioare.</div>
                </div>`;
            return;
        }

        // Tăiem lista (tu ai pus 15)
        const recentHistory = historyAlerts.slice(0, 15);

        listContainer.style.padding = "0";

        listContainer.innerHTML = `
            <div style="font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); letter-spacing: 0.5px; padding: 14px 20px; text-align: center; font-weight: 600; border-bottom: 1px solid var(--color-border-tertiary, #eaeaea);">
                Ultimele ${recentHistory.length} intervenții soluționate
            </div>
            
            <div style="display: flex; flex-direction: column; overflow-y: auto; max-height: 400px;">
        ` + recentHistory.map((alert, index) => {
            const isCritical = alert.severity === 'critical';
            const badgeBg       = isCritical ? '#FCEBEB'  : '#FAEEDA';
            const badgeColor    = isCritical ? '#A32D2D'  : '#854F0B';
            const badgeBorder   = isCritical ? '#F09595'  : '#FAC775';
            const severityText  = isCritical ? 'CRITICĂ'  : 'AVERTIZARE';
            
            const borderBottom = index < recentHistory.length - 1 ? 'border-bottom: 1px solid var(--color-border-tertiary, #eaeaea);' : '';

            return `
            <div style="padding: 18px 20px; ${borderBottom} display: flex; flex-direction: column; gap: 8px;">
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 15px; font-weight: 600; color: var(--color-text-primary);">
                            ${alert.reactor_name}
                        </span>
                        <span style="font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: ${badgeBg}; color: ${badgeColor}; border: 0.5px solid ${badgeBorder};">
                            ${severityText}
                        </span>
                    </div>
                    
                    <span style="font-size: 12px; font-weight: 500; color: var(--color-text-secondary); background: var(--color-background-secondary, #f8f9fa); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-border-tertiary, #eaeaea);">
                        ${formatExactTime(alert.created_at)}
                    </span>
                </div>

                <div style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.55;">
                    ${alert.message}
                </div>

            </div>`;
        }).join('') + `</div>`;
    }

    // =====================================================================
    // 4. FETCH CENTRAL (RULAT LA 5 SECUNDE)
    // =====================================================================
    async function fetchAndRenderList() {
        try {
            const res = await window.authFetch('/alerts/active');
            if (res.ok) {
                const alerts = await res.json();
                
                // 1. Verificăm popup-ul global
                if (alerts.length > 0) {
                    const latestAlert = alerts[0];
                    showGlobalAlert(latestAlert);

                    if (ignoredAlertIds.has(latestAlert.id) && sunetAlarma.paused) {
                        sunetAlarma.play().catch(e => console.log('Sunet blocat.', e));
                    }
                } else {
                    overlay.classList.remove('nw-show');
                    currentAlertId = null;
                    ignoredAlertIds.clear();
                    sunetAlarma.pause();
                    sunetAlarma.currentTime = 0;
                }

                // 2. Randăm lista vizuală din dreapta
                if (alerts.length > 0) {
                    renderList(alerts); // Sunt alerte active, le arătăm pe acelea
                } else {
                    fetchAndRenderHistory(); // ZERO alerte active, arătăm istoricul
                }
            }
        } catch (e) {
            console.error('Eroare la încărcarea alertelor:', e);
        }
    }

    // =====================================================================
    // 5. FUNCȚII ATAȘATE PE WINDOW PENTRU HTML DINAMIC
    // =====================================================================
    window.toggleResolveFormList = function(btn, alertId) {
        const form = document.getElementById(`list-resolve-form-${alertId}`);
        if (!form) return;
        const isVisible = form.style.display === 'flex';
        form.style.display = isVisible ? 'none' : 'flex';
        btn.style.animation = isVisible ? '' : 'none';
        
        const icon = btn.querySelector('i');
        if (isVisible) {
            if (icon) icon.className = 'ti ti-tool';
            btn.childNodes[btn.childNodes.length - 1].textContent = ' Intervino / Rezolvă alarma';
        } else {
            if (icon) icon.className = 'ti ti-x';
            btn.childNodes[btn.childNodes.length - 1].textContent = ' Anulează';
        }
    };

    window.submitResolveList = async function(alertId, btn) {
        const notes = document.getElementById(`list-resolve-notes-${alertId}`)?.value.trim();
        if (!notes) { alert('Completează acțiunile!'); return; }

        btn.disabled = true;
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'ti ti-loader-2';
        btn.childNodes[btn.childNodes.length - 1].textContent = ' Se salvează...';

        try {
            const res = await window.authFetch(`/alerts/${alertId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ notes })
            });
            if (res.ok) {
                if (currentAlertId === alertId) {
                    overlay.classList.remove('nw-show');
                    sunetAlarma.pause();
                    sunetAlarma.currentTime = 0;
                }
                fetchAndRenderList(); 
            } else {
                alert('Eroare la salvare.');
                btn.disabled = false;
                if (icon) icon.className = 'ti ti-check';
                btn.childNodes[btn.childNodes.length - 1].textContent = ' Confirmă salvarea';
            }
        } catch (e) {
            console.error(e);
            btn.disabled = false;
        }
    };

    // =====================================================================
    // INIT
    // =====================================================================
    setInterval(fetchAndRenderList, 5000);
    fetchAndRenderList();
});