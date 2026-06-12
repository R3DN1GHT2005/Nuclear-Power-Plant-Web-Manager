/*
 * frontend/public/assets/js/features/location/location-sensors.js
 * Sensor CRUD within location page — lists sensors for a reactor,
 * builds sensor-type dropdowns, handles inline save/cancel editing,
 * and performs create/delete operations via the API.
 */
function getSensorValue(sensor, field) {
  if (!sensor) return '';
  var value = sensor[field] !== null && sensor[field] !== undefined ? sensor[field] : sensor[field.replace(/_([a-z])/g, function(_, letter) { return letter.toUpperCase(); })];
  return value === null || value === undefined ? '' : String(value);
}

function isEditingSensor(sensorId) {
  var state = LocationState.getState();
  return Number(state.editingSensorId) === Number(sensorId);
}

function getCurrentSensors() {
  var state = LocationState.getState();
  return Array.isArray(state.sensors) ? state.sensors : [];
}

function getSensorById(sensorId) {
  return getCurrentSensors().find(function(s) { return Number(s.id) === Number(sensorId); }) || null;
}

function buildSensorTypeOptions(selectedType) {
  var state = LocationState.getState();
  if (selectedType === undefined) selectedType = '';
  var options = [];
  var normalizedSelected = String(selectedType || '').trim();

  if (!normalizedSelected) {
    options.push('<option value="" selected disabled>Alege tipul...</option>');
  } else if (!state.sensorTypeProfiles.hasOwnProperty(normalizedSelected)) {
    options.push('<option value="' + escapeHtml(normalizedSelected) + '" selected>' + escapeHtml(normalizedSelected) + '</option>');
  } else {
    options.push('<option value="" disabled>Alege tipul...</option>');
  }

  Object.keys(state.sensorTypeProfiles).forEach(function(type) {
    var selected = type === normalizedSelected ? ' selected' : '';
    options.push('<option value="' + escapeHtml(type) + '"' + selected + '>' + escapeHtml(type) + '</option>');
  });

  return options.join('');
}

