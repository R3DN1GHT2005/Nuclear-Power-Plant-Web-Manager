document.addEventListener("DOMContentLoaded", async () => {
    const reactors = await NuclearAPI.getReactors();

    if (!reactors || reactors.length === 0) {
        document.getElementById("dashboard-metrics").innerHTML = "<p>Nu există date.</p>";
        document.getElementById("dashboard-reactor-table").innerHTML = "<tr><td colspan='6'>Nu s-au găsit reactoare.</td></tr>";
    } else {
        calculateAndRenderMetrics(reactors);
        renderReactorTable(reactors);
    }

    initAlertsFeed();
});


// =====================================================================
// ALERTE ACTIVE
// =====================================================================

function initAlertsFeed() {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    container.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes alertPulseRing {
            0%   { box-shadow: 0 0 0 0 rgba(226,75,74,0.35); }
            70%  { box-shadow: 0 0 0 8px rgba(226,75,74,0); }
            100% { box-shadow: 0 0 0 0 rgba(226,75,74,0); }
        }
        @keyframes alertPulseRingAmber {
            0%   { box-shadow: 0 0 0 0 rgba(186,117,23,0.35); }
            70%  { box-shadow: 0 0 0 8px rgba(186,117,23,0); }
            100% { box-shadow: 0 0 0 0 rgba(186,117,23,0); }
        }
        @keyframes dotBlink {
            0%,100% { opacity:1; }
            50%     { opacity:0.25; }
        }
        .alert-card-v2 {
            background: var(--color-background-primary);
            border: 0.5px solid var(--color-border-tertiary);
            border-radius: var(--border-radius-lg);
            overflow: hidden;
        }
        .alert-card-body {
            padding: 14px 18px 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .alert-dot {
            width: 8px; height: 8px; border-radius: 50%;
            animation: dotBlink 1.4s ease-in-out infinite;
            flex-shrink: 0;
        }
        .alert-resolve-btn-v2 {
            align-self: flex-start;
            color: #fff;
            border: none;
            border-radius: var(--border-radius-md);
            padding: 9px 18px;
            font-size: 12.5px; font-weight: 500; cursor: pointer;
            display: flex; align-items: center; gap: 7px;
            transition: background 0.15s, box-shadow 0.15s;
            font-family: inherit;
        }
        .alert-resolve-btn-v2.crit {
            background: #E24B4A;
            animation: alertPulseRing 2s ease-out infinite;
        }
        .alert-resolve-btn-v2.crit:hover { background: #C53030; }
        .alert-resolve-btn-v2.warn {
            background: #BA7517;
            animation: alertPulseRingAmber 2s ease-out infinite;
        }
        .alert-resolve-btn-v2.warn:hover { background: #9A5F0F; }
        .alert-confirm-btn-v2 {
            align-self: flex-start;
            background: var(--color-background-success);
            color: var(--color-text-success);
            border: 0.5px solid var(--color-border-success);
            border-radius: var(--border-radius-md);
            padding: 9px 18px;
            font-size: 12px; font-weight: 500; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
            font-family: inherit;
        }
        .alert-confirm-btn-v2:hover { opacity: 0.85; }
        .alert-textarea-v2 {
            background: var(--color-background-secondary);
            border: 0.5px solid var(--color-border-secondary);
            border-radius: var(--border-radius-md);
            color: var(--color-text-primary);
            padding: 9px 11px;
            font-size: 12px; line-height: 1.5;
            resize: vertical;
            font-family: inherit;
            width: 100%; box-sizing: border-box;
        }
        .alert-textarea-v2:focus { outline: none; border-color: var(--color-border-primary); }
    `;
    document.head.appendChild(style);

    function timeAgo(dateStr) {
        if (!dateStr) return '';
        const normalized = dateStr.replace(' ', 'T');
        const diff = Math.floor((Date.now() - new Date(normalized)) / 1000);
        if (diff < 60) return `acum ${diff}s`;
        if (diff < 3600) return `acum ${Math.floor(diff / 60)}min`;
        if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
        return `acum ${Math.floor(diff / 86400)}z`;
    }

    function renderAlerts(alerts) {
        if (!alerts || alerts.length === 0) {
            container.innerHTML = `
                <div style="padding:32px 18px; display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--color-text-secondary);">
                    <i class="ti ti-circle-check" style="font-size:36px; opacity:0.4;" aria-hidden="true"></i>
                    <div style="font-size:13px; font-weight:500;">Nicio alertă activă</div>
                    <div style="font-size:12px; opacity:0.6;">Toți parametrii în limite normale</div>
                </div>`;
            return;
        }

        container.innerHTML = alerts.map(alert => {
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
                        <span style="
                            font-size:10px; font-weight:500; letter-spacing:0.5px;
                            padding:3px 9px; border-radius:20px;
                            background:${badgeBg}; color:${badgeColor};
                            border:0.5px solid ${badgeBorder};
                        ">${severityText}</span>
                        <span style="font-size:12px; color:var(--color-text-secondary); margin-left:auto;">
                            ${timeAgo(alert.created_at)}
                        </span>
                    </div>

                    <div style="
                        font-size:12.5px; line-height:1.65;
                        color:${msgColor};
                        background:${msgBg};
                        border:0.5px solid ${msgBorderRest};
                        border-left:3px solid ${msgBorderL};
                        border-radius:0 var(--border-radius-md) var(--border-radius-md) 0;
                        padding:10px 14px;
                    ">${alert.message || ''}</div>

                    <div>
                        <button
                            class="alert-resolve-btn-v2 ${btnClass}"
                            onclick="toggleResolveFormV2(this, ${alert.id})"
                        >
                            <i class="ti ti-tool" style="font-size:14px;" aria-hidden="true"></i>
                            Intervino / Rezolvă alarma
                        </button>
                    </div>

                    <div id="resolve-form-${alert.id}" style="display:none; flex-direction:column; gap:8px;">
                        <div style="font-size:11px; color:var(--color-text-secondary); font-weight:500;">
                            Jurnal de intervenție <span style="color:${dotColor};">*</span>
                        </div>
                        <textarea
                            class="alert-textarea-v2"
                            id="resolve-notes-${alert.id}"
                            rows="3"
                            placeholder="Ex: Am redus puterea pompei la 80%..."
                        ></textarea>
                        <button
                            class="alert-confirm-btn-v2"
                            onclick="submitResolveV2(${alert.id}, this)"
                        >
                            <i class="ti ti-check" style="font-size:14px;" aria-hidden="true"></i>
                            Confirmă salvarea
                        </button>
                    </div>

                </div>
            </div>`;
        }).join('');
    }

    async function fetchAndRender() {
        try {
            const res = await window.authFetch('/alerts/active');
            if (res.ok) {
                const alerts = await res.json();
                renderAlerts(alerts);
            }
        } catch (e) {
            console.error('Eroare la încărcarea alertelor:', e);
        }
    }

    setInterval(fetchAndRender, 5000);
    fetchAndRender();
}


