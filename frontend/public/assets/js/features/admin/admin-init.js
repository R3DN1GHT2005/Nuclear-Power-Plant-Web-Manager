/*
 * frontend/public/assets/js/features/admin/admin-init.js
 * Admin accounts page bootstrap — defines AdminState singleton
 * (users, reactors, selectedUserId), authenticates as admin,
 * fetches users and reactors, and triggers rendering of tables,
 * assignments, and the reactor select dropdown.
 */
var AdminState = {
    users: [],
    reactors: [],
    selectedUserId: null
};

document.addEventListener("DOMContentLoaded", async function() {
    document.documentElement.style.visibility = 'hidden';

    try {
        var meRes = await window.authFetch('/auth/me', { method: 'GET' });
        if (!meRes.ok) { window.location.href = 'login.html'; return; }
        var me = await meRes.json();
        if (me.role !== 'admin') { window.location.href = 'login.html'; return; }
    } catch (e) { window.location.href = 'login.html'; return; }
    document.documentElement.style.visibility = '';

    bindModalCloseButtons();

    try {
        var usersRes = await window.authFetch('/users');
        if (usersRes.ok) {
            AdminState.users = await usersRes.json();
        } else {
            showToastMessage("Nu aveți permisiunea de a vizualiza utilizatorii.", "error");
        }

        AdminState.reactors = await window.NuclearAPI.getReactors();

        renderUsersTable();
        populateReactorSelect();
        renderReactorAssignments();
    } catch (err) {
        console.error("Eroare la încărcare:", err);
        showToastMessage("Eroare de rețea la încărcarea datelor.", "error");
    }
});
