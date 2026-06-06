document.addEventListener("DOMContentLoaded", async () => {
    // ── STARE GLOBALĂ ──
    const state = {
        users: [],
        reactors: [],
        selectedUserId: null
    };

    // ── FUNCȚIE TOAST ──
    function showToast(msg, type = "success") {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.className = `toast ${type === 'error' ? 'error' : 'success'} show`;
        setTimeout(() => t.classList.remove("show"), 3000);
    }

    // ── 1. ÎNCĂRCARE DATE INIȚIALE ──
    async function loadData() {
        try {
            const usersRes = await window.authFetch('/users');
            if (usersRes.ok) {
                state.users = await usersRes.json();
            } else {
                showToast("Nu aveți permisiunea de a vizualiza utilizatorii.", "error");
            }

            state.reactors = await window.NuclearAPI.getReactors();
            
            // Randăm interfața după ce avem ambele seturi de date
            renderUsersTable();
            populateReactorSelect();
            renderReactorAssignments(); // Funcția nouă
        } catch (err) {
            console.error("Eroare la încărcare:", err);
            showToast("Eroare de rețea la încărcarea datelor.", "error");
        }
    }

    // ── 2. RANDARE TABEL UTILIZATORI ──
    function renderUsersTable() {
        const tbody = document.getElementById("users-table-body");
        if (!tbody) return;

        if (!state.users.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="history-empty">Niciun utilizator găsit.</td></tr>';
            return;
        }

        tbody.innerHTML = state.users.map(user => {
            // Badge rol
            let roleBadge;
            if (user.role === 'admin') {
                roleBadge = '<span class="badge badge-admin">Administrator</span>';
            } else if (user.role === 'manager') {
                roleBadge = '<span class="badge badge-manager">Manager</span>';
            } else {
                roleBadge = '<span class="badge badge-user">Tehnician</span>';
            }

            // Reactor asignat
            let assignedReactor = '<span style="color:var(--text-3);font-size:12px;">— Neasignat</span>';
            if (user.reactor_id) {
                const reactorName = state.reactors.find(r => r.id === user.reactor_id)?.name || `Reactor #${user.reactor_id}`;
                assignedReactor = `
                    <div class="assigned-reactor-name" style="font-weight: 500;">${reactorName}</div>
                    ${user.intervention_role ? `<div class="assigned-reactor-role" style="font-size: 0.8rem; color: var(--text-3);">${user.intervention_role}</div>` : ''}
                `;
            }

            // Dezactivăm butonul de asignare pentru Admini
            const assignBtn = user.role === 'admin'
                ? `<button class="btn-sm" disabled style="opacity:0.5; cursor:not-allowed;" title="Adminii au acces global. Nu necesită asignare.">Asignează</button>`
                : `<button class="btn-sm" onclick="openAssignModal(${user.id})">Asignează</button>`;

            return `
            <tr>
                <td style="color:var(--text-3);font-size:12px;font-family:'DM Mono',monospace;">#${user.id}</td>
                <td style="font-weight:600;">${user.name}</td>
                <td style="color:var(--text-2);">${user.email}</td>
                <td>${roleBadge}</td>
                <td>${assignedReactor}</td>
                <td class="action-cell">
                    ${assignBtn}
                    <button class="btn-sm" onclick="openPasswordModal(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
                        Parolă
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteUser(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
                        Șterge
                    </button>
                </td>
            </tr>`;
        }).join("");
    }

    // ── 3. RANDARE ECHIPE PE REACTOARE ──
    function renderReactorAssignments() {
        const container = document.getElementById("reactor-assignments-container");
        if (!container) return;

        if (!state.reactors.length) {
            container.innerHTML = '<p class="history-empty">Niciun reactor disponibil.</p>';
            return;
        }

        container.innerHTML = state.reactors.map(reactor => {
            const assignedUsers = state.users.filter(u => u.reactor_id === reactor.id);
            
            const usersHtml = assignedUsers.length > 0 
                ? assignedUsers.map(u => `
                    <div class="user-item">
                        <div>
                            <div class="user-info-name">${u.name}</div>
                            <div class="user-info-email">${u.email}</div>
                        </div>
                        <span class="badge badge-user">${u.intervention_role || 'Tehnician'}</span>
                    </div>`).join('')
                : `<p style="color: #B0BAC9; font-size: 12px; margin-top: 8px;">Niciun operator asignat.</p>`;

            return `
            <div class="reactor-card">
                <div class="reactor-header">
                    <div>
                        <div class="reactor-name">${reactor.name}</div>
                        <div class="reactor-loc">${reactor.location_name}</div>
                    </div>
                    <span class="badge" style="background: #F1F5F9;">${assignedUsers.length} Membri</span>
                </div>
                ${usersHtml}
            </div>`;
        }).join('');
    }
    
    // ── 4. POPULARE DROPDOWN REACTOARE ──
    function populateReactorSelect() {
        const select = document.getElementById("assign-reactor-select");
        if (!select) return;

        select.innerHTML = '<option value="">— Fără asignare (Elimină) —</option>';
        state.reactors.forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.name} (${r.location_name})</option>`;
        });
    }

    // ── ÎNCHIDERE MODALE ──
    document.querySelectorAll('.btn-close-modal, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-close-modal')) {
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => e.stopPropagation());
    });

    // ── A. CREARE CONT NOU ──
    document.getElementById("btn-create-user")?.addEventListener("click", () => {
        // Golim câmpurile noi la deschiderea modalului
        document.getElementById("new-user-firstname").value = "";
        document.getElementById("new-user-lastname").value = "";
        document.getElementById("new-user-email").value = "";
        document.getElementById("new-user-password").value = "";
        document.getElementById("modal-create-user")?.classList.add("open");
    });

    document.getElementById("confirm-create-user")?.addEventListener("click", async () => {
        const firstName = document.getElementById("new-user-firstname").value.trim();
        const lastName = document.getElementById("new-user-lastname").value.trim();

        // Trimitem `first_name` și `last_name` exact cum le cere sistemul
        const payload = {
            first_name: firstName,
            last_name: lastName,
            email: document.getElementById("new-user-email").value.trim(),
            password: document.getElementById("new-user-password").value,
            role: document.getElementById("new-user-role").value
        };

        if (!firstName || !lastName || !payload.email || !payload.password) {
            return showToast("Toate câmpurile sunt obligatorii!", "error");
        }

        try {
            const res = await window.authFetch('/users', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("Utilizator creat cu succes!");
                document.getElementById("modal-create-user").classList.remove("open");
                loadData();
            } else {
                const data = await res.json();
                showToast(data.error || "Eroare la creare.", "error");
            }
        } catch (e) { showToast("Eroare de rețea.", "error"); }
    });

    // ── B. SCHIMBARE PAROLĂ ──
    window.openPasswordModal = (userId, userName) => {
        state.selectedUserId = userId;
        const subEl = document.getElementById("pwd-modal-sub");
        if (subEl) subEl.textContent = `Setați o nouă parolă pentru ${userName}.`;

        document.getElementById("new-password").value = "";
        document.getElementById("modal-change-password")?.classList.add("open");
    };

    document.getElementById("confirm-change-password")?.addEventListener("click", async () => {
        const newPwd = document.getElementById("new-password").value;
        if (newPwd.length < 6) return showToast("Parola trebuie să aibă minim 6 caractere.", "error");

        try {
            const res = await window.authFetch(`/users/${state.selectedUserId}/password`, {
                method: 'PUT',
                body: JSON.stringify({ password: newPwd })
            });

            if (res.ok) {
                showToast("Parolă actualizată cu succes!");
                document.getElementById("modal-change-password").classList.remove("open");
            } else {
                const data = await res.json();
                showToast(data.error || "Eroare la resetare.", "error");
            }
        } catch (e) { showToast("Eroare de rețea.", "error"); }
    });

    // ── C. ASIGNARE REACTOR ──
    window.openAssignModal = (userId) => {
        state.selectedUserId = userId;
        const user = state.users.find(u => u.id === userId);

        const selectEl = document.getElementById("assign-reactor-select");
        if (selectEl) selectEl.value = user.reactor_id || "";

        document.getElementById("modal-assign-reactor")?.classList.add("open");
    };

    document.getElementById("confirm-assign-reactor")?.addEventListener("click", async () => {
        const reactorId = document.getElementById("assign-reactor-select").value;

        try {
            const res = await window.authFetch(`/users/${state.selectedUserId}/reactor`, {
                method: 'PUT',
                body: JSON.stringify({ reactor_id: reactorId ? parseInt(reactorId) : null })
            });

            if (res.ok) {
                showToast("Asignare actualizată cu succes!");
                document.getElementById("modal-assign-reactor").classList.remove("open");
                loadData();
            } else {
                const data = await res.json();
                showToast(data.error || "Eroare la asignare.", "error");
            }
        } catch (e) { showToast("Eroare de rețea.", "error"); }
    });

    // ── D. ȘTERGERE UTILIZATOR ──
    window.deleteUser = async (userId, userName) => {
        if (!confirm(`Sunteți sigur că doriți să ștergeți contul lui ${userName}?\nAceastă acțiune este ireversibilă.`)) return;

        try {
            const res = await window.authFetch(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast("Utilizator șters cu succes!");
                loadData();
            } else {
                const data = await res.json();
                showToast(data.error || "Eroare la ștergere.", "error");
            }
        } catch (e) { showToast("Eroare de rețea.", "error"); }
    };

    // Init
    loadData();
});