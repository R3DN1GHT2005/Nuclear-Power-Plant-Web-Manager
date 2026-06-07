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
        
        renderReactorDetails(state.currentReactor);
        renderSensors(state.currentReactor.sensors || []);
        populateHistoryFilter(state.currentReactor.sensors || []);
        
        await loadReactorSpecificLog(state.currentReactor.id);
        await loadMaintenanceHistory(state.currentReactor.id);
        await loadSensorHistory(); // încărcăm istoricul inițial (toți senzorii)

        if (layout) {
            layout.classList.remove("hidden");
            layout.style.display = "grid";
        }   

        bindEvents();

        // ── AUTO-REFRESH LA 10 SECUNDE ──
        setInterval(autoRefresh, 10000);

    } catch (err) {
        console.error("❌ EROARE CRITICĂ:", err);
        showError();
    }

    // ==========================================
    // ── AUTO-REFRESH ──
    // ==========================================

    async function autoRefresh() {
        if (!state.currentReactor) return;
        try {
            const reactors = await window.NuclearAPI.getReactors();
            const updated = reactors.find(r => r.id.toString() === state.currentReactor.id.toString());
            if (!updated) return;

            updated.status = state.currentReactor.status;

            state.currentReactor = updated;
            renderReactorDetails(updated);
            renderSensors(updated.sensors || []);
        } catch (err) {
            console.warn("Refresh eșuat:", err);
        }
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
            const type = `${sensor.sensor_type || "Senzor"} #${sensor.id}`;
            const val  = sensor.current_value ?? "—";
            const unit = sensor.unit || "";
            const min  = sensor.min_safe_value ?? -Infinity;
            const max  = sensor.max_safe_value ??  Infinity;

            let sensorState = "ok";
            if (val !== "—") {
                const v      = parseFloat(val);
                const margin = (max - min) * 0.15;
                if (v > max || v < min)                        sensorState = "crit";
                else if (v > max - margin || v < min + margin) sensorState = "warn";
            }

            const styles = {
                ok:   { bg:"#EAF3DE", border:"#C0DD97", lbl:"#3B6D11", val:"#27500A", bdg:"#C0DD97", bdgT:"#27500A", icon:"ti-check",          txt:"Normal"     },
                warn: { bg:"#FAEEDA", border:"#FAC775", lbl:"#854F0B", val:"#633806", bdg:"#FAC775", bdgT:"#633806", icon:"ti-alert-triangle",  txt:"Avertizare" },
                crit: { bg:"#FCEBEB", border:"#F7C1C1", lbl:"#A32D2D", val:"#791F1F", bdg:"#F7C1C1", bdgT:"#791F1F", icon:"ti-alert-circle",   txt:"Critic"     },
            };
            const s = styles[sensorState];

            return `
            <div style="background:${s.bg};border:1px solid ${s.border};
                        border-radius:var(--radius-sm,10px);padding:16px;
                        display:flex;flex-direction:column;gap:8px;">
                <span style="font-size:10px;font-weight:500;letter-spacing:.06em;
                             text-transform:uppercase;color:${s.lbl}">${type}</span>
                <div style="font-size:22px;font-weight:500;color:${s.val};
                            display:flex;align-items:baseline;gap:5px">
                    ${val}
                    <span style="font-size:12px;font-weight:400;opacity:.7">${unit}</span>
                </div>
                <span style="align-self:flex-start;font-size:10px;font-weight:500;
                             padding:2px 8px;border-radius:20px;
                             background:${s.bdg};color:${s.bdgT}">
                    <i class="ti ${s.icon}" style="font-size:10px" aria-hidden="true"></i> ${s.txt}
                </span>
            </div>`;
        }).join("");
    }

    function populateHistoryFilter(sensors) {
        const select = document.getElementById("filter-sensor");
        if (!select) return;
        
        select.innerHTML = '<option value="">Toți senzorii</option>';
        sensors.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.sensor_type} #${s.id}</option>`;
        });
    }

    // ==========================================
    // ── ISTORIC CITIRI SENZORI ──
    // ==========================================

    async function loadSensorHistory(sensorId = null) {
        const container = document.getElementById("history-list");
        if (!container) return;

        container.innerHTML = `<div class="history-empty">Se încarcă istoricul...</div>`;

        try {
            let url;
            if (sensorId) {
                url = `/sensors/${sensorId}/readings`;
            } else {
                url = `/sensors/readings/all`;
            }

            const res = await window.authFetch(url);

            if (!res.ok) {
                container.innerHTML = `<div class="history-empty">Eroare la încărcarea datelor.</div>`;
                return;
            }

            const readings = await res.json();

            if (!readings || readings.length === 0) {
                container.innerHTML = `<div class="history-empty">Niciun istoric disponibil.</div>`;
                return;
            }

            // Construim un map sensorId -> info senzor pentru label-uri
            const sensorMap = {};
            (state.currentReactor?.sensors || []).forEach(s => {
                sensorMap[s.id] = s;
            });

            container.innerHTML = readings.map(reading => {
                const sensor = sensorMap[reading.sensor_id];
                const sensorLabel = sensor
                    ? `${sensor.sensor_type} #${reading.sensor_id}`
                    : `Senzor #${reading.sensor_id}`;
                const unit = sensor?.unit || "";

                // Determinăm starea valorii față de limitele senzorului
                let stateColor = "#3B6D11";
                let stateBg = "#EAF3DE";
                let stateText = "Normal";

                if (sensor) {
                    const v = parseFloat(reading.recorded_value);
                    const min = sensor.min_safe_value ?? -Infinity;
                    const max = sensor.max_safe_value ?? Infinity;
                    const margin = (max - min) * 0.15;

                    if (v > max || v < min) {
                        stateColor = "#A32D2D"; stateBg = "#FCEBEB"; stateText = "Critic";
                    } else if (v > max - margin || v < min + margin) {
                        stateColor = "#854F0B"; stateBg = "#FAEEDA"; stateText = "Avertizare";
                    }
                }

                return `
                <div style="display:flex;align-items:center;justify-content:space-between;
                            padding:9px 12px;border-bottom:1px solid var(--color-border, #eee);
                            font-size:12px;gap:12px;">
                    <span style="font-weight:500;color:var(--color-text-primary,#111);
                                 min-width:140px;white-space:nowrap;overflow:hidden;
                                 text-overflow:ellipsis;">
                        ${sensorLabel}
                    </span>
                    <span style="font-size:13px;font-weight:600;color:${stateColor};
                                 background:${stateBg};padding:2px 8px;border-radius:20px;
                                 white-space:nowrap;">
                        ${reading.recorded_value} ${unit}
                    </span>
                    <span style="color:var(--color-text-secondary,#888);white-space:nowrap;
                                 font-size:11px;margin-left:auto;">
                        ${formatSmallTime(reading.recorded_at)}
                    </span>
                </div>`;
            }).join("");

        } catch (err) {
            console.error("Eroare la încărcarea istoricului senzori:", err);
            container.innerHTML = `<div class="history-empty">Eroare la încărcarea datelor.</div>`;
        }
    }

    // ==========================================
    // ── LOGICĂ ALERTE REALE DIN DB ──
    // ==========================================
    
    function formatSmallTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr.replace(' ', 'T'));
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${hours}:${minutes} - ${day}.${month}`;
    }

    async function loadReactorSpecificLog(id) {
        const logBox = document.getElementById('alert-list');
        const countPill = document.getElementById('alert-count-pill');
        const alertSub = document.getElementById('alert-sub');
        if (!logBox) return;

        try {
            const res = await window.authFetch(`/alerts/history/reactor/${id}`);
            if (res.ok) {
                const historyAlerts = await res.json();

                if (historyAlerts.length === 0) {
                    logBox.innerHTML = `
                        <div style="text-align: center; color: var(--color-text-secondary); font-style: italic; padding: 40px 20px;">
                            Sistem stabil. Nicio alertă.
                        </div>`;
                    if (countPill) countPill.classList.add('hidden');
                    if (alertSub) alertSub.textContent = `Evenimente înregistrate`;
                    return;
                }

                if (countPill) {
                    countPill.textContent = historyAlerts.length;
                    countPill.classList.remove('hidden');
                }
                if (alertSub) {
                    alertSub.textContent = `${historyAlerts.length} evenimente recente`;
                }

                const recentAlerts = historyAlerts.slice(0, 15);
                logBox.innerHTML = recentAlerts.map(alert => {
                    const isCrit = alert.severity === 'critical';
                    return `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-weight: 700; color: ${isCrit ? '#E24B4A' : '#BA7517'};">
                                ${isCrit ? 'CRITICĂ' : 'AVERTIZARE'}
                            </span>
                            <span style="color: #999;">${formatSmallTime(alert.created_at)}</span>
                        </div>
                        <div style="line-height: 1.3; color: #333; margin-bottom: 4px;">${alert.message}</div>
                        ${alert.is_resolved ? `<div style="color: green; font-weight: bold;">✔ Rezolvat</div>` : '<div style="color: red; font-weight: bold;">⚠️ Activă</div>'}
                    </div>`;
                }).join('');
            }
        } catch (e) {
            console.error("Eroare la încărcarea jurnalului de alerte:", e);
            logBox.innerHTML = `<div class="history-empty">Eroare la aducerea datelor.</div>`;
        }
    }

    // ==========================================
    // ── ISTORIC MENTENANȚĂ ──
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
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                
                const targetId = e.target.getAttribute('data-target');
                if (targetId) {
                    document.getElementById(targetId)?.classList.add('active');
                }

                // Când se deschide tab-ul istoric, reîncărcăm datele
                if (targetId === 'tab-istoric') {
                    const selectedSensorId = document.getElementById('filter-sensor')?.value || null;
                    loadSensorHistory(selectedSensorId || null);
                }
            });
        });

        // ── FILTRU SENZOR în tab-ul Istoric citiri ──
        document.getElementById('filter-sensor')?.addEventListener('change', (e) => {
            const sensorId = e.target.value || null;
            loadSensorHistory(sensorId);
        });

        document.querySelectorAll('.btn-close-modal, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-close-modal')) {
                    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
                }
            });
        });

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

        document.getElementById('btn-start')?.addEventListener('click', () => openStatusModal('Activ', 'Pornire Reactor', '✅', null));
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
                    state.currentReactor.status = 'Mentenanță';
                    renderReactorDetails(state.currentReactor);
                    
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

        document.getElementById('btn-finish-maint')?.addEventListener('click', async () => {
            if (!confirm("Sunteți sigur că mentenanța a fost finalizată? Reactorul va deveni activ.")) return;

            try {
                const res = await window.authFetch(`/reactors/${state.currentReactor.id}/maintenance/stop`, {
                    method: 'POST'
                });
                
                if (res.ok) {
                    showToast('Mentenanță finalizată. Reactor activat.');
                    state.currentReactor.status = 'Activ';
                    renderReactorDetails(state.currentReactor);
                    
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