let allReactors = [];

document.addEventListener("DOMContentLoaded", async () => {
    const gridContainer = document.getElementById("reactor-grid-container");

    gridContainer.innerHTML = `
        <p style="grid-column:1/-1; text-align:center; color:var(--text-2); padding:40px 0;">
            Se încarcă datele...
        </p>`;

    injectStyles();

    allReactors = await NuclearAPI.getReactors();

    renderReactors(allReactors);
    setupFilters();
    initAlertsFeed();
});


// =====================================================================
// STILURI INJECTATE
// =====================================================================

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rPulseRing {
            0%   { box-shadow: 0 0 0 0 rgba(226,75,74,0.3); }
            70%  { box-shadow: 0 0 0 7px rgba(226,75,74,0); }
            100% { box-shadow: 0 0 0 0 rgba(226,75,74,0); }
        }
        @keyframes rDotBlink {
            0%,100% { opacity:1; }
            50%     { opacity:0.2; }
        }

        .rcard-v2 {
            background: var(--color-background-primary, #fff);
            border: 0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12));
            border-radius: var(--border-radius-lg, 12px);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .rcard-v2:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.07);
            transform: translateY(-1px);
        }
        .rcard-v2.is-alert {
            border-color: #F09595;
            border-left: 3px solid #E24B4A;
            animation: rPulseRing 2.4s ease-out infinite;
        }
        .rcard-v2.is-maint {
            border-left: 3px solid #BA7517;
        }

        /* HEADER */
        .rcard-v2-header {
            padding: 16px 18px 12px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }
        .rcard-v2-name {
            font-size: 17px;
            font-weight: 500;
            color: var(--color-text-primary);
            margin: 0 0 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .rcard-v2-dot {
            width: 7px; height: 7px; border-radius: 50%;
            flex-shrink: 0;
            animation: rDotBlink 1.5s ease-in-out infinite;
        }
        .rcard-v2-sub {
            font-size: 11.5px;
            color: var(--color-text-secondary);
        }

        /* EFFICIENCY BAR */
        .rcard-v2-bar-wrap {
            padding: 0 18px 12px;
        }
        .rcard-v2-bar-labels {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            color: var(--color-text-secondary);
            margin-bottom: 5px;
        }
        .rcard-v2-bar-track {
            height: 5px;
            background: var(--color-background-secondary, rgba(0,0,0,0.06));
            border-radius: 99px;
            overflow: hidden;
        }
        .rcard-v2-bar-fill {
            height: 100%;
            border-radius: 99px;
            transition: width 0.5s ease;
        }
        .bar-fill-green  { background: #639922; }
        .bar-fill-red    { background: #E24B4A; }
        .bar-fill-amber  { background: #BA7517; }
        .bar-fill-gray   { background: var(--color-border-secondary, rgba(0,0,0,0.2)); }

        /* META STRIP */
        .rcard-v2-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px 16px;
            padding: 9px 18px;
            font-size: 11.5px;
            color: var(--color-text-secondary);
            border-top: 0.5px solid var(--color-border-tertiary);
            border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        .rcard-v2-meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .rcard-v2-meta-item i { font-size: 13px; opacity: 0.6; }

        /* SENSORS */
        .rcard-v2-sensors {
            padding: 12px 18px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
        }
        .sensor-box {
            background: var(--color-background-secondary, rgba(0,0,0,0.03));
            border: 0.5px solid var(--color-border-tertiary);
            border-radius: var(--border-radius-md, 8px);
            padding: 9px 11px;
        }
        .sensor-label {
            font-size: 10.5px;
            color: var(--color-text-secondary);
            text-transform: capitalize;
            margin-bottom: 4px;
        }
        .sensor-val {
            font-size: 15px;
            font-weight: 500;
            color: var(--color-text-primary);
        }
        .sensor-val.overheat {
            color: #A32D2D;
        }
        .sensor-box.overheat-box {
            background: #FCEBEB;
            border-color: #F09595;
        }
        .sensor-unit {
            font-size: 10px;
            color: var(--color-text-secondary);
            margin-top: 2px;
            opacity: 0.7;
        }

        /* ALERT MESSAGE */
        .rcard-v2-alert-msg {
            margin: 0 18px 12px;
            font-size: 12px;
            line-height: 1.6;
            color: #791F1F;
            background: #FCEBEB;
            border: 0.5px solid #F09595;
            border-left: 3px solid #E24B4A;
            border-radius: 0 var(--border-radius-md, 8px) var(--border-radius-md, 8px) 0;
            padding: 9px 13px;
        }

        /* FOOTER */
        .rcard-v2-footer {
            margin-top: auto;
            padding: 12px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 0.5px solid var(--color-border-tertiary);
        }
        .rcard-v2-upd {
            font-size: 11px;
            color: var(--color-text-secondary);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .rcard-v2-upd-dot {
            width: 6px; height: 6px; border-radius: 50%;
        }
        .dot-green { background: #639922; }
        .dot-red   { background: #E24B4A; }
        .dot-amber { background: #BA7517; }
        .dot-gray  { background: var(--color-border-secondary); }

        .rcard-v2-detail-btn {
            font-size: 12.5px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            padding: 7px 14px;
            border-radius: var(--border-radius-md, 8px);
            border: 0.5px solid var(--color-border-secondary);
            color: var(--color-text-primary);
            background: transparent;
            transition: background 0.12s;
        }
        .rcard-v2-detail-btn:hover {
            background: var(--color-background-secondary);
        }
        .rcard-v2-detail-btn.is-alert-btn {
            background: #FCEBEB;
            color: #A32D2D;
            border-color: #F09595;
        }
        .rcard-v2-detail-btn.is-alert-btn:hover {
            background: #F7C1C1;
        }

        /* PILL */
        .pill-v2 {
            font-size: 10.5px;
            font-weight: 500;
            letter-spacing: 0.4px;
            padding: 3px 10px;
            border-radius: 20px;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .pill-v2-active { background:#EAF3DE; color:#3B6D11; border:0.5px solid #C0DD97; }
        .pill-v2-alert  { background:#FCEBEB; color:#A32D2D; border:0.5px solid #F09595; }
        .pill-v2-maint  { background:#FAEEDA; color:#854F0B; border:0.5px solid #FAC775; }
        .pill-v2-off    { background:var(--color-background-secondary); color:var(--color-text-secondary); border:0.5px solid var(--color-border-tertiary); }

        /* EMPTY STATE */
        .reactors-empty {
            grid-column: 1/-1;
            text-align: center;
            padding: 48px 0;
            color: var(--color-text-secondary);
            font-size: 13px;
        }
    `;
    document.head.appendChild(style);
}


// =====================================================================
// RANDARE REACTOARE
// =====================================================================

function renderReactors(reactorsList) {
    const gridContainer = document.getElementById("reactor-grid-container");

    if (!reactorsList || reactorsList.length === 0) {
        gridContainer.innerHTML = `
            <div class="reactors-empty">
                <i class="ti ti-search-off" style="font-size:32px; opacity:0.35; display:block; margin-bottom:10px;" aria-hidden="true"></i>
                Nu s-au găsit reactoare conform criteriilor selectate.
            </div>`;
        return;
    }

    gridContainer.innerHTML = reactorsList.map(reactor => createReactorHTML(reactor)).join('');
    attachDetailLinks();
}


// =====================================================================
// GENERARE HTML CARD
// =====================================================================

function createReactorHTML(reactor) {
    const statusLower = reactor.status ? reactor.status.toLowerCase() : 'activ';

    const cfgMap = {
        'activ':      { cardClass: '',          dotColor: '#639922', barClass: 'bar-fill-green', dotClass: 'dot-green', pillClass: 'pill-v2-active', btnClass: '',             btnText: 'Detalii →' },
        'alertă':     { cardClass: 'is-alert',  dotColor: '#E24B4A', barClass: 'bar-fill-red',   dotClass: 'dot-red',   pillClass: 'pill-v2-alert',  btnClass: 'is-alert-btn', btnText: 'Intervenție →' },
        'mentenanță': { cardClass: 'is-maint',  dotColor: '#BA7517', barClass: 'bar-fill-amber', dotClass: 'dot-amber', pillClass: 'pill-v2-maint',  btnClass: '',             btnText: 'Detalii →' },
        'oprit':      { cardClass: '',          dotColor: 'var(--color-border-secondary)', barClass: 'bar-fill-gray', dotClass: 'dot-gray', pillClass: 'pill-v2-off', btnClass: '', btnText: 'Detalii →' }
    };

    const cfg = cfgMap[statusLower] || cfgMap['activ'];
    const isOff = statusLower === 'oprit';
    const isAlert = statusLower === 'alertă';

    const dateObj = new Date(reactor.last_maintenance);
    const formattedDate = isNaN(dateObj)
        ? (reactor.last_maintenance || '--')
        : dateObj.toLocaleString('ro-RO');

    const efficiency = isOff ? '—' : `${reactor.current_efficiency ?? 0}%`;
    const efficiencyWidth = isOff ? 0 : (reactor.current_efficiency ?? 0);

    // Senzori
    let sensorsHTML = '';
    if (reactor.sensors && reactor.sensors.length > 0) {
        sensorsHTML = reactor.sensors.map(sensor => {
            const type  = sensor.sensor_type || 'Senzor';
            const val   = sensor.current_value !== null && sensor.current_value !== undefined
                            ? sensor.current_value : '--';
            const unit  = sensor.unit || '';
            const isHot = type.toLowerCase() === 'temperatura' && val > 350;

            return `
            <div class="sensor-box ${isHot ? 'overheat-box' : ''}">
                <div class="sensor-label">${type}</div>
                <div class="sensor-val ${isHot ? 'overheat' : ''}">${val}<span style="font-size:11px; font-weight:400; opacity:0.7;"> ${unit}</span></div>
                <div class="sensor-unit">ID: ${sensor.id}</div>
            </div>`;
        }).join('');
    } else {
        sensorsHTML = `
            <div class="sensor-box" style="grid-column:1/-1;">
                <div class="sensor-label" style="color:var(--color-text-secondary);">Niciun senzor montat</div>
            </div>`;
    }

    // Mesaj alertă (dacă e cazul)
    const alertMsgHTML = isAlert
        ? `<div class="rcard-v2-alert-msg">
               <i class="ti ti-alert-circle" style="font-size:13px; vertical-align:-1px; margin-right:5px;" aria-hidden="true"></i>
               Reactor în stare de alertă — verificați senzorii și interveniți imediat.
           </div>`
        : '';

    return `
    <article class="rcard-v2 ${cfg.cardClass}">

        <div class="rcard-v2-header">
            <div>
                <h3 class="rcard-v2-name">
                    ${isAlert ? `<div class="rcard-v2-dot" style="background:${cfg.dotColor};"></div>` : ''}
                    ${reactor.name}
                </h3>
                <div class="rcard-v2-sub">ID: NW-${reactor.id} · ${reactor.location_name}</div>
            </div>
            <span class="pill-v2 ${cfg.pillClass}">${reactor.status}</span>
        </div>

        <div class="rcard-v2-bar-wrap">
            <div class="rcard-v2-bar-labels">
                <span>Eficiență</span>
                <span style="font-weight:500; color:var(--color-text-primary);">${efficiency}</span>
            </div>
            <div class="rcard-v2-bar-track">
                <div class="rcard-v2-bar-fill ${cfg.barClass}" style="width:${efficiencyWidth}%;"></div>
            </div>
        </div>

        <div class="rcard-v2-meta">
            <span class="rcard-v2-meta-item">
                <i class="ti ti-circuit-cell" aria-hidden="true"></i>
                ${reactor.reactor_type}
            </span>
            <span class="rcard-v2-meta-item">
                <i class="ti ti-droplet" aria-hidden="true"></i>
                ${reactor.cooling_water_source}
            </span>
            <span class="rcard-v2-meta-item">
                <i class="ti ti-building-community" aria-hidden="true"></i>
                ${reactor.distance_to_nearest_city_km} km
            </span>
            <span class="rcard-v2-meta-item">
                <i class="ti ti-mountain" aria-hidden="true"></i>
                ${reactor.elevation_meters} m alt.
            </span>
        </div>

        <div class="rcard-v2-sensors">
            ${sensorsHTML}
        </div>

        ${alertMsgHTML}

        <footer class="rcard-v2-footer">
            <div class="rcard-v2-upd">
                <div class="rcard-v2-upd-dot ${cfg.dotClass}"></div>
                ${formattedDate}
            </div>
            <a class="rcard-v2-detail-btn ${cfg.btnClass} detail-btn"
               data-id="${reactor.id}"
               href="javascript:void(0);">
                ${cfg.btnText}
            </a>
        </footer>

    </article>`;
}


// =====================================================================
// FILTRE
// =====================================================================

function setupFilters() {
    const filterTabs  = document.querySelectorAll('.filter-tab');
    const searchInput = document.querySelector('.search-input');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active-tab'));
            e.currentTarget.classList.add('active-tab');
            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
}

function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\([0-9]+\)/g, "")
        .trim();
}

function applyFilters() {
    const activeTab   = document.querySelector('.filter-tab.active-tab');
    const searchInput = document.querySelector('.search-input');

    const rawFilterText = activeTab ? activeTab.textContent : 'toate';
    const statusFilter  = normalizeString(rawFilterText);
    const searchQuery   = normalizeString(searchInput ? searchInput.value : '');

    let filteredList = allReactors;

    if (statusFilter !== 'toate') {
        filteredList = filteredList.filter(reactor => {
            const currentStatus = normalizeString(reactor.status);
            return currentStatus.includes(statusFilter) || statusFilter.includes(currentStatus);
        });
    }

    if (searchQuery !== '') {
        filteredList = filteredList.filter(reactor => {
            const name     = normalizeString(reactor.name);
            const location = normalizeString(reactor.location_name);
            const id       = reactor.id ? reactor.id.toString() : '';
            return name.includes(searchQuery) || location.includes(searchQuery) || id.includes(searchQuery);
        });
    }

    renderReactors(filteredList);
}


// =====================================================================
// NAVIGARE DETALII
// =====================================================================

function attachDetailLinks() {
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reactorId = e.currentTarget.getAttribute('data-id');
            window.location.href = `reactor.html?id=${reactorId}`;
        });
    });
}