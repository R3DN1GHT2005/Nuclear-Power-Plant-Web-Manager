/*
 * dom.js — Shared DOM manipulation helpers
 * Provides safe, reusable functions for common
 * DOM operations used across all pages. Eliminates
 * repeated inline patterns for modals, toasts,
 * event binding, and text setting.
 */

function setElText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
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

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function showToastMessage(msg, type) {
  if (type === undefined) type = 'success';
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type === 'error' ? 'error' : 'success') + ' show';
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function showToast(msg, type) {
  showToastMessage(msg, type);
}

function bindModalCloseButtons() {
  document.querySelectorAll('.btn-close-modal, .modal-overlay').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('btn-close-modal')) {
        document.querySelectorAll('.modal-overlay').forEach(function(m) { m.classList.remove('open'); });
      }
    });
  });
}

function bindEscapeKey() {
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show, .modal.show').forEach(function(m) {
        m.classList.remove('show');
        m.classList.remove('open');
      });
    }
  });
}

function createStatusPillHTML(status) {
  var st = statusMeta(status);
  return '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + st.color + ';margin-right:5px;vertical-align:middle;animation:statusPulse 2s ease-in-out infinite"></span>' + st.label;
}

function statusBadgeClass(status) {
  var s = (status || '').toLowerCase();
  if (s === 'activ') return 'pill-active';
  if (s === 'alerta') return 'pill-alert';
  if (s === 'mentenanta') return 'pill-maint';
  if (s === 'oprit') return 'pill-off';
  if (s === 'in constructie') return 'pill-blue';
  return 'pill-off';
}

function attachOverlayClick(modalElement) {
  if (modalElement) {
    modalElement.addEventListener('click', function(event) {
      if (event.target === modalElement) {
        closeModal(modalElement);
      }
    });
  }
}
