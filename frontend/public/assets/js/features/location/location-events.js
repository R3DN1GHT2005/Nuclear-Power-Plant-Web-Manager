/*
 * location-events.js — Event binding for the
 * location page. Wires modal controls, sensor
 * CRUD delegation, map popups, form submissions,
 * and keyboard shortcuts. Extracted from
 * monolithic location.js.
 */

function openStatusModal(reactor) {
  var refs = LocationState.getRefs();
  if (!reactor || !refs.statusModal || !refs.statusSelect) return;
  LocationState.getState().selectedStatusReactorId = Number(reactor.id);
  refs.statusSelect.value = normalizeStatusChoice(reactor.status);
  if (refs.statusModalSubtitle) refs.statusModalSubtitle.textContent = 'Reactor: ' + reactor.name + ' · ' + reactor.location_name;
  openModal(refs.statusModal);
}

function bindEvents() {
  var state = LocationState.getState();
  var refs = LocationState.getRefs();

  safeBindClick(refs.openAddButton, function() {
    LocationState.hideFormError();
    ensureSensorTypesLoaded();
    openModal(refs.reactorModal);
  });

  safeBindClick(refs.closeReactorModalBtn, function() { closeModal(refs.reactorModal); });
  safeBindClick(refs.cancelReactorModalBtn, function() { closeModal(refs.reactorModal); });

  safeBindClick(refs.openPickerButton, function() {
    openModal(refs.pickerModal);
    ensurePickerMap();
  });
  safeBindClick(refs.closePickerModalBtn, function() { closeModal(refs.pickerModal); });
  safeBindClick(refs.closeStatusModalBtn, function() { closeModal(refs.statusModal); });
  safeBindClick(refs.cancelStatusModalBtn, function() { closeModal(refs.statusModal); });
  safeBindClick(refs.confirmStatusModalBtn, function() { LocationState.submitStatusChange(); });

  if (refs.reactorModal) {
    refs.reactorModal.addEventListener('click', function(event) {
      if (event.target === refs.reactorModal) closeModal(refs.reactorModal);
    });
  }

  if (refs.pickerModal) {
    refs.pickerModal.addEventListener('click', function(event) {
      if (event.target === refs.pickerModal) closeModal(refs.pickerModal);
    });
  }

  if (refs.sensorModal) {
    refs.sensorModal.addEventListener('click', function(event) {
      if (event.target === refs.sensorModal) closeModal(refs.sensorModal);
    });
  }

  if (refs.statusModal) {
    refs.statusModal.addEventListener('click', function(event) {
      if (event.target === refs.statusModal) closeModal(refs.statusModal);
    });
  }

  safeBindClick(refs.closeSensorModalBtn, function() { closeModal(refs.sensorModal); });
  safeBindSubmit(refs.sensorForm, submitSensor);

  if (refs.sensorTypeInput) { refs.sensorTypeInput.innerHTML = buildSensorTypeOptions(''); }

  if (refs.sensorListBody) {
    refs.sensorListBody.addEventListener('click', function(event) {
      var target = event.target;
      var editButton = target.closest('.sensor-edit-btn');
      if (editButton) { beginSensorEdit(editButton.getAttribute('data-sensor-id')); return; }
      var saveButton = target.closest('.sensor-save-btn');
      if (saveButton) { saveSensor(saveButton.getAttribute('data-sensor-id')); return; }
      var cancelButton = target.closest('.sensor-cancel-btn');
      if (cancelButton) { cancelSensorEdit(); return; }
      var deleteButton = target.closest('.sensor-delete-btn');
      if (deleteButton) { deleteSensor(deleteButton.getAttribute('data-sensor-id')); }
    });
  }

  if (state.map && typeof state.map.on === 'function') {
    state.map.on('popupopen', function(event) {
      var popupElement = event.popup ? event.popup.getElement() : null;
      if (!popupElement) return;
      var button = popupElement.querySelector('.sensor-manage-btn');
      if (button) {
        button.addEventListener('click', function() {
          var reactorId = button.getAttribute('data-sensor-reactor-id');
          if (reactorId) loadSensorsForReactor(reactorId);
        });
      }
    });
  }

  if (refs.mapContainer) {
    refs.mapContainer.addEventListener('click', function(event) {
      var trigger = event.target.closest('.sensor-manage-btn');
      if (!trigger) return;
      var reactorId = trigger.getAttribute('data-sensor-reactor-id');
      if (reactorId) loadSensorsForReactor(reactorId);
    });
  }

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal(refs.pickerModal);
      closeModal(refs.reactorModal);
      closeModal(refs.sensorModal);
    }
  });

  safeBindSubmit(refs.form, submitCreateReactor);
}
