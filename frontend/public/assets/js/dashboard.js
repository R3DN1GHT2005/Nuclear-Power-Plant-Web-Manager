document.addEventListener("DOMContentLoaded", async () => {
    //Preluăm toate reactoarele de pe backend
    const reactors = await NuclearAPI.getReactors();

    if (!reactors || reactors.length === 0) {
        document.getElementById("dashboard-metrics").innerHTML = "<p>Nu există date.</p>";
        document.getElementById("dashboard-reactor-table").innerHTML = "<tr><td colspan='6'>Nu s-au găsit reactoare.</td></tr>";
        return;
    }

    calculateAndRenderMetrics(reactors);
    renderReactorTable(reactors);
});


function calculateAndRenderMetrics(reactors) {
    const totalReactors = reactors.length;
    const activeReactors = reactors.filter(r => r.status.toLowerCase() === 'activ').length;
    
    let totalEfficiency = 0;
    let validEfficiencyCount = 0;
    let criticalAlerts = 0;
    let warnings = 0;

    reactors.forEach(r => {

        if (r.current_efficiency && r.status.toLowerCase() !== 'oprit') {
            totalEfficiency += parseFloat(r.current_efficiency);
            validEfficiencyCount++;
        }

        const statusStr = r.status.toLowerCase();
        if (statusStr === 'alertă') criticalAlerts++;
        if (statusStr === 'mentenanță') warnings++;

        if (r.sensors) {
            r.sensors.forEach(s => {
                if ((s.type === 'Temperatura' || s.sensor_type === 'Temperatura') && s.value > 350) {
                    criticalAlerts++; 
                }
            });
        }
    });

    const avgEfficiency = validEfficiencyCount > 0 ? (totalEfficiency / validEfficiencyCount).toFixed(1) : 0;

    const metricsContainer = document.getElementById("dashboard-metrics");
    metricsContainer.innerHTML = `
        <div class="metric-card ${activeReactors === totalReactors ? 'green' : 'amber'}">
            <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
            <div class="metric-label">Reactoare active</div>
            <div class="metric-value ${activeReactors === totalReactors ? 'green' : 'amber'}">${activeReactors} / ${totalReactors}</div>
            <div class="metric-sub">${totalReactors - activeReactors} inactive momentan</div>
        </div>

        <div class="metric-card ${avgEfficiency > 80 ? 'green' : 'amber'}">
            <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="metric-label">Eficiență medie</div>
            <div class="metric-value ${avgEfficiency > 80 ? 'green' : 'amber'}">${avgEfficiency}%</div>
            <div class="metric-sub">Calculată la reactoarele active</div>
        </div>

        <div class="metric-card ${warnings > 0 ? 'amber' : 'green'}">
            <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></div>
            <div class="metric-label">Avertismente</div>
            <div class="metric-value ${warnings > 0 ? 'amber' : 'green'}">${warnings}</div>
            <div class="metric-sub">Reactoare în mentenanță</div>
        </div>

        <div class="metric-card ${criticalAlerts > 0 ? 'red' : 'green'}">
            <div class="metric-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></div>
            <div class="metric-label">Alerte critice</div>
            <div class="metric-value ${criticalAlerts > 0 ? 'red' : 'green'}">${criticalAlerts}</div>
            <div class="metric-sub">${criticalAlerts > 0 ? 'ACȚIUNE NECESARĂ' : 'Toți parametrii normali'}</div>
        </div>
    `;
}


function renderReactorTable(reactors) {
    const tbody = document.getElementById("dashboard-reactor-table");
    
    const rowConfig = {
        'activ': { rowClass: '', badgeClass: '', badgeText: '', fillClass: 'bf-green', pillClass: 'pill-active', actionClass: 'action-none', actionText: 'Detalii →' },
        'alertă': { rowClass: 'row-critical', badgeClass: 'rb-crit', badgeText: '!', fillClass: 'bf-red', pillClass: 'pill-alert', actionClass: 'action-crit', actionText: 'Intervenție →' },
        'mentenanță': { rowClass: 'row-maint', badgeClass: 'rb-warn', badgeText: 'M', fillClass: 'bf-amber', pillClass: 'pill-maint', actionClass: 'action-warn', actionText: 'Detalii →' },
        'oprit': { rowClass: 'row-off', badgeClass: 'rb-off', badgeText: '—', fillClass: 'bf-gray', pillClass: 'pill-off', actionClass: 'action-none', actionText: 'Detalii →' }
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
                mainTemp = tempSensor.value;
                if (mainTemp > 350) tempClass = 'temp-hot';
            }
        }

        const dateObj = new Date(r.last_maintenance);
        const timeString = isNaN(dateObj) ? '--' : dateObj.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'});

        tableHtml += `
            <tr class="${style.rowClass}">
                <td>
                    ${style.badgeText ? `<span class="rank-badge ${style.badgeClass}">${style.badgeText}</span>` : ''}
                    <span class="reactor-name" ${!style.badgeText ? 'style="margin-left:23px"' : ''}>${r.name}</span>
                </td>
                <td>
                    <div class="bar-wrap">
                        <div class="bar-track"><div class="bar-fill ${style.fillClass}" style="width:${r.current_efficiency || 0}%"></div></div>
                        <span class="bar-pct" ${status === 'oprit' ? 'style="color:var(--text-3)"' : ''}>${status === 'oprit' ? '—' : r.current_efficiency + '%'}</span>
                    </div>
                </td>
                <td><span class="temp-val ${tempClass}" ${status === 'oprit' ? 'style="color:var(--text-3)"' : ''}>${mainTemp}</span></td>
                <td><span class="pill ${style.pillClass}">${r.status}</span></td>
                <td class="mono" style="font-size:12px; ${status === 'oprit' ? 'color:var(--text-3)' : ''}">${timeString}</td>
                <td><a class="action-link ${style.actionClass}" href="reactors.html">${style.actionText}</a></td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHtml;
}