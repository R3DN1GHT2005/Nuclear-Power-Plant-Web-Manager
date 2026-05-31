document.addEventListener("DOMContentLoaded", async () => {
    console.log("1. Scriptul a pornit cu succes!");

    // ── 1. STARE GLOBALĂ ──
    const state = {
        currentReactor: null,
        pendingStatus: null,
        allHistory: []
    };

    // ── 2. PRELUARE ID DIN URL ──
    const params = new URLSearchParams(window.location.search);
    const reactorId = params.get("id");
    console.log("2. ID-ul extras din URL este:", reactorId);

    const layout = document.getElementById("reactor-details-layout");
    const errorContainer = document.getElementById("error-container");

    if (!reactorId) {
        console.error("❌ EROARE: Lipsește ID-ul reactorului din link.");
        showError();
        return;
    }

    // ── 3. PRELUARE DATE REACTOR ──
    try {
        console.log("3. Preluăm datele de la server...");
        
        const reactors = await window.NuclearAPI.getReactors();
        state.currentReactor = reactors.find(r => r.id.toString() === reactorId.toString());

        if (!state.currentReactor) {
            console.error(`❌ EROARE: Reactorul cu ID-ul ${reactorId} nu a fost găsit!`);
            showError();
            return;
        }

        console.log("4. Reactor găsit! Randăm interfața...", state.currentReactor);
        
        // Randăm interfața cu datele primite
        renderReactorDetails(state.currentReactor);
        renderSensors(state.currentReactor.sensors || []);
        renderAlerts(state.currentReactor);
        populateHistoryFilter(state.currentReactor.sensors || []);
        
        // CĂRĂM ISTORICUL DE MENTENANȚĂ
        await loadMaintenanceHistory(state.currentReactor.id);
        
        // Afișăm containerul principal
        if (layout) {
            layout.classList.remove("hidden");
            layout.style.display = "grid";
        }   

        bindEvents(); // Atașăm funcționalitatea butoanelor

    } catch (err) {
        console.error("❌ EROARE CRITICĂ:", err);
        showError();
    }

    // ==========================================
    // ── FUNCȚII DE RANDARE (AFIȘARE DATE) ──
    // ==========================================

    function showError() {
        if (layout) layout.classList.add("hidden");
        if (errorContainer) errorContainer.classList.remove("hidden");
    }

    function renderReactorDetails(reactor) {
        const setElText = (id, text) => { if(document.getElementById(id)) document.getElementById(id).textContent = text; };
        
        const statusStr = (reactor.status || "").toLowerCase();
        const isMaintenance = statusStr.includes("mentenan");

        setElText("reactor-title", reactor.name);
        setElText("reactor-subtitle", `ID: NW-${reactor.id} · Locație: ${reactor.location_name}`);

        const statusPill = document.getElementById("reactor-status-pill");
        if (statusPill) {
            statusPill.textContent = reactor.status;
            statusPill.className = "pill " + getStatusPillClass(reactor.status);
        }

        setElText("spec-type", reactor.reactor_type || "—");
        setElText("spec-cooling", reactor.cooling_water_source || "—");
        
        const powerText = isMaintenance ? "0 MW (Oprit)" : (reactor.installed_power ? `${reactor.installed_power} MW` : "—");
        setElText("spec-power", powerText);
        
        setElText("spec-distance", reactor.distance_to_nearest_city_km != null ? `${reactor.distance_to_nearest_city_km} km` : "—");
        setElText("spec-elevation", reactor.elevation_meters != null ? `${reactor.elevation_meters} m` : "—");
        setElText("spec-seismic", reactor.seismic_risk != null ? `${reactor.seismic_risk}%` : "—");

        const eff = isMaintenance ? 0 : (reactor.current_efficiency ?? 0);
        setElText("efficiency-val", `${eff}%`);
        const effBar = document.getElementById("efficiency-bar");
        if (effBar) {
            effBar.style.width = `${eff}%`;
            effBar.className = "spec-bar-fill " + getBarClass(eff);
        }

        const stab = reactor.soil_stability ?? 0;
        setElText("stability-val", `${stab}%`);
        const stabBar = document.getElementById("stability-bar");
        if (stabBar) {
            stabBar.style.width = `${stab}%`;
            stabBar.className = "spec-bar-fill " + getBarClass(stab);
        }

        const maintEl = document.getElementById("last-maintenance-date");
        if (maintEl) {
            const d = new Date(reactor.last_maintenance);
            maintEl.textContent = "Ultima mentenanță: " + (reactor.last_maintenance && !isNaN(d) ? d.toLocaleString("ro-RO") : "—");
        }

        // ── LOGICĂ BUTOANE MENTENANȚĂ ──
        const btnMaint = document.getElementById("btn-maint");
        const btnFinishMaint = document.getElementById("btn-finish-maint");
        const btnStart = document.getElementById("btn-start");
        const btnStop = document.getElementById("btn-stop");

        if (isMaintenance) {
            if (btnMaint) btnMaint.classList.add("hidden");
            if (btnFinishMaint) btnFinishMaint.classList.remove("hidden");
            if (btnStart) btnStart.disabled = true;
            if (btnStop) btnStop.disabled = true;
        } else {
            if (btnMaint) btnMaint.classList.remove("hidden");
            if (btnFinishMaint) btnFinishMaint.classList.add("hidden");
            if (btnStart) btnStart.disabled = false;
            if (btnStop) btnStop.disabled = false;
        }
    }

    function renderSensors(sensors) {
        const container = document.getElementById("sensor-grid-container");
        if (!container) return;
        
        if (sensors.length === 0) {
            container.innerHTML = `<div class="history-empty">Niciun senzor montat pe acest reactor.</div>`;
            return;
        }

        container.innerHTML = sensors.map((sensor) => {
            const type = sensor.sensor_type || "Senzor";
            const val = sensor.current_value != null ? sensor.current_value : "—";
            const unit = sensor.unit || "";
            const isWarn = type.toLowerCase().includes("temperatura") && val > 350;

            return `
            <div class="sensor-card ${isWarn ? 'warn' : ''}">
                <div class="spec-lbl">${type}</div>
                <div class="spec-val ${isWarn ? 'text-amber' : ''}">${val} <span style="font-size:11px; color:var(--text-3);">${unit}</span></div>
            </div>`;
        }).join("");
    }

    function renderAlerts(reactor) {
        const container = document.getElementById("alert-list");
        const pill = document.getElementById("alert-count-pill");
        if (!container) return;

        const status = (reactor.status || "").toLowerCase();
        const alerts = [];

        if (status.includes("mentenan")) alerts.push({ sev: 'sev-warn', msg: 'Reactor în Mentenanță — producție oprită', time: 'Astăzi' });
        if (reactor.seismic_risk > 25) alerts.push({ sev: 'sev-warn', msg: 'Risc seismic ridicat detectat', time: 'Ieri' });
        
        if (alerts.length === 0) {
            container.innerHTML = '<div class="history-empty">Sistem stabil. Nicio alertă.</div>';
            if (pill) pill.classList.add("hidden");
            return;
        }

        if (pill) {
            pill.textContent = alerts.length;
            pill.classList.remove("hidden");
        }
        
        const alertSub = document.getElementById('alert-sub');
        if (alertSub) alertSub.textContent = `${alerts.length} evenimente recente`;

        container.innerHTML = alerts.map(a => `
            <div class="alert-row">
                <div class="alert-sev ${a.sev}"></div>
                <div class="alert-body">
                    <div class="alert-msg">${a.msg}</div>
                    <div class="alert-meta">${a.time}</div>
                </div>
            </div>`).join("");
    }

    function populateHistoryFilter(sensors) {
        const select = document.getElementById("filter-sensor");
        if (!select) return;
        
        select.innerHTML = '<option value="">Toți senzorii</option>';
        sensors.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.sensor_type}</option>`;
        });
    }

    // ==========================================
    // ── FUNCȚIA NOUĂ: ISTORIC MENTENANȚĂ ──
    // ==========================================
    
    async function loadMaintenanceHistory(id) {
        try {
            const res = await window.authFetch(`/reactors/${id}/maintenance/history`);
            if (res.ok) {
                const history = await res.json();
                renderMaintenanceHistoryList(history);
            }
        } catch (err) {
            console.error("Eroare la încărcarea istoricului de mentenanță:", err);
            const container = document.getElementById("maintenance-history-list");
            if(container) container.innerHTML = '<div class="history-empty">Eroare la încărcarea datelor.</div>';
        }
    }

    function renderMaintenanceHistoryList(historyArray) {
        const container = document.getElementById("maintenance-history-list");
        if (!container) return;

        if (!historyArray || historyArray.length === 0) {
            container.innerHTML = '<div class="history-empty">Niciun istoric de mentenanță.</div>';
            return;
        }

        container.innerHTML = historyArray.map(item => {
            const isCompleted = item.is_completed;
            const startDate = new Date(item.started_at).toLocaleDateString("ro-RO");
            const reason = item.reason || "Revizie generală";
            
            // Setăm clasa și textele în funcție de status (În curs vs Finalizată)
            const statusColor = isCompleted ? "color: var(--status-operational);" : "color: var(--status-warning); font-weight: bold;";
            const statusText = isCompleted ? "Finalizată" : "În curs";
            
            let dateText = "";
            if (isCompleted) {
                const endDate = item.completed_at ? new Date(item.completed_at).toLocaleDateString("ro-RO") : "N/A";
                dateText = `Finalizat: ${endDate}`;
            } else {
                const estDate = item.estimated_end_date ? new Date(item.estimated_end_date).toLocaleDateString("ro-RO") : "N/A";
                dateText = `Estimare finalizare: ${estDate}`;
            }

            return `
            <div class="alert-row" style="align-items: flex-start;">
                <div class="alert-sev ${isCompleted ? 'sev-info' : 'sev-warn'}"></div>
                <div class="alert-body" style="flex: 1;">
                    <div class="alert-msg" style="display:flex; justify-content:space-between; align-items:center;">
                        <span>${reason}</span>
                        <span style="${statusColor} font-size: 0.85rem;">${statusText}</span>
                    </div>
                    <div class="alert-meta" style="margin-top:4px;">
                        Pornit: ${startDate} <span style="margin:0 6px; opacity:0.5;">|</span> ${dateText}
                    </div>
                </div>
            </div>`;
        }).join("");
    }

    // ==========================================
    // ── FUNCȚII AJUTĂTOARE (UTILITARE) ──
    // ==========================================

    function getStatusPillClass(status) {
        if (!status) return "pill-off";
        const s = status.toLowerCase();
        if (s.includes("activ") || s.includes("operaț")) return "pill-active";
        if (s.includes("alert")) return "pill-alert";
        if (s.includes("mentenanț")) return "pill-maint";
        return "pill-off";
    }

    function getBarClass(val) {
        if (val >= 75) return "bf-green";
        if (val >= 40) return "bf-amber";
        return "bf-red";
    }

    function showToast(msg, type = "success") {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.className = `toast ${type === 'error' ? 'error' : 'success'} show`;
        setTimeout(() => t.classList.remove("show"), 3000);
    }

    // ==========================================
    // ── BINDING EVENIMENTE (BUTOANE & MODALE) ──
    // ==========================================

    function bindEvents() {
        
        // ── 1. Navigare între Tab-uri (Senzori / Istoric / Mentenanță) ──
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                
                const targetId = e.target.getAttribute('data-target');
                if (targetId) {
                    document.getElementById(targetId)?.classList.add('active');
                }
            });
        });

        // ── 2. Închidere Modale (la click pe X sau pe fundal) ──
        document.querySelectorAll('.btn-close-modal, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-close-modal')) {
                    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
                }
            });
        });

        // ── 3. Modal generic pentru schimbare Status simplu (Pornire/Oprire) ──
        const openStatusModal = (newStatus, title, icon, warning) => {
            state.pendingStatus = newStatus;
            
            const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).textContent = val; };
            setVal('modal-status-icon', icon);
            setVal('modal-status-title', title);
            
            const warnEl = document.getElementById('modal-status-warning');
            if (warnEl) {
                if (warning) { 
                    warnEl.textContent = warning; 
                    warnEl.classList.remove('hidden'); 
                } else { 
                    warnEl.classList.add('hidden'); 
                }
            }
            
            document.getElementById('modal-status')?.classList.add('open');
        };

        document.getElementById('btn-start')?.addEventListener('click', () => openStatusModal('Operațional', 'Pornire Reactor', '✅', null));
        document.getElementById('btn-stop')?.addEventListener('click', () => openStatusModal('Oprit', 'Oprire Reactor', '🛑', 'Oprirea va întrerupe producția.'));

        document.getElementById('modal-status-confirm')?.addEventListener('click', async () => {
            document.getElementById('modal-status')?.classList.remove('open');
            
            try {
                const res = await window.authFetch(`/reactors/${state.currentReactor.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...state.currentReactor, status: state.pendingStatus })
                });
                
                if (res.ok) {
                    state.currentReactor.status = state.pendingStatus;
                    renderReactorDetails(state.currentReactor);
                    showToast(`Status actualizat: ${state.pendingStatus}`);
                } else throw new Error("Eroare răspuns server");
            } catch (err) {
                console.error(err);
                showToast('Eroare la actualizare status.', 'error'); 
            }
        });

        // ==========================================
        // ── 4. LOGICA PENTRU MENTENANȚĂ (START / STOP) ──
        // ==========================================

        const btnMaint = document.getElementById('btn-maint');
        const btnScheduleMaint = document.getElementById('btn-schedule-maint');

        const openMaintModal = () => {
            document.getElementById('maint-date').value = '';
            document.getElementById('maint-reason').value = '';
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('maint-date').setAttribute('min', today);

            document.getElementById('modal-start-maint')?.classList.add('open');
        };

        btnMaint?.addEventListener('click', openMaintModal);
        btnScheduleMaint?.addEventListener('click', openMaintModal);

        // B. Confirmare pornire mentenanță (POST)
        document.getElementById('modal-maint-confirm')?.addEventListener('click', async () => {
            const endDate = document.getElementById('maint-date').value;
            const reason = document.getElementById('maint-reason').value;

            if (!endDate) {
                showToast('Data estimată de finalizare este obligatorie.', 'error');
                return;
            }

            document.getElementById('modal-start-maint').classList.remove('open');

            try {
                const res = await window.authFetch(`/reactors/${state.currentReactor.id}/maintenance/start`, {
                    method: 'POST',
                    body: JSON.stringify({
                        estimated_end_date: endDate,
                        reason: reason || null
                    })
                });
                
                if (res.ok) {
                    showToast('Reactorul a intrat în mentenanță.');
                    state.currentReactor.status = 'În mentenanță';
                    renderReactorDetails(state.currentReactor);
                    
                    // REÎNCĂRCĂM ISTORICUL CA SĂ APARĂ INSTANT ÎN TAB!
                    await loadMaintenanceHistory(state.currentReactor.id);
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Eroare la pornirea mentenanței.");
                }
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error'); 
            }
        });

        // C. Confirmare oprire/finalizare mentenanță (POST)
        document.getElementById('btn-finish-maint')?.addEventListener('click', async () => {
            if (!confirm("Sunteți sigur că mentenanța a fost finalizată? Reactorul va deveni activ.")) return;

            try {
                const res = await window.authFetch(`/reactors/${state.currentReactor.id}/maintenance/stop`, {
                    method: 'POST'
                });
                
                if (res.ok) {
                    showToast('Mentenanță finalizată. Reactor activat.');
                    state.currentReactor.status = 'Operațional';
                    renderReactorDetails(state.currentReactor);
                    
                    // REÎNCĂRCĂM ISTORICUL CA SĂ VEDEM CĂ E FINALIZAT!
                    await loadMaintenanceHistory(state.currentReactor.id);
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Eroare la finalizarea mentenanței.");
                }
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error'); 
            }
        });


        // ==========================================
        // ── 5. LOGICA PENTRU ADĂUGARE SENZOR ──
        // ==========================================
        
        let fetchedSensorProfiles = {};
        const sensorTypeSelect = document.getElementById('sensor-type');
        const btnAddConfirm = document.getElementById('modal-add-sensor-confirm');

        const fetchSensorTypes = async () => {
            if (Object.keys(fetchedSensorProfiles).length > 0) return; 
            try {
                const res = await window.authFetch('/sensors/types', { method: 'GET' });
                if (res.ok) {
                    fetchedSensorProfiles = await res.json();
                    if (sensorTypeSelect) {
                        sensorTypeSelect.innerHTML = '<option value="" disabled selected>Alege tipul...</option>';
                        for (const [type, profile] of Object.entries(fetchedSensorProfiles)) {
                            sensorTypeSelect.innerHTML += `<option value="${type}">${type}</option>`;
                        }
                    }
                }
            } catch (err) { console.error("Eroare preluare senzori", err); }
        };

        document.getElementById('btn-add-sensor')?.addEventListener('click', () => {
            fetchSensorTypes(); 
            
            if (sensorTypeSelect) sensorTypeSelect.value = "";
            document.getElementById('sensor-min').value = "";
            document.getElementById('sensor-max').value = "";
            if (btnAddConfirm) btnAddConfirm.disabled = true;

            document.getElementById('modal-add-sensor')?.classList.add('open');
        });

        sensorTypeSelect?.addEventListener('change', (e) => {
            const profile = fetchedSensorProfiles[e.target.value];
            if (profile) {
                document.getElementById('sensor-min').value = profile.defaultMin;
                document.getElementById('sensor-max').value = profile.defaultMax;
                if (btnAddConfirm) btnAddConfirm.disabled = false;
            }
        });

        btnAddConfirm?.addEventListener('click', async () => {
            const type = sensorTypeSelect?.value;
            const minSafe = document.getElementById('sensor-min')?.value;
            const maxSafe = document.getElementById('sensor-max')?.value;
            
            if (minSafe === "" || maxSafe === "") { 
                showToast('Introduceți limitele de siguranță.', 'error'); 
                return; 
            }
            
            document.getElementById('modal-add-sensor')?.classList.remove('open');
            try {
                const payload = {
                    sensor_type: type,
                    min_safe_value: parseFloat(minSafe),
                    max_safe_value: parseFloat(maxSafe)
                };

                const res = await window.authFetch(`/reactors/${state.currentReactor.id}/sensors`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    showToast('Senzor adăugat cu succes.');
                    
                    const updatedReactors = await window.NuclearAPI.getReactors();
                    state.currentReactor = updatedReactors.find(r => r.id.toString() === state.currentReactor.id.toString());
                    if(state.currentReactor) {
                        renderSensors(state.currentReactor.sensors || []);
                        populateHistoryFilter(state.currentReactor.sensors || []);
                    }
                } else throw new Error("Eroare adăugare senzor");
            } catch (err) { 
                console.error(err);
                showToast('Eroare la adăugarea senzorului.', 'error'); 
            }
        });
    }
});