async function ensureSensorTypesLoaded() {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  if (state.sensorTypesLoaded && Object.keys(state.sensorTypeProfiles).length > 0) return state.sensorTypeProfiles;
  if (state.sensorTypesLoading) return state.sensorTypesLoading;

  state.sensorTypesLoading = (async function() {
    try {
      var response = await window.authFetch('/sensors/types', { method: 'GET' });
      if (!response.ok) { throw new Error('Nu s-au putut prelua tipurile de senzori (' + response.status + ')'); }
      state.sensorTypeProfiles = await response.json();
      state.sensorTypesLoaded = true;
      if (refs.sensorTypeInput) refs.sensorTypeInput.innerHTML = buildSensorTypeOptions(refs.sensorTypeInput.value || '');
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

async function fetchSensors(reactorId) {
  var response = await window.authFetch('/reactors/' + reactorId + '/sensors', { method: 'GET' });
  if (!response.ok) { throw new Error('Nu s-au putut prelua senzorii (' + response.status + ')'); }
  var payload = await response.json();
  return Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
}

function renderSensorRow(sensor) {
  var editing = isEditingSensor(sensor.id);
  var min = safeNumber(sensor.min_safe_value).toFixed(2);
  var max = safeNumber(sensor.max_safe_value).toFixed(2);
  var current = safeNumber(sensor.current_value).toFixed(2);
  var currentType = getSensorValue(sensor, 'sensor_type') || sensor.type || '';

  if (editing) {
    return '<tr class="sensor-editing-row">' +
      '<td><select class="sensor-inline-input sensor-inline-type">' + buildSensorTypeOptions(currentType) + '</select></td>' +
      '<td><input class="sensor-inline-input sensor-inline-unit" type="text" value="' + escapeHtml(getSensorValue(sensor, 'unit')) + '" maxlength="20" placeholder="-"></td>' +
      '<td class="sensor-inline-range">' +
        '<input class="sensor-inline-input sensor-inline-min" type="number" step="any" value="' + escapeHtml(getSensorValue(sensor, 'min_safe_value') || min) + '">' +
        '<span>→</span>' +
        '<input class="sensor-inline-input sensor-inline-max" type="number" step="any" value="' + escapeHtml(getSensorValue(sensor, 'max_safe_value') || max) + '">' +
      '</td>' +
      '<td>' + current + '</td>' +
      '<td><div class="sensor-row-actions sensor-row-actions-inline">' +
        '<button type="button" class="btn btn-success sensor-save-btn" data-sensor-id="' + sensor.id + '">Salvează</button>' +
        '<button type="button" class="btn sensor-cancel-btn" data-sensor-id="' + sensor.id + '">Renunță</button>' +
      '</div></td>' +
    '</tr>';
  }

  return '<tr>' +
    '<td>' + escapeHtml(sensor.sensor_type || sensor.type || '-') + '</td>' +
    '<td>' + escapeHtml(sensor.unit || '-') + '</td>' +
    '<td>' + min + ' - ' + max + '</td>' +
    '<td>' + current + '</td>' +
    '<td><div class="sensor-row-actions">' +
      '<button type="button" class="btn sensor-edit-btn" data-sensor-id="' + sensor.id + '">Editează</button>' +
      '<button type="button" class="btn btn-danger sensor-delete-btn" data-sensor-id="' + sensor.id + '">Șterge</button>' +
    '</div></td>' +
  '</tr>';
}

function renderSensorList(sensors) {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  state.sensors = Array.isArray(sensors) ? sensors : [];
  refs.sensorCountPill.textContent = sensors.length + ' senzori';

  if (!sensors.length) {
    refs.sensorListBody.innerHTML = '<tr><td colspan="5"><div class="sensor-empty">Nu există senzori pentru acest reactor.</div></td></tr>';
    return;
  }

  if (!sensors.some(function(s) { return isEditingSensor(s.id); })) { state.editingSensorId = null; }

  refs.sensorListBody.innerHTML = sensors.map(function(s) { return renderSensorRow(s); }).join('');
}

function beginSensorEdit(sensorId) {
  var state = LocationState.getState();
  state.editingSensorId = Number(sensorId);
  renderSensorList(getCurrentSensors());
}

function cancelSensorEdit() {
  LocationState.getState().editingSensorId = null;
  renderSensorList(getCurrentSensors());
}

function readEditedSensorPayload(sensorId) {
  var refs = LocationState.getRefs();
  var row = refs.sensorListBody.querySelector('tr .sensor-save-btn[data-sensor-id="' + sensorId + '"]');
  if (row) row = row.closest('tr');
  if (!row) return null;

  var original = getSensorById(sensorId);
  if (!original) return null;

  var typeInput = row.querySelector('.sensor-inline-type');
  var unitInput = row.querySelector('.sensor-inline-unit');
  var minInput = row.querySelector('.sensor-inline-min');
  var maxInput = row.querySelector('.sensor-inline-max');

  var typeValue = typeInput ? typeInput.value.trim() : '';
  var unitValue = unitInput ? unitInput.value.trim() : '';
  var minValue = minInput ? minInput.value.trim() : '';
  var maxValue = maxInput ? maxInput.value.trim() : '';

  var payload = {};
  if (typeValue !== '' && typeValue !== String(original.sensor_type || original.type || '')) payload.sensor_type = typeValue;
  if (unitValue !== String(original.unit !== null && original.unit !== undefined ? original.unit : '')) payload.unit = unitValue;
  if (minValue !== '' && Number(minValue) !== safeNumber(original.min_safe_value)) payload.min_safe_value = Number(minValue);
  if (maxValue !== '' && Number(maxValue) !== safeNumber(original.max_safe_value)) payload.max_safe_value = Number(maxValue);
  return payload;
}

async function saveSensor(sensorId) {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  if (!state.activeSensorReactorId) { LocationState.showSensorError('Nu este selectat niciun reactor.'); return; }

  var payload = readEditedSensorPayload(sensorId);
  if (!payload) { LocationState.showSensorError('Nu s-a putut citi formularul senzorului.'); return; }
  if (!Object.keys(payload).length) { LocationState.showSensorError('Nu există modificări de salvat.'); return; }

  var saveButton = refs.sensorListBody.querySelector('.sensor-save-btn[data-sensor-id="' + sensorId + '"]');
  var cancelButton = refs.sensorListBody.querySelector('.sensor-cancel-btn[data-sensor-id="' + sensorId + '"]');
  if (saveButton) { saveButton.disabled = true; saveButton.textContent = 'Se salvează...'; }
  if (cancelButton) { cancelButton.disabled = true; }

  try {
    var response = await window.authFetch('/sensors/' + sensorId, {
      method: 'PATCH',
      headers: LocationState.getHeaders(),
      body: JSON.stringify(payload)
    });
    var rawText = await response.text();
    var parsed = null;
    if (rawText) { try { parsed = JSON.parse(rawText); } catch (e) { parsed = null; } }

    if (response.ok) {
      state.editingSensorId = null;
      var sensors = await fetchSensors(state.activeSensorReactorId);
      renderSensorList(sensors);
      LocationState.showToastMessage('Senzor actualizat cu succes');
      return;
    }
    throw new Error((parsed && parsed.error) || 'Eroare la actualizarea senzorului (' + response.status + ')');
  } catch (error) {
    LocationState.showSensorError(error.message || 'A apărut o eroare neașteptată.');
  } finally {
    if (saveButton) { saveButton.disabled = false; saveButton.textContent = 'Salvează'; }
    if (cancelButton) { cancelButton.disabled = false; }
  }
}

async function loadSensorsForReactor(reactorId) {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  var reactor = state.reactors.find(function(r) { return Number(r.id) === Number(reactorId); }) || null;
  state.activeSensorReactorId = Number(reactorId);
  state.editingSensorId = null;
  refs.sensorModalSubtitle.textContent = reactor ? 'Reactor: ' + reactor.name + ' · ' + reactor.location_name : 'Reactor ID: ' + reactorId;
  LocationState.hideSensorError();
  openModal(refs.sensorModal);

  try {
    await ensureSensorTypesLoaded();
    var sensors = await fetchSensors(reactorId);
    renderSensorList(sensors);
  } catch (error) {
    LocationState.showSensorError(error.message || 'Eroare la încărcarea senzorilor.');
    renderSensorList([]);
  }
}

async function submitSensor(event) {
  event.preventDefault();
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  LocationState.hideSensorError();

  if (!state.activeSensorReactorId) { LocationState.showSensorError('Nu este selectat niciun reactor.'); return; }
  if (!refs.sensorForm.checkValidity()) { refs.sensorForm.reportValidity(); return; }

  var selectedType = refs.sensorTypeInput.value.trim();
  var profile = state.sensorTypeProfiles[selectedType];
  var payload = {
    sensor_type: selectedType,
    min_safe_value: refs.sensorMinInput.value ? Number(refs.sensorMinInput.value) : (profile ? profile.defaultMin : 0),
    max_safe_value: refs.sensorMaxInput.value ? Number(refs.sensorMaxInput.value) : (profile ? profile.defaultMax : 0)
  };

  refs.submitSensorButton.disabled = true;
  refs.submitSensorButton.textContent = 'Se adaugă...';

  try {
    var response = await window.authFetch('/reactors/' + state.activeSensorReactorId + '/sensors', {
      method: 'POST',
      headers: LocationState.getHeaders(),
      body: JSON.stringify(payload)
    });
    var rawText = await response.text();
    var parsed = null;
    if (rawText) { try { parsed = JSON.parse(rawText); } catch (e) { parsed = null; } }

    if (response.status === 201) {
      refs.sensorForm.reset();
      var sensors = await fetchSensors(state.activeSensorReactorId);
      renderSensorList(sensors);
      LocationState.showToastMessage('Senzor adăugat cu succes');
      return;
    }
    throw new Error((parsed && parsed.error) || 'Eroare la adăugarea senzorului (' + response.status + ')');
  } catch (error) {
    LocationState.showSensorError(error.message || 'A apărut o eroare neașteptată.');
  } finally {
    refs.submitSensorButton.disabled = false;
    refs.submitSensorButton.textContent = 'Adaugă';
  }
}

async function deleteSensor(sensorId) {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();
  if (!sensorId || !state.activeSensorReactorId) return;

  try {
    var response = await window.authFetch('/sensors/' + sensorId, {
      method: 'DELETE',
      headers: LocationState.getHeaders()
    });

    if (!response.ok) {
      var rawText = await response.text();
      var parsed = null;
      if (rawText) { try { parsed = JSON.parse(rawText); } catch (e) { parsed = null; } }
      throw new Error((parsed && parsed.error) || 'Eroare la ștergerea senzorului (' + response.status + ')');
    }

    var sensors = await fetchSensors(state.activeSensorReactorId);
    renderSensorList(sensors);
    LocationState.showToastMessage('Senzor șters cu succes');
  } catch (error) {
    LocationState.showSensorError(error.message || 'A apărut o eroare neașteptată.');
  }
}
