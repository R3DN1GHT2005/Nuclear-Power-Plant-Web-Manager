/*
 * frontend/public/assets/js/utils/status.js
 * Centralised reactor-status logic — normalises Romanian-accented
 * status strings, maps statuses to CSS classes (statusMeta), and
 * provides a shared STATUS_OPTIONS array for UI dropdowns.
 */
function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeStatus(value) {
  var normalized = normalizeText(value);
  if (normalized.includes('activ')) return 'activ';
  if (normalized.includes('mentenan')) return 'mentenanta';
  if (normalized.includes('in construct')) return 'constructie';
  if (normalized.includes('alert') || normalized.includes('avarie')) return 'alerta';
  if (normalized.includes('oprit') || normalized.includes('stop')) return 'oprit';
  return normalized || 'other';
}

function normalizeStatusChoice(status) {
  var normalized = normalizeStatus(status);
  if (normalized === 'activ') return 'Activ';
  if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') return 'Mentenanta';
  if (normalized === 'oprit') return 'Oprit';
  if (normalized === 'alerta' || normalized === 'critic' || normalized === 'critica' || normalized === 'stare critica') return 'Alerta';
  if (normalized === 'in constructie' || normalized === 'constructie') return 'In Constructie';
  return 'Activ';
}

function getStatusLabel(status) {
  var normalized = normalizeStatusChoice(status);
  var options = [
    { value: 'Activ', label: 'Activ' },
    { value: 'Mentenanta', label: 'Mentenanță' },
    { value: 'Oprit', label: 'Oprit' },
    { value: 'Alerta', label: 'Alertă' },
    { value: 'In Constructie', label: 'În construcție' }
  ];
  var found = options.find(function(item) { return item.value === normalized; });
  return found ? found.label : 'Activ';
}

var STATUS_OPTIONS = [
  { value: 'Activ', label: 'Activ' },
  { value: 'Mentenanta', label: 'Mentenanță' },
  { value: 'Oprit', label: 'Oprit' },
  { value: 'Alerta', label: 'Alertă' },
  { value: 'In Constructie', label: 'În construcție' }
];

function statusMeta(s) {
  var map = {
    'activ':          { color: 'var(--green)', label: 'Activ' },
    'mentenanta':     { color: 'var(--amber)', label: 'Mentenanță' },
    'oprit':          { color: 'var(--text-3)', label: 'Oprit' },
    'alerta':         { color: 'var(--red)',   label: 'Alertă' },
    'in constructie': { color: 'var(--blue)',  label: 'În construcție' }
  };
  var key = (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return map[key] || { color: 'var(--text-2)', label: s || '—' };
}

function getStatusPillClass(status) {
  if (!status) return 'pill-off';
  var s = normalizeText(status);
  if (s.includes('activ') || s.includes('operaț')) return 'pill-active';
  if (s.includes('alert') || s.includes('avarie')) return 'pill-alert';
  if (s.includes('mentenant')) return 'pill-maint';
  if (s.includes('constructie')) return 'pill-blue';
  return 'pill-off';
}

function getBarClass(val) {
  if (val >= 75) return 'bf-green';
  if (val >= 40) return 'bf-amber';
  return 'bf-red';
}

function statusVisual(status) {
  var normalized = normalizeStatus(status);
  if (normalized === 'oprit') return { color: '#6b7280', badgeClass: 'badge-gray' };
  if (normalized === 'activ') return { color: '#16a34a', badgeClass: 'badge-green' };
  if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') return { color: '#f59e0b', badgeClass: 'badge-yellow' };
  if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') return { color: '#dc2626', badgeClass: 'badge-red' };
  return { color: '#2563eb', badgeClass: 'badge-blue' };
}

function statusCircleClass(status) {
  var normalized = normalizeStatus(status);
  if (normalized === 'oprit') return 'reactor-circle reactor-circle-gray';
  if (normalized === 'activ') return 'reactor-circle reactor-circle-green';
  if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') return 'reactor-circle reactor-circle-yellow';
  if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') return 'reactor-circle reactor-circle-red reactor-circle-pulse';
  return 'reactor-circle reactor-circle-blue';
}
function getStatusStyle(status, efficiency) {
  var normalized = normalizeStatus(status);
  
  if (normalized === 'alerta') return { textClass: 'text-red', barClass: 'bg-red' };
  if (normalized === 'mentenanta') return { textClass: 'text-amber', barClass: 'bg-amber' };
  if (normalized === 'oprit') return { textClass: 'text-muted', barClass: 'bg-gray' };
  
  if (efficiency >= 85) return { textClass: 'text-green', barClass: 'bg-green' };
  if (efficiency >= 70) return { textClass: 'text-amber', barClass: 'bg-amber' };
  return { textClass: 'text-red', barClass: 'bg-red' };
}

function getStatusBucket(status) {
  var normalized = normalizeStatus(status);
  
  if (normalized === 'activ') return 'activ';
  if (normalized === 'mentenanta' || normalized === 'mentenanta planificata') return 'mentenanta';
  if (normalized === 'in constructie' || normalized === 'constructie') return 'constructie';
  if (normalized === 'oprit') return 'oprit';
  if (normalized === 'alerta' || normalized === 'stare critica' || normalized === 'critica' || normalized === 'critic') return 'alerta';
  return 'other';
}

function getRowConfig(status) {
  var normalized = normalizeStatus(status);
  
  if (normalized === 'alerta') return { rowClass: 'row-critical', textClass: 'text-red' };
  if (normalized === 'mentenanta') return { rowClass: 'row-maint', textClass: 'text-amber' };
  if (normalized === 'oprit') return { rowClass: 'row-off', textClass: 'text-muted' };
  return { rowClass: '', textClass: 'text-green' };
}