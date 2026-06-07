document.addEventListener('DOMContentLoaded', () => {
    const state = {
        days: 30,
        reactors: [],
        kpi: null,
        comparison: [],
        trend: [],
        riskMatrix: [],
        wear: []
    };

    const refs = {
        timeRange: document.getElementById('stats-time-range'),
        kpiGrid: document.getElementById('stats-kpi-grid'),
        efficiencyBars: document.getElementById('efficiency-bars'),
        trendTitle: document.getElementById('trend-title'),
        trendSubtitle: document.getElementById('trend-subtitle'),
        trendSvg: document.getElementById('trend-svg'),
        trendAxisLabels: document.getElementById('trend-axis-labels'),
        comparisonBody: document.getElementById('comparison-table-body'),
        riskMatrixWrap: document.getElementById('risk-matrix-wrap'),
        environmentGrid: document.getElementById('environment-grid'),
        wearList: document.getElementById('wear-list'),
        logoutBtn: document.getElementById('btn-logout')
    };
        const pageSubtitle = document.getElementById('stats-page-subtitle');
        const efficiencyBarsSubtitle = document.getElementById('efficiency-bars-subtitle');
        const comparisonSubtitle = document.getElementById('comparison-subtitle');
        const riskSubtitle = document.getElementById('risk-subtitle');
        const environmentSubtitle = document.getElementById('environment-subtitle');
        const wearSubtitle = document.getElementById('wear-subtitle');

    /**
     * Local helpers and resilient API wrappers.
     * These ensure the stats page still works if `window.NuclearAPI` isn't loaded
     * (older cached scripts or load-order issues) by falling back to `authFetch`.
     */
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function callApiFallback(path) {
        if (typeof window.authFetch !== 'function') {
            throw new Error('Funcția authFetch nu este disponibilă în fereastră.');
        }
        const resp = await window.authFetch(path, { method: 'GET' });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => null);
            throw new Error(txt || `HTTP ${resp.status}`);
        }
        return await resp.json();
    }

    const ReportsAPI = {
        async getReactors() {
            if (window.NuclearAPI && typeof window.NuclearAPI.getReactors === 'function') {
                return await window.NuclearAPI.getReactors();
            }
            return await callApiFallback('/reactors');
        },
        async getKpi() {
            if (window.NuclearAPI && typeof window.NuclearAPI.getKpi === 'function') {
                return await window.NuclearAPI.getKpi();
            }
            return await callApiFallback('/reports/kpi');
        },
        async getComparison() {
            if (window.NuclearAPI && typeof window.NuclearAPI.getComparison === 'function') {
                return await window.NuclearAPI.getComparison();
            }
            return await callApiFallback('/reports/comparison');
        },
        async getEfficiencyTrend(days) {
            if (window.NuclearAPI && typeof window.NuclearAPI.getEfficiencyTrend === 'function') {
                return await window.NuclearAPI.getEfficiencyTrend(days);
            }
            return await callApiFallback(`/reports/efficiency/trend?days=${encodeURIComponent(days)}`);
        },
        async getRiskMatrix() {
            if (window.NuclearAPI && typeof window.NuclearAPI.getRiskMatrix === 'function') {
                return await window.NuclearAPI.getRiskMatrix();
            }
            return await callApiFallback('/reports/risk-matrix');
        },
        async getWear() {
            if (window.NuclearAPI && typeof window.NuclearAPI.getWear === 'function') {
                return await window.NuclearAPI.getWear();
            }
            return await callApiFallback('/reports/wear');
        }
    };

    init();

    function init() {
        bindTimeRange();
        bindLogout();
        loadDashboard();
    }

    function bindTimeRange() {
        if (!refs.timeRange) {
            return;
        }

        refs.timeRange.querySelectorAll('.tr').forEach((button) => {
            button.addEventListener('click', () => {
                const nextDays = Number(button.dataset.days || 30);
                state.days = Number.isFinite(nextDays) ? nextDays : 30;
                refs.timeRange.querySelectorAll('.tr').forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                loadDashboard();
            });
        });
    }

    function bindLogout() {
        if (!refs.logoutBtn) {
            return;
        }

        refs.logoutBtn.addEventListener('click', async () => {
            try {
                if (typeof window.authFetch === 'function') {
                    await window.authFetch('/auth/logout', { method: 'POST' });
                }
            } catch (error) {
                console.warn('Logout request failed:', error);
            } finally {
                window.location.href = 'login.html';
            }
        });
    }

    async function loadDashboard() {
        setLoadingState();

        try {
            const [reactorsResult, kpiResult, comparisonResult, trendResult, riskMatrixResult, wearResult] = await Promise.allSettled([
                ReportsAPI.getReactors(),
                ReportsAPI.getKpi(),
                ReportsAPI.getComparison(),
                ReportsAPI.getEfficiencyTrend(state.days),
                ReportsAPI.getRiskMatrix(),
                ReportsAPI.getWear()
            ]);

            state.reactors = unwrapSettled(reactorsResult, []);
            state.kpi = unwrapSettled(kpiResult, null);
            state.comparison = unwrapSettled(comparisonResult, []);
            state.trend = unwrapSettled(trendResult, []);
            state.riskMatrix = unwrapSettled(riskMatrixResult, []);
            state.wear = unwrapSettled(wearResult, []);

            renderAll();
        } catch (error) {
            console.error('Eroare la încărcarea statisticilor:', error);
            renderFallback(error);
        }
    }

    function unwrapSettled(result, fallback) {
        if (!result || result.status !== 'fulfilled') {
            return fallback;
        }

        return result.value ?? fallback;
    }

    function setLoadingState() {
        if (refs.kpiGrid) {
            refs.kpiGrid.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-label">Eficiență medie</div>
                    <div class="kpi-val text-green" id="kpi-efficiency-value">Se încarcă...</div>
                    <div class="kpi-desc trend-up" id="kpi-efficiency-desc">Preluare date live</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Energie produsă</div>
                    <div class="kpi-val text-purple" id="kpi-energy-value">Se încarcă...</div>
                    <div class="kpi-desc trend-up" id="kpi-energy-desc">Preluare date live</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Indice de risc</div>
                    <div class="kpi-val text-amber" id="kpi-risk-value">Se încarcă...</div>
                    <div class="kpi-desc trend-down" id="kpi-risk-desc">Preluare date live</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Disponibilitate</div>
                    <div class="kpi-val text-green" id="kpi-availability-value">Se încarcă...</div>
                    <div class="kpi-desc trend-neutral" id="kpi-availability-desc">Preluare date live</div>
                </div>
            `;
        }

        if (refs.efficiencyBars) {
            refs.efficiencyBars.innerHTML = '<div class="bc-col" style="grid-column:1/-1; text-align:center; color: var(--text-3); padding-top: 24px;">Se încarcă datele din sistem...</div>';
        }

        if (refs.trendSvg) {
            refs.trendSvg.innerHTML = '';
        }

        if (refs.trendAxisLabels) {
            refs.trendAxisLabels.innerHTML = '';
        }

        if (refs.comparisonBody) {
            refs.comparisonBody.innerHTML = '<tr><td colspan="6" style="padding:16px; color: var(--text-3);">Se încarcă datele din sistem...</td></tr>';
        }

        if (refs.riskMatrixWrap) {
            refs.riskMatrixWrap.innerHTML = '<div style="padding:14px; color: var(--text-3);">Se încarcă matricea de risc...</div>';
        }

        if (refs.environmentGrid) {
            refs.environmentGrid.innerHTML = '<div style="grid-column:1/-1; padding:14px; color: var(--text-3);">Se încarcă condițiile operaționale...</div>';
        }

        if (refs.wearList) {
            refs.wearList.innerHTML = '<div style="padding:14px; color: var(--text-3);">Se încarcă uzura reactoarelor...</div>';
        }
    }

    function renderFallback(error) {
        const message = error && error.message ? error.message : 'Nu s-au putut încărca statisticile.';
        if (refs.kpiGrid) {
            refs.kpiGrid.innerHTML = `<div class="kpi-card" style="grid-column:1/-1;"><div class="kpi-label">Eroare</div><div class="kpi-val text-red">Date indisponibile</div><div class="kpi-desc">${escapeHtml(message)}</div></div>`;
        }

        if (refs.comparisonBody) {
            refs.comparisonBody.innerHTML = `<tr><td colspan="6" style="padding:16px; color: var(--red);">${escapeHtml(message)}</td></tr>`;
        }

        if (refs.efficiencyBars) {
            refs.efficiencyBars.innerHTML = `<div class="bc-col" style="grid-column:1/-1; text-align:center; color: var(--red); padding-top: 24px;">${escapeHtml(message)}</div>`;
        }

        if (refs.riskMatrixWrap) {
            refs.riskMatrixWrap.innerHTML = `<div style="padding:14px; color: var(--red);">${escapeHtml(message)}</div>`;
        }

        if (refs.environmentGrid) {
            refs.environmentGrid.innerHTML = `<div style="grid-column:1/-1; padding:14px; color: var(--red);">${escapeHtml(message)}</div>`;
        }

        if (refs.wearList) {
            refs.wearList.innerHTML = `<div style="padding:14px; color: var(--red);">${escapeHtml(message)}</div>`;
        }
    }

    function renderAll() {
        renderKpis();
        renderEfficiencyBars();
        renderTrend();
        renderComparison();
        renderRiskMatrix();
        renderEnvironment();
        renderWear();
    }

    function renderKpis() {
        const comparison = Array.isArray(state.comparison) ? state.comparison : [];
        const reactors = Array.isArray(state.reactors) ? state.reactors : [];
        const totalReactors = comparison.length || reactors.length;
        const activeReactors = comparison.filter((reactor) => normalizeStatus(reactor.status) === 'activ').length;
        const activeComparison = comparison.filter((reactor) => normalizeStatus(reactor.status) === 'activ');

        const averageEfficiency = Number(state.kpi?.avg_efficiency ?? safeAverage(comparison.map((reactor) => reactor.efficiency)));
        const averageRiskRaw = Number(state.kpi?.avg_risk ?? safeAverage(comparison.map((reactor) => reactor.risk)));
        const averageRisk = averageRiskRaw > 10 ? averageRiskRaw / 10 : averageRiskRaw;
        const availability = totalReactors > 0 ? (activeReactors / totalReactors) * 100 : 0;

        const activeInstalledPower = activeComparison.reduce((sum, reactor) => sum + toNumber(reactor.installed_power), 0);
        const energyTWh = (activeInstalledPower * (averageEfficiency / 100) * (state.days * 24)) / 1000000;

        setText('kpi-efficiency-value', `${formatPercent(averageEfficiency, 1)}%`);
        setText('kpi-efficiency-desc', `${activeReactors} reactoare active în calcul`);

        setText('kpi-energy-value', `${formatNumber(energyTWh, 2)} TWh`);
        setText('kpi-energy-desc', `Estimare pentru ${formatDays(state.days)} din reactoarele active`);

        setText('kpi-risk-value', `${formatPercent(averageRisk, 1)} / 10`);
        setText('kpi-risk-desc', `Media riscului seismic din rețea`);

        setText('kpi-availability-value', `${formatPercent(availability, 1)}%`);
        setText('kpi-availability-desc', `${activeReactors} / ${totalReactors} reactoare active`);

            setText('trend-title', `Trend eficiență medie — ${formatDays(state.days)}`);
            setText('trend-subtitle', `Centrala în ansamblu · ${formatDays(state.days)}`);
            setText('efficiency-bars-subtitle', `${formatDays(state.days)} · comparativ cu ținta de 90%`);
            setText('comparison-subtitle', `Principali indicatori de performanță · ${formatDays(state.days)}`);
            setText('risk-subtitle', `Probabilitate × Impact · ${formatDays(state.days)}`);
            setText('environment-subtitle', `Date live din senzori · ${formatDays(state.days)}`);
            setText('wear-subtitle', `Estimare bazată pe ore funcționare și mentenanță · ${formatDays(state.days)}`);
            setText('stats-page-subtitle', `Performanță, eficiență, risc și uzură · ${formatDays(state.days)}`);
    }

    function renderEfficiencyBars() {
        if (!refs.efficiencyBars) {
            return;
        }

        const reactors = [...(state.comparison || [])]
            .sort((left, right) => toNumber(right.efficiency) - toNumber(left.efficiency));

        if (!reactors.length) {
            refs.efficiencyBars.innerHTML = '<div class="bc-col" style="grid-column:1/-1; text-align:center; color: var(--text-3); padding-top: 24px;">Nu există date pentru reactoare.</div>';
            return;
        }

        refs.efficiencyBars.innerHTML = reactors.map((reactor) => {
            const efficiency = clamp(toNumber(reactor.efficiency), 0, 100);
            const status = normalizeStatus(reactor.status);
            const style = getStatusStyle(status, efficiency);
            const height = Math.max(4, Math.round(efficiency));
            const label = formatReactorShortLabel(reactor.name, reactor.reactor_id);

            return `
                <div class="bc-col">
                    <div class="bc-val ${style.textClass}">${formatPercent(efficiency, 0)}%</div>
                    <div class="bc-bar ${style.barClass}" style="height:${height}px;"></div>
                    <div class="bc-lbl">${escapeHtml(label)}</div>
                </div>
            `;
        }).join('');
    }

    function renderTrend() {
        if (!refs.trendSvg || !refs.trendAxisLabels) {
            return;
        }

        const series = Array.isArray(state.trend) ? state.trend : [];
        if (!series.length) {
            refs.trendSvg.innerHTML = '<text x="24" y="45" class="y-label">Nu există date pentru trend.</text>';
            refs.trendAxisLabels.innerHTML = '';
            return;
        }

        const values = series.map((item) => toNumber(item.avg_efficiency));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = Math.max(max - min, 1);
        const xStart = 30;
        const xEnd = 455;
        const yTop = 18;
        const yBottom = 72;
        const width = xEnd - xStart;

        const points = values.map((value, index) => {
            const x = series.length === 1 ? xStart : xStart + (width * index) / (series.length - 1);
            const normalized = (value - min) / range;
            const y = yBottom - normalized * (yBottom - yTop);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const fillPoints = `${points} 455,90 30,90`;
        const yMax = Math.ceil(max / 5) * 5;
        const yMid = Math.round(((min + max) / 2) / 5) * 5;
        const yMin = Math.floor(min / 5) * 5;

        const gradientId = 'eff-grad-live';
        refs.trendSvg.innerHTML = `
            <line x1="0" y1="18" x2="460" y2="18" class="grid-line"></line>
            <line x1="0" y1="45" x2="460" y2="45" class="grid-line"></line>
            <line x1="0" y1="72" x2="460" y2="72" class="grid-line"></line>
            <text x="0" y="16" class="y-label">${formatPercent(yMax, 0)}%</text>
            <text x="0" y="43" class="y-label">${formatPercent(yMid, 0)}%</text>
            <text x="0" y="70" class="y-label">${formatPercent(yMin, 0)}%</text>
            <polyline points="${points}" class="trend-line"></polyline>
            <polygon points="${fillPoints}" fill="url(#${gradientId})" opacity="0.3"></polygon>
            <defs>
                <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0E9F6E"></stop>
                    <stop offset="100%" stop-color="#0E9F6E" stop-opacity="0"></stop>
                </linearGradient>
            </defs>
        `;

        const axisIndexes = buildAxisIndexes(series.length);
        refs.trendAxisLabels.innerHTML = axisIndexes
            .map((index) => `<span>${escapeHtml(formatTrendLabel(series[index].date))}</span>`)
            .join('');
    }

    function renderComparison() {
        if (!refs.comparisonBody) {
            return;
        }

        const comparison = [...(state.comparison || [])];
        if (!comparison.length) {
            refs.comparisonBody.innerHTML = '<tr><td colspan="6" style="padding:16px; color: var(--text-3);">Nu există date comparative.</td></tr>';
            return;
        }

        const wearMap = new Map((state.wear || []).map((item) => [String(item.reactor_id), item]));
        const averageEfficiency = safeAverage(comparison.map((reactor) => toNumber(reactor.efficiency)));

        refs.comparisonBody.innerHTML = comparison
            .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'ro'))
            .map((reactor) => {
                const efficiency = clamp(toNumber(reactor.efficiency), 0, 100);
                const risk = toNumber(reactor.risk);
                const wear = wearMap.get(String(reactor.reactor_id))?.wear_percent ?? Math.max(0, 100 - efficiency);
                const status = normalizeStatus(reactor.status);
                const rowConfig = getRowConfig(status);
                const trendDelta = efficiency - averageEfficiency;
                const trendText = trendDelta > 0.5 ? `↑ +${formatPercent(trendDelta, 1)}%` : trendDelta < -0.5 ? `↓ ${formatPercent(Math.abs(trendDelta), 1)}%` : '→';
                const availabilityScore = status === 'activ'
                    ? efficiency
                    : status === 'mentenanta'
                        ? Math.min(100, efficiency * 0.6)
                        : status === 'constructie'
                            ? 0
                            : status === 'alerta'
                                ? Math.min(100, efficiency * 0.4)
                                : 0;

                return `
                    <tr class="${rowConfig.rowClass}">
                        <td class="fw-500 ${rowConfig.textClass}">${escapeHtml(reactor.name)}</td>
                        <td><span class="${rowConfig.textClass}">${formatPercent(efficiency, 0)}%</span></td>
                        <td>${formatPercent(availabilityScore, 1)}%</td>
                        <td><span class="${risk > 5 ? 'text-red' : risk > 2 ? 'text-amber' : 'text-green'}">${formatNumber(risk, 1)}</span></td>
                        <td>${formatPercent(wear, 0)}%</td>
                        <td class="${trendDelta > 0.5 ? 'trend-up' : trendDelta < -0.5 ? 'trend-down' : 'trend-neutral'}">${escapeHtml(trendText)}</td>
                    </tr>
                `;
            }).join('');
    }

    function renderRiskMatrix() {
        if (!refs.riskMatrixWrap) {
            return;
        }

        const rows = [
            { key: 'Cert', label: 'Cert' },
            { key: 'Probabil', label: 'Probabil' },
            { key: 'Posibil', label: 'Posibil' },
            { key: 'Putin probabil', label: 'Puțin prob.' },
            { key: 'Rar', label: 'Rar' }
        ];
        const columns = [
            { key: 'Neglijabil', label: 'Neg.' },
            { key: 'Minor', label: 'Minor' },
            { key: 'Moderat', label: 'Moderat' },
            { key: 'Major', label: 'Major' },
            { key: 'Critic', label: 'Critic' }
        ];

        const matrix = new Map();
        rows.forEach((row) => {
            matrix.set(normalizeText(row.key), new Map());
            columns.forEach((column) => matrix.get(normalizeText(row.key)).set(normalizeText(column.key), []));
        });

        (state.riskMatrix || []).forEach((item) => {
            const rowKey = normalizeText(item.probability);
            const columnKey = normalizeText(item.impact);
            if (matrix.has(rowKey) && matrix.get(rowKey).has(columnKey)) {
                matrix.get(rowKey).get(columnKey).push(item.name);
            }
        });

        const headerHtml = `
            <div class="matrix-header-row">
                <div class="matrix-y-axis-lbl">Impact ↑</div>
                <div class="matrix-headers">
                    ${columns.map((column) => `<div class="rm-hdr">${escapeHtml(column.label)}</div>`).join('')}
                </div>
            </div>
        `;

        const bodyHtml = rows.map((row) => {
            const cells = columns.map((column) => {
                const names = matrix.get(normalizeText(row.key)).get(normalizeText(column.key)) || [];
                const cellClass = getRiskCellClass(column.key);
                return `<div class="rm-cell ${cellClass}">${names.length ? names.map(escapeHtml).join('<br>') : '—'}</div>`;
            }).join('');

            return `<div class="matrix-row"><div class="matrix-row-lbl">${escapeHtml(row.label)}</div>${cells}</div>`;
        }).join('');

        refs.riskMatrixWrap.innerHTML = `
            ${headerHtml}
            <div class="matrix-body">${bodyHtml}</div>
            <div class="matrix-x-axis-lbl">← Probabilitate →</div>
        `;
    }

    function renderEnvironment() {
        if (!refs.environmentGrid) {
            return;
        }

        const reactors = Array.isArray(state.reactors) ? state.reactors : [];
        if (!reactors.length) {
            refs.environmentGrid.innerHTML = '<div class="met-box" style="grid-column:1/-1;">Nu există date pentru condițiile operaționale.</div>';
            return;
        }

        const averages = {
            soil: safeAverage(reactors.map((reactor) => toNumber(reactor.soil_stability))),
            seismic: safeAverage(reactors.map((reactor) => toNumber(reactor.seismic_risk))),
            elevation: safeAverage(reactors.map((reactor) => toNumber(reactor.elevation_meters))),
            distance: safeAverage(reactors.map((reactor) => toNumber(reactor.distance_to_nearest_city_km)))
        };
        // Normalizăm riscul seismic la scara 0-10 pentru afișare: dacă valorile vin pe 0-100
        // le convertim împărțind la 10.
        const seismic10 = averages.seismic > 10 ? averages.seismic / 10 : averages.seismic;
        const seismicImpactScore = 100 - (seismic10 * 10); // 100 = sigur, 0 = critic

        refs.environmentGrid.innerHTML = `
            <div class="met-box">
                <div class="met-icon">🪨</div>
                <div class="met-v">${formatPercent(averages.soil, 1)}%</div>
                <div class="met-l">Stabilitate sol</div>
                <div class="met-impact ${averages.soil >= 70 ? 'mi-ok' : averages.soil >= 40 ? 'mi-warn' : 'mi-bad'}">${operationalBadge(averages.soil, 70, 40)}</div>
            </div>
            <div class="met-box">
                <div class="met-icon">🌋</div>
                <div class="met-v">${formatNumber(seismic10, 1)} / 10</div>
                <div class="met-l">Risc seismic</div>
                <div class="met-impact ${seismicImpactScore >= 70 ? 'mi-ok' : seismicImpactScore >= 40 ? 'mi-warn' : 'mi-bad'}">${operationalBadge(seismicImpactScore, 70, 40)}</div>
            </div>
            <div class="met-box">
                <div class="met-icon">🏔️</div>
                <div class="met-v">${formatNumber(averages.elevation, 0)} m</div>
                <div class="met-l">Altitudine medie</div>
                <div class="met-impact mi-ok">Date live</div>
            </div>
            <div class="met-box">
                <div class="met-icon">📍</div>
                <div class="met-v">${formatNumber(averages.distance, 1)} km</div>
                <div class="met-l">Distanță medie oraș</div>
                <div class="met-impact ${averages.distance >= 30 ? 'mi-ok' : averages.distance >= 10 ? 'mi-warn' : 'mi-bad'}">${averages.distance >= 30 ? 'Optim' : averages.distance >= 10 ? 'Atenție' : 'Critic'}</div>
            </div>
        `;
    }

    function renderWear() {
        if (!refs.wearList) {
            return;
        }

        const wear = [...(state.wear || [])].sort((left, right) => toNumber(right.wear_percent) - toNumber(left.wear_percent));
        if (!wear.length) {
            refs.wearList.innerHTML = '<div style="padding:14px; color: var(--text-3);">Nu există date pentru uzură.</div>';
            return;
        }

        const rows = wear.map((item) => {
            const wearPercent = clamp(toNumber(item.wear_percent), 0, 100);
            const status = normalizeStatus(item.status);
            const tone = wearTone(wearPercent);
            const label = formatReactorShortLabel(item.name, item.reactor_id);
            return `
                <div class="wear-item">
                    <span class="wear-lbl">${escapeHtml(label)}</span>
                    <div class="wear-bar-bg"><div class="wear-bar-f ${tone.barClass}" style="width:${wearPercent}%"></div></div>
                    <span class="wear-val ${tone.textClass}">${formatPercent(wearPercent, 0)}%</span>
                </div>
            `;
        }).join('');

        refs.wearList.innerHTML = `${rows}
            <footer class="wear-legend">
                <span class="wl-item"><span class="wl-dot bg-green"></span>0–30% Bună</span>
                <span class="wl-item"><span class="wl-dot bg-amber"></span>30–40% Medie</span>
                <span class="wl-item"><span class="wl-dot bg-red"></span>&gt;40% Critică</span>
            </footer>
        `;
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    function formatNumber(value, digits = 1) {
        return new Intl.NumberFormat('ro-RO', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }).format(toNumber(value));
    }

    function formatPercent(value, digits = 1) {
        return new Intl.NumberFormat('ro-RO', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }).format(toNumber(value));
    }

    function formatDays(days) {
        if (days === 1) return '24h';
        if (days === 7) return '7 zile';
        if (days === 30) return '30 zile';
        if (days === 90) return '90 zile';
        if (days === 365) return '1 an';
        return `${days} zile`;
    }

    function formatTrendLabel(value) {
        if (!value) {
            return '—';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
    }

    function buildAxisIndexes(length) {
        if (length <= 1) {
            return [0, 0, 0, 0, 0];
        }

        const indexes = [0, Math.floor((length - 1) * 0.25), Math.floor((length - 1) * 0.5), Math.floor((length - 1) * 0.75), length - 1];
        return [...new Set(indexes)];
    }

    function safeAverage(values) {
        const filtered = values.map((value) => toNumber(value)).filter((value) => Number.isFinite(value));
        if (!filtered.length) {
            return 0;
        }
        return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
    }

    function toNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function normalizeStatus(value) {
        const normalized = normalizeText(value);
        if (normalized.includes('activ')) return 'activ';
        if (normalized.includes('mentenan')) return 'mentenanta';
        if (normalized.includes('in construct')) return 'constructie';
        if (normalized.includes('alert')) return 'alerta';
        if (normalized.includes('oprit') || normalized.includes('stop')) return 'oprit';
        return normalized || 'other';
    }

    function getStatusStyle(status, efficiency) {
        if (status === 'alerta') return { textClass: 'text-red', barClass: 'bg-red' };
        if (status === 'mentenanta') return { textClass: 'text-amber', barClass: 'bg-amber' };
        if (status === 'oprit') return { textClass: 'text-muted', barClass: 'bg-gray' };
        if (efficiency >= 85) return { textClass: 'text-green', barClass: 'bg-green' };
        if (efficiency >= 70) return { textClass: 'text-amber', barClass: 'bg-amber' };
        return { textClass: 'text-red', barClass: 'bg-red' };
    }

    function getRowConfig(status) {
        if (status === 'alerta') {
            return { rowClass: 'row-critical', textClass: 'text-red' };
        }
        if (status === 'mentenanta') {
            return { rowClass: 'row-maint', textClass: 'text-amber' };
        }
        if (status === 'oprit') {
            return { rowClass: 'row-off', textClass: 'text-muted' };
        }
        return { rowClass: '', textClass: 'text-green' };
    }

    function getRiskCellClass(label) {
        const normalized = normalizeText(label);
        if (normalized === 'critic' || normalized === 'major') {
            return 'rm-hi';
        }
        if (normalized === 'moderat') {
            return 'rm-md';
        }
        return 'rm-lo';
    }

    function wearTone(value) {
        if (value > 40) return { barClass: 'bg-red', textClass: 'text-red' };
        if (value >= 30) return { barClass: 'bg-amber', textClass: 'text-amber' };
        return { barClass: 'bg-green', textClass: 'text-green' };
    }

    function operationalBadge(score, okThreshold, warnThreshold) {
        if (score >= okThreshold) return 'Impact: minim';
        if (score >= warnThreshold) return 'Atenție';
        return 'Critic';
    }

    function formatReactorShortLabel(name, reactorId) {
        if (name) {
            return String(name).trim();
        }
        return reactorId ? `Reactor ${reactorId}` : 'Reactor';
    }
});
