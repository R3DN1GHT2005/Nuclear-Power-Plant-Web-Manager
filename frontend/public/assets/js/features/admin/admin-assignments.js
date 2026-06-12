/*
 * frontend/public/assets/js/features/admin/admin-assignments.js
 * Admin reactor assignments — renders the assignment overview and
 * assignment modal. Displays each reactor with its personnel and
 * provides UI for assigning/removing users from reactors.
 */
function renderReactorAssignments() {
    var container = document.getElementById("reactor-assignments-container");
    if (!container) return;

    if (!AdminState.reactors.length) {
        container.innerHTML = '<p class="history-empty">Niciun reactor disponibil.</p>';
        return;
    }

    container.innerHTML = AdminState.reactors.map(function(reactor) {
        var assignedUsers = AdminState.users.filter(function(u) { return u.reactor_id === reactor.id; });

        var usersHtml = assignedUsers.length > 0
            ? assignedUsers.map(function(u) {
                return '<div class="user-item">' +
                    '<div>' +
                        '<div class="user-info-name">' + u.name + '</div>' +
                        '<div class="user-info-email">' + u.email + '</div>' +
                    '</div>' +
                    '<span class="badge badge-user">' + (u.intervention_role || 'Tehnician') + '</span>' +
                '</div>';
            }).join('')
            : '<p style="color: #B0BAC9; font-size: 12px; margin-top: 8px;">Niciun operator asignat.</p>';

        return '<div class="reactor-card">' +
            '<div class="reactor-header">' +
                '<div>' +
                    '<div class="reactor-name">' + reactor.name + '</div>' +
                    '<div class="reactor-loc">' + reactor.location_name + '</div>' +
                '</div>' +
                '<span class="badge" style="background: #F1F5F9;">' + assignedUsers.length + ' Membri</span>' +
            '</div>' +
            usersHtml +
        '</div>';
    }).join('');
}

function populateReactorSelect() {
    var select = document.getElementById("assign-reactor-select");
    if (!select) return;

    select.innerHTML = '<option value="">— Fără asignare (Elimină) —</option>';
    AdminState.reactors.forEach(function(r) {
        select.innerHTML += '<option value="' + r.id + '">' + r.name + ' (' + r.location_name + ')</option>';
    });
}


window.openAssignModal = function(userId) {
    AdminState.selectedUserId = userId;
    var user = AdminState.users.find(function(u) { return u.id === userId; });

    var selectEl = document.getElementById("assign-reactor-select");
    if (selectEl) selectEl.value = user ? user.reactor_id || "" : "";

    document.getElementById("modal-assign-reactor")?.classList.add("open");
};

document.getElementById("confirm-assign-reactor")?.addEventListener("click", async function() {
    var reactorId = document.getElementById("assign-reactor-select").value;

    try {
        var res = await window.authFetch('/users/' + AdminState.selectedUserId + '/reactor', {
            method: 'PUT',
            body: JSON.stringify({ reactor_id: reactorId ? parseInt(reactorId) : null })
        });

        if (res.ok) {
            showToastMessage("Asignare actualizată cu succes!");
            document.getElementById("modal-assign-reactor").classList.remove("open");
            location.reload();
        } else {
            var data = await res.json();
            showToastMessage(data.error || "Eroare la asignare.", "error");
        }
    } catch (e) {
        showToastMessage("Eroare de rețea.", "error");
    }
});


document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.addEventListener('click', function(e) { e.stopPropagation(); });
    });
});
