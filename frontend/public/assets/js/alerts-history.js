document.addEventListener("DOMContentLoaded", () => {
    loadFullHistory();
});

// O funcție frumoasă de formatare a datei pentru tabel
function formatTableDate(dateStr) {
    if (!dateStr) return '<span style="color: #A0AEC0;">—</span>';
    const d = new Date(dateStr.replace(' ', 'T'));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} <br> <span style="color: #8A96A8; font-size: 10px;">ora ${hours}:${mins}</span>`;
}

window.loadFullHistory = async function() {
    const tbody = document.getElementById("history-table-body");
    const btnRefresh = document.getElementById("btn-refresh-history");
    
    if (btnRefresh) {
        btnRefresh.textContent = "⏳ Se încarcă...";
        btnRefresh.disabled = true;
    }

    try {
        const res = await window.authFetch('/alerts/history');
        
        if (res.ok) {
            const alerts = await res.json();

            if (alerts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" class="history-empty">Nu există nicio alertă înregistrată în sistem.</td></tr>`;
                return;
            }

            tbody.innerHTML = alerts.map(alert => {
                // Generare badge Severitate
                const isCrit = alert.severity === 'critical';
                const sevClass = isCrit ? 'critical' : 'warning';
                const sevLabel = isCrit ? 'CRITICĂ' : 'AVERTIZARE';
                const sevBadge = `<span class="badge-sev ${sevClass}">${sevLabel}</span>`;

                // Generare badge Status
                const statusBadge = alert.is_resolved 
                    ? `<span class="badge-status resolved">✔️ Soluționat</span>`
                    : `<span class="badge-status active">⚠️ Activă</span>`;

                // Date
                const createdAt = formatTableDate(alert.created_at);
                const resolvedAt = formatTableDate(alert.resolved_at);

                // Personal / Intervenient
                const resolverName = alert.resolver_name 
                    ? `<span style="font-weight: 500;">${alert.resolver_name}</span>` 
                    : '<span style="color: #A0AEC0;">—</span>';

                // Notițe
                const notesHtml = alert.resolution_notes 
                    ? `<div class="history-notes">"${alert.resolution_notes}"</div>` 
                    : '<span style="color: #A0AEC0;">—</span>';

                return `
                <tr>
                    <td style="font-family: 'DM Mono'; font-size: 11px; color: #8A96A8;">#${alert.id}</td>
                    <td style="font-weight: 600;">${alert.reactor_name}</td>
                    <td>${sevBadge}</td>
                    <td>${statusBadge}</td>
                    <td><div class="history-msg">${alert.message}</div></td>
                    <td class="time-cell">${createdAt}</td>
                    <td class="time-cell">${resolvedAt}</td>
                    <td>${resolverName}</td>
                    <td>${notesHtml}</td>
                </tr>`;
            }).join('');
            
        } else if (res.status === 403) {
            tbody.innerHTML = `<tr><td colspan="9" class="history-empty" style="color: #DC2626;">Nu aveți permisiunea de a vizualiza istoricul global (Necesită rol de Administrator).</td></tr>`;
        } else {
            throw new Error("Eroare la preluarea datelor.");
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="9" class="history-empty" style="color: #DC2626;">Eroare de conexiune la server.</td></tr>`;
    } finally {
        if (btnRefresh) {
            btnRefresh.textContent = "🔄 Reîmprospătează";
            btnRefresh.disabled = false;
        }
    }
};