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
        
        setElText("reactor-title", reactor.name);
        setElText("reactor-subtitle", `ID: NW-${reactor.id} · Locație: ${reactor.location_name}`);

        const statusPill = document.getElementById("reactor-status-pill");
        if (statusPill) {
            statusPill.textContent = reactor.status;
            statusPill.className = "pill " + getStatusPillClass(reactor.status);
        }

        setElText("spec-type", reactor.reactor_type || "—");
        setElText("spec-cooling", reactor.cooling_water_source || "—");
        setElText("spec-power", reactor.installed_power ? `${reactor.installed_power} MW` : "—");
        setElText("spec-distance", reactor.distance_to_nearest_city_km != null ? `${reactor.distance_to_nearest_city_km} km` : "—");
        setElText("spec-elevation", reactor.elevation_meters != null ? `${reactor.elevation_meters} m` : "—");
        setElText("spec-seismic", reactor.seismic_risk != null ? `${reactor.seismic_risk}%` : "—");

        // Bare progres
        const eff = reactor.current_efficiency ?? 0;
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

        // Ultima Mentenanță
        const maintEl = document.getElementById("last-maintenance-date");
        if (maintEl) {
            const d = new Date(reactor.last_maintenance);
            maintEl.textContent = "Ultima mentenanță: " + (reactor.last_maintenance && !isNaN(d) ? d.toLocaleString("ro-RO") : "—");
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
            const type = sensor.type || "Senzor";
            const val = sensor.value != null ? sensor.value : "—";
            const unit = sensor.unit || "";
            // O simplă regulă vizuală de avertizare dacă e prea cald
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

        // Generăm niște alerte false pentru design
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
            select.innerHTML += `<option value="${s.id}">${s.type}</option>`;
        });
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
        
        // ── 1. Navigare între Tab-uri (Senzori / Istoric) ──
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

        // ── 3. Funcție universală pentru deschiderea modalului de Status ──
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

        // Ascultăm click-urile pe butoanele de Status
        document.getElementById('btn-start')?.addEventListener('click', () => openStatusModal('Operațional', 'Pornire Reactor', '✅', null));
        document.getElementById('btn-stop')?.addEventListener('click', () => openStatusModal('Oprit', 'Oprire Reactor', '🛑', 'Oprirea va întrerupe producția.'));
        document.getElementById('btn-maint')?.addEventListener('click', () => openStatusModal('Mentenanță', 'Mentenanță', '🔧', 'Reactorul va ieși temporar din producție.'));
        document.getElementById('btn-schedule-maint')?.addEventListener('click', () => openStatusModal('Mentenanță', 'Mentenanță', '🔧', 'Reactorul va ieși temporar din producție.'));

        // Confirmarea modificării de Status către Backend
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
        // ── 4. LOGICA PENTRU ADĂUGARE SENZOR ──
        // ==========================================
        
        let fetchedSensorProfiles = {};
        const sensorTypeSelect = document.getElementById('sensor-type');
        const btnAddConfirm = document.getElementById('modal-add-sensor-confirm');

        // Descărcăm tipurile de senzori din backend
        const fetchSensorTypes = async () => {
            if (Object.keys(fetchedSensorProfiles).length > 0) return; // Deja le avem
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

        // Deschidere modal adăugare senzor
        document.getElementById('btn-add-sensor')?.addEventListener('click', () => {
            fetchSensorTypes(); // Tragem datele
            
            if (sensorTypeSelect) sensorTypeSelect.value = "";
            document.getElementById('sensor-min').value = "";
            document.getElementById('sensor-max').value = "";
            if (btnAddConfirm) btnAddConfirm.disabled = true;

            document.getElementById('modal-add-sensor')?.classList.add('open');
        });

        // Completare automată când alegem un senzor din listă
        sensorTypeSelect?.addEventListener('change', (e) => {
            const profile = fetchedSensorProfiles[e.target.value];
            if (profile) {
                document.getElementById('sensor-min').value = profile.defaultMin;
                document.getElementById('sensor-max').value = profile.defaultMax;
                if (btnAddConfirm) btnAddConfirm.disabled = false;
            }
        });

        // Confirmarea adăugării senzorului către Backend
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
                // Trimitem exact ce cere DTO-ul de pe backend
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
                    
                    // Refresh date pe interfață
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