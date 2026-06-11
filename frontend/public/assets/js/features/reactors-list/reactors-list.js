/*
 * reactors-list.js — Reactor list page (reactors.html)
 * Global state for reactor list with filtering by
 * status tabs and search query. Uses
 * reactors-list-renderer.js for card generation.
 */

var allReactors = [];

document.addEventListener("DOMContentLoaded", async function() {
    document.documentElement.style.visibility = 'hidden';
    try {
        var meRes = await authFetch('/auth/me', { method: 'GET' });
        if (!meRes.ok) { window.location.href = 'login.html'; return; }
        var me = await meRes.json();
        if (me.role !== 'admin') { window.location.href = 'login.html'; return; }
    } catch (e) { window.location.href = 'login.html'; return; }
    document.documentElement.style.visibility = '';

    var gridContainer = document.getElementById("reactor-grid-container");
    gridContainer.innerHTML = '<p class="grid-placeholder-msg" style="color: var(--text-2);">Se încarcă datele...</p>';

    allReactors = await NuclearAPI.getReactors();
    renderReactors(allReactors);
    setupFilters();
});

function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\([0-9]+\)/g, "")
        .trim();
}

function setupFilters() {
    var filterTabs = document.querySelectorAll('.filter-tab');
    var searchInput = document.querySelector('.search-input');

    filterTabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            filterTabs.forEach(function(t) { t.classList.remove('active-tab'); });
            e.currentTarget.classList.add('active-tab');
            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            applyFilters();
        });
    }
}

function applyFilters() {
    var activeTab = document.querySelector('.filter-tab.active-tab');
    var searchInput = document.querySelector('.search-input');

    var rawFilterText = activeTab ? activeTab.textContent : 'toate';
    var statusFilter = normalizeString(rawFilterText);
    var searchQuery = normalizeString(searchInput ? searchInput.value : '');

    var filteredList = allReactors;

    if (statusFilter !== 'toate') {
        filteredList = filteredList.filter(function(reactor) {
            var currentStatus = normalizeString(reactor.status);
            return currentStatus.includes(statusFilter) || statusFilter.includes(currentStatus);
        });
    }

    if (searchQuery !== '') {
        filteredList = filteredList.filter(function(reactor) {
            var name = normalizeString(reactor.name);
            var location = normalizeString(reactor.location_name);
            var id = reactor.id ? reactor.id.toString() : '';
            return name.includes(searchQuery) || location.includes(searchQuery) || id.includes(searchQuery);
        });
    }

    renderReactors(filteredList);
}
