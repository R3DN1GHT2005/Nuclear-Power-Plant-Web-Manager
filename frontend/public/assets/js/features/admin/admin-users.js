/*
 * frontend/public/assets/js/features/admin/admin-users.js
 * Admin user management — renders the users table with role badges
 * and action buttons. Implements create/edit user, password change,
 * and delete user via modal forms.
 */
function renderUsersTable() {
    var tbody = document.getElementById("users-table-body");
    if (!tbody) return;

    if (!AdminState.users.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="history-empty">Niciun utilizator găsit.</td></tr>';
        return;
    }

    tbody.innerHTML = AdminState.users.map(function(user) {
        var roleBadge;
        if (user.role === 'admin') {
            roleBadge = '<span class="badge badge-admin">Administrator</span>';
        } else if (user.role === 'manager') {
            roleBadge = '<span class="badge badge-manager">Manager</span>';
        } else {
            roleBadge = '<span class="badge badge-user">Tehnician</span>';
        }

        var assignedReactor = '<span style="color:var(--text-3);font-size:12px;">— Neasignat</span>';
        if (user.reactor_id) {
            var reactorName = AdminState.reactors.find(function(r) { return r.id === user.reactor_id; });
            var rName = reactorName ? reactorName.name : 'Reactor #' + user.reactor_id;
            assignedReactor = '<div class="assigned-reactor-name" style="font-weight: 500;">' + rName + '</div>' +
                (user.intervention_role ? '<div class="assigned-reactor-role" style="font-size: 0.8rem; color: var(--text-3);">' + user.intervention_role + '</div>' : '');
        }

        var assignBtn = user.role === 'admin'
            ? '<button class="btn-sm" disabled style="opacity:0.5; cursor:not-allowed;" title="Adminii au acces global. Nu necesită asignare.">Asignează</button>'
            : '<button class="btn-sm" onclick="openAssignModal(' + user.id + ')">Asignează</button>';

        return '<tr>' +
            '<td style="color:var(--text-3);font-size:12px;font-family:\'DM Mono\',monospace;">#' + user.id + '</td>' +
            '<td style="font-weight:600;">' + user.name + '</td>' +
            '<td style="color:var(--text-2);">' + user.email + '</td>' +
            '<td>' + roleBadge + '</td>' +
            '<td>' + assignedReactor + '</td>' +
            '<td class="action-cell">' +
                assignBtn +
                '<button class="btn-sm" onclick="openPasswordModal(' + user.id + ', \'' + user.name.replace(/'/g, "\\'") + '\')">Parolă</button>' +
                '<button class="btn-sm btn-danger" onclick="deleteUser(' + user.id + ', \'' + user.name.replace(/'/g, "\\'") + '\')">Șterge</button>' +
            '</td>' +
        '</tr>';
    }).join("");
}

//create user popup
document.getElementById("btn-create-user")?.addEventListener("click", function() {
    document.getElementById("new-user-firstname").value = "";
    document.getElementById("new-user-lastname").value = "";
    document.getElementById("new-user-email").value = "";
    document.getElementById("new-user-password").value = "";
    document.getElementById("modal-create-user")?.classList.add("open");
});

document.getElementById("confirm-create-user")?.addEventListener("click", async function() {
    var firstName = document.getElementById("new-user-firstname").value.trim();
    var lastName = document.getElementById("new-user-lastname").value.trim();

    var payload = {
        first_name: firstName,
        last_name: lastName,
        email: document.getElementById("new-user-email").value.trim(),
        password: document.getElementById("new-user-password").value,
        role: document.getElementById("new-user-role").value
    };

    if (!firstName || !lastName || !payload.email || !payload.password) {
        return showToastMessage("Toate câmpurile sunt obligatorii!", "error");
    }

    try {
        var res = await window.authFetch('/users', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToastMessage("Utilizator creat cu succes!");
            document.getElementById("modal-create-user").classList.remove("open");
            location.reload();
        } else {
            var data = await res.json();
            showToastMessage(data.error || "Eroare la creare.", "error");
        }
    } catch (e) {
        showToastMessage("Eroare de rețea.", "error");
    }
});

//password reset popup
window.openPasswordModal = function(userId, userName) {
    AdminState.selectedUserId = userId;
    var subEl = document.getElementById("pwd-modal-sub");
    if (subEl) subEl.textContent = "Setați o nouă parolă pentru " + userName + ".";

    document.getElementById("new-password").value = "";
    document.getElementById("modal-change-password")?.classList.add("open");
};

document.getElementById("confirm-change-password")?.addEventListener("click", async function() {
    var newPwd = document.getElementById("new-password").value;
    if (newPwd.length < 6) return showToastMessage("Parola trebuie să aibă minim 6 caractere.", "error");

    try {
        var res = await window.authFetch('/users/' + AdminState.selectedUserId + '/password', {
            method: 'PUT',
            body: JSON.stringify({ password: newPwd })
        });

        if (res.ok) {
            showToastMessage("Parolă actualizată cu succes!");
            document.getElementById("modal-change-password").classList.remove("open");
        } else {
            var data = await res.json();
            showToastMessage(data.error || "Eroare la resetare.", "error");
        }
    } catch (e) {
        showToastMessage("Eroare de rețea.", "error");
    }
});

// Delete user popup
window.deleteUser = async function(userId, userName) {
    if (!confirm("Sunteți sigur că doriți să ștergeți contul lui " + userName + "?\nAceastă acțiune este ireversibilă.")) return;

    try {
        var res = await window.authFetch('/users/' + userId, { method: 'DELETE' });

        if (res.ok) {
            showToastMessage("Utilizator șters cu succes!");
            location.reload();
        } else {
            var data = await res.json();
            showToastMessage(data.error || "Eroare la ștergere.", "error");
        }
    } catch (e) {
        showToastMessage("Eroare de rețea.", "error");
    }
};
