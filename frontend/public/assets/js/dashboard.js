document.addEventListener("DOMContentLoaded", () => {
    const metricsContainer = document.getElementById("dashboard-metrics");
    const tableContainer = document.getElementById("dashboard-reactor-table");

    if (metricsContainer && tableContainer) {
        
        async function fetchAndRenderDashboard() {
            try {
                const [reactors, alertsRes] = await Promise.all([
                    NuclearAPI.getReactors(),
                    window.authFetch('/alerts/active')
                ]);
                
                let activeAlerts = [];
                if (alertsRes && alertsRes.ok) {
                    activeAlerts = await alertsRes.json();
                }

                if (!reactors || reactors.length === 0) {
                    metricsContainer.innerHTML = "<p>Nu există date.</p>";
                    tableContainer.innerHTML = "<tr><td colspan='6'>Nu s-au găsit reactoare.</td></tr>";
                } else {
                    // === LOGICA DE SORTARE ===
                    // Avarii > Warning > Active > Mentenanță > Oprite
                    reactors.sort((a, b) => getReactorPriority(a.status) - getReactorPriority(b.status));

                    calculateAndRenderMetrics(reactors, activeAlerts);
                    renderReactorTable(reactors);
                }
            } catch(e) {
                console.error("Eroare dashboard:", e);
            }
        }

        fetchAndRenderDashboard();
        setInterval(fetchAndRenderDashboard, 5000);
    }
});

// Funcție care atribuie o valoare numerică fiecărui status pentru a le putea sorta
function getReactorPriority(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('avarie') || s.includes('alertă')) return 1;
    if (s.includes('avertizare') || s.includes('warning')) return 2;
    if (s.includes('activ') || s.includes('operațional')) return 3;
    if (s.includes('mentenanță') || s.includes('construcție')) return 4;
    if (s.includes('oprit') || s.includes('inactiv')) return 5;
    return 6; // Default
}

function calculateAndRenderMetrics(reactors, activeAlerts) {
    const totalReactors = reactors.length;
    const activeReactors = reactors.filter(r => {
        const s = (r.status || '').toLowerCase();
        return s === 'activ' || s === 'operațional';
    }).length;

    let totalEfficiency = 0;
    let validEfficiencyCount = 0;
    let warnings = 0;

    reactors.forEach(r => {
        const statusStr = (r.status || '').toLowerCase();
        
        if (r.current_efficiency && statusStr !== 'oprit' && !statusStr.includes('mentenanță')) {
            totalEfficiency += parseFloat(r.current_efficiency);
            validEfficiencyCount++;
        }

        if (statusStr.includes('mentenanță')) warnings++;
    });

    const criticalAlertsCount = activeAlerts.filter(a => a.severity === 'critical').length;

    const avgEfficiency = validEfficiencyCount > 0
        ? (totalEfficiency / validEfficiencyCount).toFixed(1)
        : 0;

    const metricsContainer = document.getElementById("dashboard-metrics");
    
    // === REZOLVAREA REFRESH-ULUI VIZUAL (FLICKER) ===
    // Injectăm structura HTML doar la prima încărcare
    if (!document.getElementById("val-active")) {
        metricsContainer.innerHTML = `
            <div class="metric-card" id="card-active">
                <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
                <div class="metric-label">Reactoare active</div>
                <div class="metric-value" id="val-active"></div>
                <div class="metric-sub" id="sub-active"></div>
            </div>
            <div class="metric-card" id="card-eff">
                <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div class="metric-label">Eficiență medie</div>
                <div class="metric-value" id="val-eff"></div>
                <div class="metric-sub">Calculată la reactoarele active</div>
            </div>
            <div class="metric-card" id="card-warn">
                <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></div>
                <div class="metric-label">Avertismente</div>
                <div class="metric-value" id="val-warn"></div>
                <div class="metric-sub">Reactoare în mentenanță</div>
            </div>
            <div class="metric-card" id="card-crit">
                <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></div>
                <div class="metric-label">Alerte critice</div>
                <div class="metric-value" id="val-crit"></div>
                <div class="metric-sub" id="sub-crit"></div>
            </div>
        `;
    }

    // După ce suntem siguri că există, actualizăm doar textul și clasele css de pe ele
    const colorActive = activeReactors === totalReactors ? 'green' : 'amber';
    document.getElementById("card-active").className = `metric-card ${colorActive}`;
    document.getElementById("val-active").className = `metric-value ${colorActive}`;
    document.getElementById("val-active").textContent = `${activeReactors} / ${totalReactors}`;
    document.getElementById("sub-active").textContent = `${totalReactors - activeReactors} inactive momentan`;

    const colorEff = avgEfficiency > 80 ? 'green' : 'amber';
    document.getElementById("card-eff").className = `metric-card ${colorEff}`;
    document.getElementById("val-eff").className = `metric-value ${colorEff}`;
    document.getElementById("val-eff").textContent = `${avgEfficiency}%`;

    const colorWarn = warnings > 0 ? 'amber' : 'green';
    document.getElementById("card-warn").className = `metric-card ${colorWarn}`;
    document.getElementById("val-warn").className = `metric-value ${colorWarn}`;
    document.getElementById("val-warn").textContent = warnings;

    const colorCrit = criticalAlertsCount > 0 ? 'red' : 'green';
    document.getElementById("card-crit").className = `metric-card ${colorCrit}`;
    document.getElementById("val-crit").className = `metric-value ${colorCrit}`;
    document.getElementById("val-crit").textContent = criticalAlertsCount;
    document.getElementById("sub-crit").textContent = criticalAlertsCount > 0 ? 'ACȚIUNE NECESARĂ' : 'Toți parametrii normali';
}

