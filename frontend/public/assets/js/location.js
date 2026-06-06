(() => {
    const apiBase = typeof API_URL !== 'undefined' && API_URL ? API_URL : `${window.location.origin}/api`;
    const pollingIntervalMs = 5000;

    const state = {
        reactors: [],
        sensors: [],
        pollingId: null,
        map: null,
        pickerMap: null,
        pickerMarker: null,
        activeSensorReactorId: null,
        editingSensorId: null,
        sensorTypeProfiles: {},
        sensorTypesLoaded: false,
        sensorTypesLoading: null
    };

    const refs = {
        reactorList: document.getElementById('reactor-list'),
        lastRefresh: document.getElementById('last-refresh-pill'),
        openAddButton: document.getElementById('open-add-reactor'),
        reactorModal: document.getElementById('reactor-modal'),
        closeReactorModalBtn: document.getElementById('close-reactor-modal'),
        cancelReactorModalBtn: document.getElementById('cancel-reactor-modal'),
        form: document.getElementById('reactor-form'),
        formError: document.getElementById('reactor-form-error'),
        submitButton: document.getElementById('submit-reactor-btn'),
        openPickerButton: document.getElementById('open-picker'),
        pickerModal: document.getElementById('picker-modal'),
        closePickerModalBtn: document.getElementById('close-picker-modal'),
        totalPowerValue: document.getElementById('stat-total-power'),
        totalReactorsValue: document.getElementById('stat-total-reactors'),
        typeTotalValue: document.getElementById('stat-type-total'),
        statusTotalValue: document.getElementById('stat-status-total'),
        typeList: document.getElementById('stats-type-list'),
        statusList: document.getElementById('stats-status-list'),
        latitudeInput: document.getElementById('latitude'),
        longitudeInput: document.getElementById('longitude'),
        nameInput: document.getElementById('name'),
        locationNameInput: document.getElementById('location_name'),
        reactorTypeInput: document.getElementById('reactor_type'),
        installedPowerInput: document.getElementById('installed_power'),
        webhookUrlInput: document.getElementById('webhook_url'), // <-- Adăugat aici
        toast: document.getElementById('toast-success'),
        mapContainer: document.getElementById('reactors-map'),
        sensorModal: document.getElementById('sensor-modal'),
        sensorModalSubtitle: document.getElementById('sensor-modal-subtitle'),
        closeSensorModalBtn: document.getElementById('close-sensor-modal'),
        sensorError: document.getElementById('sensor-form-error'),
        sensorCountPill: document.getElementById('sensor-count-pill'),
        sensorListBody: document.getElementById('sensor-list-body'),
        sensorForm: document.getElementById('sensor-form'),
        sensorTypeInput: document.getElementById('sensor_type'),
        sensorUnitInput: document.getElementById('sensor_unit'),
        sensorMinInput: document.getElementById('min_safe_value'),
        sensorMaxInput: document.getElementById('max_safe_value'),
        submitSensorButton: document.getElementById('submit-sensor-btn')
    };

    function init() {
        if (!window.L) {
            console.error('Leaflet nu este încărcat.');
            return;
        }

        initMainMap();
        bindEvents();
        window.requestAnimationFrame(() => {
            if (state.map && typeof state.map.invalidateSize === 'function') {
                state.map.invalidateSize();
            }
        });
        window.addEventListener('resize', () => {
            if (state.map && typeof state.map.invalidateSize === 'function') {
                state.map.invalidateSize();
            }
        });
        refreshReactors();
        startPolling();
    }

    function initMainMap() {
        if (!refs.mapContainer) {
            console.warn('Containerul pentru hartă lipsește din DOM.');
            return;
        }

        state.map = L.map('reactors-map', {
            zoomControl: true,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0,
            minZoom: 2
        }).setView([46.2, 20.2], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            noWrap: true,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(state.map);

        window.addEventListener('load', () => {
            if (state.map && typeof state.map.invalidateSize === 'function') {
                state.map.invalidateSize(true);
                state.map.setView([46.2, 20.2], 4);
            }
        }, { once: true });

        setTimeout(() => {
            if (state.map) {
                state.map.invalidateSize(true);
                state.map.setView([46.2, 20.2], 4);
            }
        }, 500);

        state.map.whenReady(() => {
            if (typeof state.map.invalidateSize === 'function') {
                state.map.invalidateSize(true);
                state.map.setView([46.2, 20.2], 4);
            }
        });
    }

    function getHeaders() {
        if (typeof getAuthHeaders === 'function') {
            const headers = getAuthHeaders();
            if (headers && headers.Authorization === '') {
                delete headers.Authorization;
            }
            return headers;
        }

        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('access_token');
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    function normalizeStatus(status) {
        return (status || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function statusVisual(status) {
        const normalized = normalizeStatus(status);

        if (normalized === 'oprit') {
            return { color: '#6b7280', badgeClass: 'badge-gray' };
        }

        if (normalized === 'activ') {
            return { color: '#16a34a', badgeClass: 'badge-green' };
        }

        if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') {
            return { color: '#f59e0b', badgeClass: 'badge-yellow' };
        }

        if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') {
            return { color: '#dc2626', badgeClass: 'badge-red' };
        }

        return { color: '#2563eb', badgeClass: 'badge-blue' };
    }

    function statusCircleClass(status) {
        const normalized = normalizeStatus(status);

        if (normalized === 'oprit') {
            return 'reactor-circle reactor-circle-gray';
        }

        if (normalized === 'activ') {
            return 'reactor-circle reactor-circle-green';
        }

        if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') {
            return 'reactor-circle reactor-circle-yellow';
        }

        if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') {
            return 'reactor-circle reactor-circle-red reactor-circle-pulse';
        }

        return 'reactor-circle reactor-circle-blue';
    }

    function getMarkerRadius(reactor) {
        const power = safeNumber(reactor.installed_power, 0);
        const normalized = normalizeStatus(reactor.status);

        let radius = 7;

        if (power > 0) {
            radius += Math.min(5, Math.max(0, power / 220));
        }

        if (normalized === 'activ') {
            radius += 0.5;
        } else if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') {
            radius += 1;
        } else if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') {
            radius += 2.2;
        } else if (normalized === 'oprit') {
            radius -= 0.5;
        }

        return Math.max(6, Math.min(14, radius));
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeNumber(value, fallback = 0) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : fallback;
    }

    function normalizeReactorType(type) {
        return String(type || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim();
    }

    function formatPower(value) {
        return `${new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(safeNumber(value))} MW`;
    }

    function createEmptyStats() {
        return {
            totalPower: 0,
            totalReactors: 0,
            typeCounts: { CANDU: 0, SMR: 0, PWR: 0, OTHER: 0 },
            statusCounts: {
                activ: 0,
                mentenanta: 0,
                constructie: 0,
                oprit: 0,
                alerta: 0,
                other: 0
            }
        };
    }

    function getStatusBucket(status) {
        if (status === 'activ') return 'activ';
        if (status === 'mentenanta' || status === 'mentenanta planificata') return 'mentenanta';
        if (status === 'in constructie' || status === 'constructie') return 'constructie';
        if (status === 'oprit') return 'oprit';
        if (status === 'alerta' || status === 'stare critica' || status === 'critica' || status === 'critic') return 'alerta';
        return 'other';
    }

    function getStatusLabel(statusKey) {
        return ({
            activ: 'Activ',
            mentenanta: 'Mentenanță',
            constructie: 'În construcție',
            oprit: 'Oprit',
            alerta: 'Alertă / critic',
            other: 'Alt status'
        })[statusKey] || 'Alt status';
    }

    function getTypeLabel(typeKey) {
        return ({
            CANDU: 'CANDU',
            SMR: 'SMR',
            PWR: 'PWR',
            OTHER: 'Alt tip'
        })[typeKey] || 'Alt tip';
    }

    function calculateReactorStats(reactors) {
        const stats = createEmptyStats();

        reactors.forEach((reactor) => {
            stats.totalReactors += 1;
            stats.totalPower += safeNumber(reactor.installed_power, 0);

            const typeKey = normalizeReactorType(reactor.reactor_type);
            if (Object.prototype.hasOwnProperty.call(stats.typeCounts, typeKey)) {
                stats.typeCounts[typeKey] += 1;
            } else {
                stats.typeCounts.OTHER += 1;
            }

            const statusKey = getStatusBucket(normalizeStatus(reactor.status));
            stats.statusCounts[statusKey] += 1;
        });

        return stats;
    }

    function renderStatsList(target, entries, total) {
        if (!target) {
            return;
        }

        if (!entries.length) {
            target.innerHTML = '<div class="sensor-empty">Nu există date pentru această categorie.</div>';
            return;
        }

        target.innerHTML = entries.map((entry) => {
            const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return `
                <div class="stats-row">
                    <div class="stats-row-head">
                        <strong>${escapeHtml(entry.label)}</strong>
                        <span>${entry.value} · ${percentage}%</span>
                    </div>
                    <div class="stats-track" aria-hidden="true">
                        <div class="stats-fill ${escapeHtml(entry.fillClass)}" style="width:${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderReactorStats(stats) {
        const safeStats = stats || createEmptyStats();
        const typeTotal = Object.values(safeStats.typeCounts).reduce((sum, value) => sum + value, 0);
        const statusTotal = Object.values(safeStats.statusCounts).reduce((sum, value) => sum + value, 0);

        if (refs.totalPowerValue) {
            refs.totalPowerValue.textContent = formatPower(safeStats.totalPower);
        }

        if (refs.totalReactorsValue) {
            refs.totalReactorsValue.textContent = String(safeStats.totalReactors);
        }

        if (refs.typeTotalValue) {
            refs.typeTotalValue.textContent = `${typeTotal}/${safeStats.totalReactors}`;
        }

        if (refs.statusTotalValue) {
            refs.statusTotalValue.textContent = `${statusTotal}/${safeStats.totalReactors}`;
        }

        renderStatsList(refs.typeList, [
            { label: getTypeLabel('CANDU'), value: safeStats.typeCounts.CANDU, fillClass: 'type-candu' },
            { label: getTypeLabel('SMR'), value: safeStats.typeCounts.SMR, fillClass: 'type-smr' },
            { label: getTypeLabel('PWR'), value: safeStats.typeCounts.PWR, fillClass: 'type-pwr' },
            { label: getTypeLabel('OTHER'), value: safeStats.typeCounts.OTHER, fillClass: 'type-other' }
        ], Math.max(safeStats.totalReactors, 1));

        renderStatsList(refs.statusList, [
            { label: getStatusLabel('activ'), value: safeStats.statusCounts.activ, fillClass: 'status-activ' },
            { label: getStatusLabel('mentenanta'), value: safeStats.statusCounts.mentenanta, fillClass: 'status-mentenanta' },
            { label: getStatusLabel('constructie'), value: safeStats.statusCounts.constructie, fillClass: 'status-constructie' },
            { label: getStatusLabel('oprit'), value: safeStats.statusCounts.oprit, fillClass: 'status-oprit' },
            { label: getStatusLabel('alerta'), value: safeStats.statusCounts.alerta, fillClass: 'status-alerta' },
            { label: getStatusLabel('other'), value: safeStats.statusCounts.other, fillClass: 'status-other' }
        ], Math.max(safeStats.totalReactors, 1));
    }

    function getSensorValue(sensor, field) {
        if (!sensor) {
            return '';
        }

        const value = sensor[field] ?? sensor[field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())];
        return value === null || value === undefined ? '' : String(value);
    }

    function buildSensorTypeOptions(selectedType = '') {
        const options = [];
        const normalizedSelectedType = String(selectedType || '').trim();

        if (!normalizedSelectedType) {
            options.push('<option value="" selected disabled>Alege tipul...</option>');
        } else if (!Object.prototype.hasOwnProperty.call(state.sensorTypeProfiles, normalizedSelectedType)) {
            options.push(`<option value="${escapeHtml(normalizedSelectedType)}" selected>${escapeHtml(normalizedSelectedType)}</option>`);
        } else {
            options.push('<option value="" disabled>Alege tipul...</option>');
        }

        Object.keys(state.sensorTypeProfiles).forEach((type) => {
            const selected = type === normalizedSelectedType ? ' selected' : '';
            options.push(`<option value="${escapeHtml(type)}"${selected}>${escapeHtml(type)}</option>`);
        });

        return options.join('');
    }

    async function ensureSensorTypesLoaded() {
        if (state.sensorTypesLoaded && Object.keys(state.sensorTypeProfiles).length > 0) {
            return state.sensorTypeProfiles;
        }

        if (state.sensorTypesLoading) {
            return state.sensorTypesLoading;
        }

        state.sensorTypesLoading = (async () => {
            try {
                const response = await window.authFetch('/sensors/types', { method: 'GET' });
                if (!response.ok) {
                    throw new Error(`Nu s-au putut prelua tipurile de senzori (${response.status})`);
                }

                state.sensorTypeProfiles = await response.json();
                state.sensorTypesLoaded = true;

                if (refs.sensorTypeInput) {
                    refs.sensorTypeInput.innerHTML = buildSensorTypeOptions(refs.sensorTypeInput.value || '');
                }

                return state.sensorTypeProfiles;
            } catch (error) {
                console.error(error);
                state.sensorTypeProfiles = {};
                state.sensorTypesLoaded = false;
                return {};
            } finally {
                state.sensorTypesLoading = null;
            }
        })();

        return state.sensorTypesLoading;
    }

    function isEditingSensor(sensorId) {
        return Number(state.editingSensorId) === Number(sensorId);
    }

    function getCurrentSensors() {
        return Array.isArray(state.sensors) ? state.sensors : [];
    }

    function safeBindClick(element, handler) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener('click', handler);
        }
    }

    function safeBindSubmit(element, handler) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener('submit', handler);
        }
    }

    function buildPopupContent(reactor) {
        const power = safeNumber(reactor.installed_power).toFixed(2);
        const efficiency = safeNumber(reactor.current_efficiency).toFixed(2);
        const normalized = normalizeStatus(reactor.status);
        const wear = normalized === 'activ' || normalized === 'mentenanta'
            ? `<br><strong>Uzura estimata:</strong> ${(100 - safeNumber(reactor.current_efficiency)).toFixed(2)}%`
            : '';

        return `
            <div style="font-size:12px; line-height:1.45;">
                <strong>${escapeHtml(reactor.name || '-')}</strong><br>
                <strong>Locatie:</strong> ${escapeHtml(reactor.location_name || '-')}<br>
                <strong>Tip:</strong> ${escapeHtml(reactor.reactor_type || '-')}<br>
                <strong>Status:</strong> ${escapeHtml(reactor.status || '-')}<br>
                <strong>Putere instalata:</strong> ${power} MW<br>
                <strong>Eficienta curenta:</strong> ${efficiency}%
                ${wear}
                <div style="margin-top:10px;">
                    <button type="button" class="btn sensor-manage-btn" data-sensor-reactor-id="${reactor.id}">Gestiune Senzori</button>
                </div>
            </div>
        `;
    }

    function renderMarkers(reactors) {
        if (!state.map) {
            return;
        }

        if (state.markerLayer) {
            state.markerLayer.remove();
        }

        state.markerLayer = L.layerGroup().addTo(state.map);

        reactors.forEach((reactor) => {
            const lat = safeNumber(reactor.latitude, NaN);
            const lng = safeNumber(reactor.longitude, NaN);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return;
            }

            const visual = statusVisual(reactor.status);
            const marker = L.circleMarker([lat, lng], {
                radius: getMarkerRadius(reactor),
                color: 'rgba(255, 255, 255, 0.95)',
                weight: 2.5,
                fillColor: visual.color,
                fillOpacity: 0.94,
                opacity: 1,
                className: statusCircleClass(reactor.status),
                title: reactor.name || 'Reactor'
            });

            marker.bindPopup(buildPopupContent(reactor));
            marker.addTo(state.markerLayer);
        });
    }

    function renderReactorList(reactors) {
        if (!reactors.length) {
            refs.reactorList.innerHTML = '<div class="reactor-list-item"><span>Nu există reactoare disponibile.</span></div>';
            return;
        }

        refs.reactorList.innerHTML = reactors.map((reactor) => {
            const visual = statusVisual(reactor.status);
            const power = safeNumber(reactor.installed_power).toFixed(2);
            const efficiency = safeNumber(reactor.current_efficiency).toFixed(2);

            return `
                <div class="reactor-list-item">
                    <div>
                        <strong>${escapeHtml(reactor.name || '-')}</strong><br>
                        <span>${escapeHtml(reactor.location_name || '-')} · ${power} MW · ${efficiency}%</span>
                    </div>
                    <span class="badge-status ${visual.badgeClass}">${escapeHtml(reactor.status || '-')}</span>
                </div>
            `;
        }).join('');
    }

    function updateLastRefresh() {
        refs.lastRefresh.textContent = `Ultima actualizare: ${new Date().toLocaleTimeString('ro-RO')}`;
    }

    async function fetchReactors() {
        const resp = await fetch(`${apiBase}/reactors`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (resp.status === 401) {
            window.location.href = 'login.html';
            return [];
        }

        if (!resp.ok) {
            throw new Error(`Nu s-au putut prelua reactoarele (${resp.status})`);
        }

        const payload = await resp.json();
        const reactors = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
        renderReactorStats(calculateReactorStats(reactors));
        return reactors;
    }

    function renderStatusCards(reactors) {
        const container = document.getElementById('status-cards');
        if (!container) {
            return;
        }

        const list = Array.isArray(reactors) ? reactors : [];
        const totalPower = list.reduce((sum, reactor) => sum + safeNumber(reactor.installed_power, 0), 0);
        const totalReactors = list.length;

        const typeBuckets = list.reduce((accumulator, reactor) => {
            const typeKey = normalizeReactorType(reactor.reactor_type);
            if (typeKey === 'CANDU') accumulator.candu += 1;
            else if (typeKey === 'SMR') accumulator.smr += 1;
            else if (typeKey === 'PWR' || typeKey === 'EPR' || typeKey === 'BWR') accumulator.pwr += 1;
            else accumulator.other += 1;
            return accumulator;
        }, { candu: 0, smr: 0, pwr: 0, other: 0 });

        const statusBuckets = list.reduce((accumulator, reactor) => {
            const statusKey = getStatusBucket(normalizeStatus(reactor.status));
            if (accumulator[statusKey] !== undefined) {
                accumulator[statusKey] += 1;
            }
            return accumulator;
        }, { activ: 0, mentenanta: 0, constructie: 0, oprit: 0, alerta: 0, other: 0 });

        const avgSeismic = list.length
            ? list.reduce((sum, reactor) => sum + safeNumber(reactor.seismic_risk, 0), 0) / list.length
            : 0;
        const seismic10 = avgSeismic > 10 ? avgSeismic / 10 : avgSeismic;

        container.innerHTML = `
            <div class="status-summary-item status-summary-item--power">
                <div class="status-summary-label">Putere totală</div>
                <div class="status-summary-value">${formatPower(totalPower)}</div>
                <div class="status-summary-note">${totalReactors} reactoare în calcul</div>
            </div>
            <div class="status-summary-item status-summary-item--types">
                <div class="status-summary-label">Tipuri</div>
                <div class="status-summary-value">${typeBuckets.candu}/${typeBuckets.smr}/${typeBuckets.pwr}/${typeBuckets.other}</div>
                <div class="status-summary-note">CANDU / SMR / PWR / Alte tipuri</div>
            </div>
            <div class="status-summary-item status-summary-item--status">
                <div class="status-summary-label">Status</div>
                <div class="status-summary-value">${statusBuckets.activ} active</div>
                <div class="status-summary-note">${statusBuckets.mentenanta} mentenanță · ${statusBuckets.constructie} construcție · ${statusBuckets.oprit} oprite</div>
            </div>
            <div class="status-summary-item status-summary-item--risk">
                <div class="status-summary-label">Risc seismic mediu</div>
                <div class="status-summary-value">${formatPercent(seismic10, 1)} / 10</div>
                <div class="status-summary-note">Scală normalizată din datele senzorilor</div>
            </div>
        `;
    }

    async function refreshReactors() {
        try {
            const reactors = await fetchReactors();
            state.reactors = reactors;
            renderMarkers(reactors);
            renderStatusCards(reactors);
            renderReactorList(reactors);
            updateLastRefresh();
        } catch (error) {
            console.error(error);
            renderReactorStats(createEmptyStats());
        }
    }

    function startPolling() {
        stopPolling();
        state.pollingId = window.setInterval(refreshReactors, pollingIntervalMs);
    }

    function stopPolling() {
        if (state.pollingId) {
            window.clearInterval(state.pollingId);
            state.pollingId = null;
        }
    }

    function openModal(modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal(modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }

    function showFormError(message) {
        refs.formError.textContent = message;
        refs.formError.classList.add('show');
    }

    function hideFormError() {
        refs.formError.textContent = '';
        refs.formError.classList.remove('show');
    }

    function showToast() {
        refs.toast.classList.add('show');
        window.setTimeout(() => refs.toast.classList.remove('show'), 2600);
    }

    function showToastMessage(message) {
        refs.toast.textContent = message;
        showToast();
    }

    function showSensorError(message) {
        refs.sensorError.textContent = message;
        refs.sensorError.classList.add('show');
    }

    function hideSensorError() {
        refs.sensorError.textContent = '';
        refs.sensorError.classList.remove('show');
    }

    function getReactorById(reactorId) {
        return state.reactors.find((reactor) => Number(reactor.id) === Number(reactorId)) || null;
    }

    async function fetchSensors(reactorId) {
        // Folosim authFetch
        const response = await window.authFetch(`/reactors/${reactorId}/sensors`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Nu s-au putut prelua senzorii (${response.status})`);
        }

        const payload = await response.json();
        return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
    }

    function renderSensorRow(sensor) {
        const editing = isEditingSensor(sensor.id);
        const min = safeNumber(sensor.min_safe_value).toFixed(2);
        const max = safeNumber(sensor.max_safe_value).toFixed(2);
        const current = safeNumber(sensor.current_value).toFixed(2);
        const currentType = getSensorValue(sensor, 'sensor_type') || sensor.type || '';

        if (editing) {
            return `
                <tr class="sensor-editing-row">
                    <td>
                        <select class="sensor-inline-input sensor-inline-type">
                            ${buildSensorTypeOptions(currentType)}
                        </select>
                    </td>
                    <td><input class="sensor-inline-input sensor-inline-unit" type="text" value="${escapeHtml(getSensorValue(sensor, 'unit'))}" maxlength="20" placeholder="-"></td>
                    <td class="sensor-inline-range">
                        <input class="sensor-inline-input sensor-inline-min" type="number" step="any" value="${escapeHtml(getSensorValue(sensor, 'min_safe_value') || min)}">
                        <span>→</span>
                        <input class="sensor-inline-input sensor-inline-max" type="number" step="any" value="${escapeHtml(getSensorValue(sensor, 'max_safe_value') || max)}">
                    </td>
                    <td>${current}</td>
                    <td>
                        <div class="sensor-row-actions sensor-row-actions-inline">
                            <button type="button" class="btn btn-success sensor-save-btn" data-sensor-id="${sensor.id}">Salvează</button>
                            <button type="button" class="btn sensor-cancel-btn" data-sensor-id="${sensor.id}">Renunță</button>
                        </div>
                    </td>
                </tr>
            `;
        }

        return `
            <tr>
                <td>${escapeHtml(sensor.sensor_type || sensor.type || '-')}</td>
                <td>${escapeHtml(sensor.unit || '-')}</td>
                <td>${min} - ${max}</td>
                <td>${current}</td>
                <td>
                    <div class="sensor-row-actions">
                        <button type="button" class="btn sensor-edit-btn" data-sensor-id="${sensor.id}">Editează</button>
                        <button type="button" class="btn btn-danger sensor-delete-btn" data-sensor-id="${sensor.id}">Șterge</button>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderSensorList(sensors) {
        state.sensors = Array.isArray(sensors) ? sensors : [];
        refs.sensorCountPill.textContent = `${sensors.length} senzori`;

        if (!sensors.length) {
            refs.sensorListBody.innerHTML = `
                <tr>
                    <td colspan="5"><div class="sensor-empty">Nu există senzori pentru acest reactor.</div></td>
                </tr>
            `;
            return;
        }

        if (!sensors.some((sensor) => isEditingSensor(sensor.id))) {
            state.editingSensorId = null;
        }

        refs.sensorListBody.innerHTML = sensors.map((sensor) => renderSensorRow(sensor)).join('');
    }

    function getSensorById(sensorId) {
        return getCurrentSensors().find((sensor) => Number(sensor.id) === Number(sensorId)) || null;
    }

    function beginSensorEdit(sensorId) {
        state.editingSensorId = Number(sensorId);
        renderSensorList(getCurrentSensors());
    }

    function cancelSensorEdit() {
        state.editingSensorId = null;
        renderSensorList(getCurrentSensors());
    }

    function readEditedSensorPayload(sensorId) {
        const row = refs.sensorListBody.querySelector(`tr .sensor-save-btn[data-sensor-id="${sensorId}"]`)?.closest('tr');
        if (!row) {
            return null;
        }

        const original = getSensorById(sensorId);
        if (!original) {
            return null;
        }

        const typeInput = row.querySelector('.sensor-inline-type');
        const unitInput = row.querySelector('.sensor-inline-unit');
        const minInput = row.querySelector('.sensor-inline-min');
        const maxInput = row.querySelector('.sensor-inline-max');

        const typeValue = typeInput ? typeInput.value.trim() : '';
        const unitValue = unitInput ? unitInput.value.trim() : '';
        const minValue = minInput ? minInput.value.trim() : '';
        const maxValue = maxInput ? maxInput.value.trim() : '';

        const payload = {};

        if (typeValue !== '' && typeValue !== String(original.sensor_type || original.type || '')) {
            payload.sensor_type = typeValue;
        }

        if (unitValue !== String(original.unit ?? '')) {
            payload.unit = unitValue;
        }

        if (minValue !== '' && Number(minValue) !== safeNumber(original.min_safe_value)) {
            payload.min_safe_value = Number(minValue);
        }

        if (maxValue !== '' && Number(maxValue) !== safeNumber(original.max_safe_value)) {
            payload.max_safe_value = Number(maxValue);
        }

        return payload;
    }

    async function saveSensor(sensorId) {
        if (!state.activeSensorReactorId) {
            showSensorError('Nu este selectat niciun reactor.');
            return;
        }

        const payload = readEditedSensorPayload(sensorId);
        if (!payload) {
            showSensorError('Nu s-a putut citi formularul senzorului.');
            return;
        }

        if (!Object.keys(payload).length) {
            showSensorError('Nu există modificări de salvat.');
            return;
        }

        const saveButton = refs.sensorListBody.querySelector(`.sensor-save-btn[data-sensor-id="${sensorId}"]`);
        const cancelButton = refs.sensorListBody.querySelector(`.sensor-cancel-btn[data-sensor-id="${sensorId}"]`);

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Se salvează...';
        }
        if (cancelButton) {
            cancelButton.disabled = true;
        }

        try {
            // Modificare aici: Înlocuire fetch cu window.authFetch
            const response = await window.authFetch(`/sensors/${sensorId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            const rawText = await response.text();
            let parsed = null;
            if (rawText) {
                try {
                    parsed = JSON.parse(rawText);
                } catch (error) {
                    parsed = null;
                }
            }

            if (response.ok) {
                state.editingSensorId = null;
                const sensors = await fetchSensors(state.activeSensorReactorId);
                renderSensorList(sensors);
                showToastMessage('Senzor actualizat cu succes');
                return;
            }

            throw new Error(parsed?.error || `Eroare la actualizarea senzorului (${response.status})`);
        } catch (error) {
            showSensorError(error.message || 'A apărut o eroare neașteptată.');
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Salvează';
            }
            if (cancelButton) {
                cancelButton.disabled = false;
            }
        }
    }

    function formatPercent(value) {
    return `${value || 0}%`;
    }

    async function loadSensorsForReactor(reactorId) {
        const reactor = getReactorById(reactorId);
        state.activeSensorReactorId = Number(reactorId);
        state.editingSensorId = null;
        refs.sensorModalSubtitle.textContent = reactor
            ? `Reactor: ${reactor.name} · ${reactor.location_name}`
            : `Reactor ID: ${reactorId}`;

        hideSensorError();
        openModal(refs.sensorModal);

        try {
            await ensureSensorTypesLoaded();
            const sensors = await fetchSensors(reactorId);
            renderSensorList(sensors);
        } catch (error) {
            showSensorError(error.message || 'Eroare la încărcarea senzorilor.');
            renderSensorList([]);
        }
    }

    async function submitSensor(event) {
        event.preventDefault();
        hideSensorError();

        if (!state.activeSensorReactorId) {
            showSensorError('Nu este selectat niciun reactor.');
            return;
        }

        if (!refs.sensorForm.checkValidity()) {
            refs.sensorForm.reportValidity();
            return;
        }

        const payload = {
            sensor_type: refs.sensorTypeInput.value.trim(),
            unit: refs.sensorUnitInput.value.trim(),
            min_safe_value: Number(refs.sensorMinInput.value),
            max_safe_value: Number(refs.sensorMaxInput.value)
        };

        refs.submitSensorButton.disabled = true;
        refs.submitSensorButton.textContent = 'Se adaugă...';

        try {
            // Modificare aici: Înlocuire fetch cu window.authFetch
            const response = await window.authFetch(`/reactors/${state.activeSensorReactorId}/sensors`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            const rawText = await response.text();
            let parsed = null;
            if (rawText) {
                try {
                    parsed = JSON.parse(rawText);
                } catch (error) {
                    parsed = null;
                }
            }

            if (response.status === 201) {
                refs.sensorForm.reset();
                const sensors = await fetchSensors(state.activeSensorReactorId);
                renderSensorList(sensors);
                showToastMessage('Senzor adăugat cu succes');
                return;
            }

            throw new Error(parsed?.error || `Eroare la adăugarea senzorului (${response.status})`);
        } catch (error) {
            showSensorError(error.message || 'A apărut o eroare neașteptată.');
        } finally {
            refs.submitSensorButton.disabled = false;
            refs.submitSensorButton.textContent = 'Adaugă';
        }
    }

    async function deleteSensor(sensorId) {
        if (!sensorId || !state.activeSensorReactorId) {
            return;
        }

        try {
            // Modificare aici: Înlocuire fetch cu window.authFetch
            const response = await window.authFetch(`/sensors/${sensorId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                const rawText = await response.text();
                let parsed = null;
                if (rawText) {
                    try {
                        parsed = JSON.parse(rawText);
                    } catch (error) {
                        parsed = null;
                    }
                }

                throw new Error(parsed?.error || `Eroare la ștergerea senzorului (${response.status})`);
            }

            const sensors = await fetchSensors(state.activeSensorReactorId);
            renderSensorList(sensors);
            showToastMessage('Senzor șters cu succes');
        } catch (error) {
            showSensorError(error.message || 'A apărut o eroare neașteptată.');
        }
    }

    function ensurePickerMap() {
        if (!state.pickerMap) {
            state.pickerMap = L.map('picker-map', {
                zoomControl: true,
                maxBounds: [[-90, -180], [90, 180]],
                maxBoundsViscosity: 1.0,
                minZoom: 2
            }).setView([46.2, 20.2], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                noWrap: true,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(state.pickerMap);

            state.pickerMap.on('click', (event) => {
                const { lat, lng } = event.latlng;
                if (!state.pickerMarker) {
                    state.pickerMarker = L.marker([lat, lng]).addTo(state.pickerMap);
                } else {
                    state.pickerMarker.setLatLng([lat, lng]);
                }

                refs.latitudeInput.value = lat.toFixed(6);
                refs.longitudeInput.value = lng.toFixed(6);
                closeModal(refs.pickerModal);
            });
        }

        window.setTimeout(() => state.pickerMap.invalidateSize(), 50);
    }

    function buildCreatePayload() {
        return {
            name: refs.nameInput.value.trim(),
            location_name: refs.locationNameInput.value.trim(),
            reactor_type: refs.reactorTypeInput.value,
            installed_power: Number(refs.installedPowerInput.value),
            latitude: Number(refs.latitudeInput.value),
            longitude: Number(refs.longitudeInput.value),
            webhook_url: refs.webhookUrlInput ? refs.webhookUrlInput.value.trim() : '' // <-- Adăugat aici
        };
    }

    async function submitCreateReactor(event) {
        event.preventDefault();
        hideFormError();

        if (!refs.form.checkValidity()) {
            refs.form.reportValidity();
            return;
        }

        const payload = buildCreatePayload();
        refs.submitButton.disabled = true;
        refs.submitButton.textContent = 'Se salveaza...';

        try {
            // Modificare aici: Înlocuire fetch cu window.authFetch
            const response = await window.authFetch(`/reactors`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            const rawText = await response.text();
            let parsed = null;
            if (rawText) {
                try {
                    parsed = JSON.parse(rawText);
                } catch (error) {
                    parsed = null;
                }
            }

            if (response.status === 201) {
                refs.form.reset();
                closeModal(refs.reactorModal);
                showToast();
                await refreshReactors();
                return;
            }

            throw new Error(parsed?.error || parsed?.message || `Eroare la creare reactor (${response.status})`);
        } catch (error) {
            showFormError(error.message || 'A apărut o eroare neașteptată.');
        } finally {
            refs.submitButton.disabled = false;
            refs.submitButton.textContent = 'Salveaza';
        }
    }

    function bindEvents() {
        safeBindClick(refs.openAddButton, () => {
            hideFormError();
            ensureSensorTypesLoaded();
            openModal(refs.reactorModal);
        });

        safeBindClick(refs.closeReactorModalBtn, () => closeModal(refs.reactorModal));
        safeBindClick(refs.cancelReactorModalBtn, () => closeModal(refs.reactorModal));
        safeBindClick(refs.openPickerButton, () => {
            openModal(refs.pickerModal);
            ensurePickerMap();
        });
        safeBindClick(refs.closePickerModalBtn, () => closeModal(refs.pickerModal));

        if (refs.reactorModal) {
            refs.reactorModal.addEventListener('click', (event) => {
                if (event.target === refs.reactorModal) {
                    closeModal(refs.reactorModal);
                }
            });
        }

        if (refs.pickerModal) {
            refs.pickerModal.addEventListener('click', (event) => {
                if (event.target === refs.pickerModal) {
                    closeModal(refs.pickerModal);
                }
            });
        }

        if (refs.sensorModal) {
            refs.sensorModal.addEventListener('click', (event) => {
                if (event.target === refs.sensorModal) {
                    closeModal(refs.sensorModal);
                }
            });
        }

        safeBindClick(refs.closeSensorModalBtn, () => closeModal(refs.sensorModal));
        safeBindSubmit(refs.sensorForm, submitSensor);

        if (refs.sensorTypeInput) {
            refs.sensorTypeInput.innerHTML = buildSensorTypeOptions('');
        }

        if (refs.sensorListBody) {
            refs.sensorListBody.addEventListener('click', (event) => {
                const editButton = event.target.closest('.sensor-edit-btn');
                if (editButton) {
                    beginSensorEdit(editButton.getAttribute('data-sensor-id'));
                    return;
                }

                const saveButton = event.target.closest('.sensor-save-btn');
                if (saveButton) {
                    saveSensor(saveButton.getAttribute('data-sensor-id'));
                    return;
                }

                const cancelButton = event.target.closest('.sensor-cancel-btn');
                if (cancelButton) {
                    cancelSensorEdit();
                    return;
                }

                const deleteButton = event.target.closest('.sensor-delete-btn');
                if (!deleteButton) {
                    return;
                }

                deleteSensor(deleteButton.getAttribute('data-sensor-id'));
            });
        }

        if (state.map && typeof state.map.on === 'function') {
            state.map.on('popupopen', (event) => {
                const popupElement = event.popup?.getElement?.();
                if (!popupElement) {
                    return;
                }

                const button = popupElement.querySelector('.sensor-manage-btn');
                if (button) {
                    button.addEventListener('click', () => {
                        const reactorId = button.getAttribute('data-sensor-reactor-id');
                        if (reactorId) {
                            loadSensorsForReactor(reactorId);
                        }
                    });
                }
            });
        }

        if (refs.mapContainer) {
            refs.mapContainer.addEventListener('click', (event) => {
                const trigger = event.target.closest('.sensor-manage-btn');
                if (!trigger) {
                    return;
                }

                const reactorId = trigger.getAttribute('data-sensor-reactor-id');
                if (reactorId) {
                    loadSensorsForReactor(reactorId);
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal(refs.pickerModal);
                closeModal(refs.reactorModal);
                closeModal(refs.sensorModal);
            }
        });

        safeBindSubmit(refs.form, submitCreateReactor);
    }

    init();
})();