/*
 * frontend/public/assets/js/features/location/location-reactor-form.js
 * Create-reactor form handler — builds the payload from form fields
 * (name, location, type, power, coordinates, webhook, MAC address)
 * and submits via authFetch. Validates input, manages button loading
 * state, and displays errors on failure.
 */
function buildCreatePayload() {
  var refs = LocationState.getRefs();
  return {
    name: refs.nameInput.value.trim(),
    location_name: refs.locationNameInput.value.trim(),
    reactor_type: refs.reactorTypeInput.value,
    installed_power: Number(refs.installedPowerInput.value),
    latitude: Number(refs.latitudeInput.value),
    longitude: Number(refs.longitudeInput.value),
    webhook_url: refs.webhookUrlInput ? refs.webhookUrlInput.value.trim() : '',
    mac_address: refs.macAddressInput ? refs.macAddressInput.value.trim() : ''
  };
}

async function submitCreateReactor(event) {
  event.preventDefault();
  var refs = LocationState.getRefs();
  LocationState.hideFormError();

  if (!refs.form.checkValidity()) { refs.form.reportValidity(); return; }

  var payload = buildCreatePayload();
  refs.submitButton.disabled = true;
  refs.submitButton.textContent = 'Se salveaza...';

  try {
    var response = await window.authFetch('/reactors', {
      method: 'POST',
      headers: LocationState.getHeaders(),
      body: JSON.stringify(payload)
    });
    var rawText = await response.text();
    var parsed = null;
    if (rawText) { try { parsed = JSON.parse(rawText); } catch (e) { parsed = null; } }

    if (response.status === 201) {
      refs.form.reset();
      closeModal(refs.reactorModal);
      LocationState.showToast();
      await LocationState.refreshReactors();
      return;
    }
    throw new Error((parsed && parsed.error) || (parsed && parsed.message) || 'Eroare la creare reactor (' + response.status + ')');
  } catch (error) {
    LocationState.showFormError(error.message || 'A apărut o eroare neașteptată.');
  } finally {
    refs.submitButton.disabled = false;
    refs.submitButton.textContent = 'Salveaza';
  }
}