function renderReactorTable(reactors) {
    const tbody = document.getElementById("dashboard-reactor-table");

    const rowConfig = {
        'activ':         { rowClass: '',            badgeClass: '',        badgeText: '',  fillClass: 'bf-green', pillClass: 'pill-active', actionClass: 'action-none', actionText: 'Detalii →' },
        'operațional':   { rowClass: '',            badgeClass: '',        badgeText: '',  fillClass: 'bf-green', pillClass: 'pill-active', actionClass: 'action-none', actionText: 'Detalii →' },
        
        'alertă':        { rowClass: 'row-critical', badgeClass: 'rb-crit', badgeText: '!', fillClass: 'bf-red',   pillClass: 'pill-alert',  actionClass: 'action-crit', actionText: 'Intervenție →' },
        'avarie':        { rowClass: 'row-critical', badgeClass: 'rb-crit', badgeText: '!', fillClass: 'bf-red',   pillClass: 'pill-alert',  actionClass: 'action-crit', actionText: 'Intervenție →' },
        
        'mentenanță':    { rowClass: 'row-maint',    badgeClass: 'rb-warn', badgeText: 'M', fillClass: 'bf-amber', pillClass: 'pill-maint',  actionClass: 'action-warn', actionText: 'Detalii →' },
        'în mentenanță': { rowClass: 'row-maint',    badgeClass: 'rb-warn', badgeText: 'M', fillClass: 'bf-amber', pillClass: 'pill-maint',  actionClass: 'action-warn', actionText: 'Detalii →' },
        
        'oprit':         { rowClass: 'row-off',      badgeClass: 'rb-off',  badgeText: '—', fillClass: 'bf-gray',  pillClass: 'pill-off',    actionClass: 'action-none', actionText: 'Detalii →' }
    };

    let tableHtml = '';

    reactors.forEach(r => {
        const status = r.status ? r.status.toLowerCase() : 'activ';
        const style = rowConfig[status] || rowConfig['activ'];

        let mainTemp = '—';
        let tempClass = '';
        
        if (r.sensors && r.sensors.length > 0) {
            const tempSensor = r.sensors.find(s => (s.type === 'Temperatura' || s.sensor_type === 'Temperatura'));
            if (tempSensor) {
                mainTemp = tempSensor.current_value !== null ? tempSensor.current_value : '—';
                if (mainTemp !== '—' && mainTemp > 350) {
                    tempClass = 'temp-hot';
                }
            }
        }

        const dateObj = new Date(r.last_maintenance);
        const timeString = isNaN(dateObj) ? '--' : dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

        const isOff = status === 'oprit';
        const offTextStyle = isOff ? 'style="color: var(--text-3);"' : '';
        const efficiencyWidth = r.current_efficiency || 0;
        const efficiencyText = isOff ? '—' : `${r.current_efficiency}%`;
        const nameMarginStyle = !style.badgeText ? 'style="margin-left: 23px;"' : '';
        const reactorDetailsHref = r.id != null
            ? `reactor.html?id=${encodeURIComponent(r.id)}`
            : 'reactors.html';

        tableHtml += `
            <tr class="${style.rowClass}">
                <td>
                    ${style.badgeText ? `<span class="rank-badge ${style.badgeClass}">${style.badgeText}</span>` : ''}
                    <span class="reactor-name" ${nameMarginStyle}>${r.name}</span>
                </td>
                <td>
                    <div class="bar-wrap">
                        <div class="bar-track">
                            <div class="bar-fill ${style.fillClass}" style="width: ${efficiencyWidth}%;"></div>
                        </div>
                        <span class="bar-pct" ${offTextStyle}>${efficiencyText}</span>
                    </div>
                </td>
                <td>
                    <span class="temp-val ${tempClass}" ${offTextStyle}>${mainTemp}</span>
                </td>
                <td>
                    <span class="pill ${style.pillClass}">${r.status}</span>
                </td>
                <td class="mono" style="font-size: 12px;" ${offTextStyle}>${timeString}</td>
                <td>
                    <a class="action-link ${style.actionClass}" href="${reactorDetailsHref}">${style.actionText}</a>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHtml;
}