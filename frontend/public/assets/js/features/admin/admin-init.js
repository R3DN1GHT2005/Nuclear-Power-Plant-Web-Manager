/*
 * admin-init.js — Admin accounts page bootstrap
 * Global state singleton + initial data loading.
 * Provides AdminState used by admin-users.js
 * and admin-assignments.js.
 */

var AdminState = {
    users: [],
    reactors: [],
    selectedUserId: null
};

document.addEventListener("DOMContentLoaded", async function() {
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