// =====================================================================
// TOGGLE + SUBMIT ALERTE
// =====================================================================

function toggleResolveFormV2(btn, alertId) {
    const form = document.getElementById(`resolve-form-${alertId}`);
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
}

async function submitResolveV2(alertId, btn) {
    const notes = document.getElementById(`resolve-notes-${alertId}`)?.value.trim();
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
            const card = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (card) {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateY(-4px)';
                setTimeout(() => card.remove(), 300);
            }
        } else {
            alert('Eroare la salvare. Încearcă din nou.');
            btn.disabled = false;
            if (icon) icon.className = 'ti ti-check';
            btn.childNodes[btn.childNodes.length - 1].textContent = ' Confirmă salvarea';
        }
    } catch (e) {
        console.error(e);
        btn.disabled = false;
        if (icon) icon.className = 'ti ti-check';
        btn.childNodes[btn.childNodes.length - 1].textContent = ' Confirmă salvarea';
    }
}


// =====================================================================
// METRICI
// =====================================================================

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

    const avgEfficiency = validEfficiencyCount > 0
        ? (totalEfficiency / validEfficiencyCount).toFixed(1)
        : 0;

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


// =====================================================================
// TABEL REACTOARE
// =====================================================================

function renderReactorTable(reactors) {
    const tbody = document.getElementById("dashboard-reactor-table");

    const rowConfig = {
        'activ':      { rowClass: '',            badgeClass: '',        badgeText: '',  fillClass: 'bf-green', pillClass: 'pill-active', actionClass: 'action-none', actionText: 'Detalii →' },
        'alertă':     { rowClass: 'row-critical', badgeClass: 'rb-crit', badgeText: '!', fillClass: 'bf-red',   pillClass: 'pill-alert',  actionClass: 'action-crit', actionText: 'Intervenție →' },
        'mentenanță': { rowClass: 'row-maint',    badgeClass: 'rb-warn', badgeText: 'M', fillClass: 'bf-amber', pillClass: 'pill-maint',  actionClass: 'action-warn', actionText: 'Detalii →' },
        'oprit':      { rowClass: 'row-off',      badgeClass: 'rb-off',  badgeText: '—', fillClass: 'bf-gray',  pillClass: 'pill-off',    actionClass: 'action-none', actionText: 'Detalii →' }
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
        const timeString = isNaN(dateObj)
            ? '--'
            : dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

        const isOff = status === 'oprit';
        const offTextStyle = isOff ? 'style="color: var(--text-3);"' : '';
        const efficiencyWidth = r.current_efficiency || 0;
        const efficiencyText = isOff ? '—' : `${r.current_efficiency}%`;
        const nameMarginStyle = !style.badgeText ? 'style="margin-left: 23px;"' : '';

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
                    <a class="action-link ${style.actionClass}" href="reactors.html">${style.actionText}</a>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHtml;
}