/*
 * frontend/public/assets/js/utils/helpers.js
 * Pure formatting utilities — date/time formatters (Romanian locale),
 * relative timestamps (timeAgo), HTML escaping, safe number coercion,
 * and API error extraction. Shared across all pages.
 */
function formatTime(d) {
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

function formatSmallTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return hours + ':' + minutes + ' - ' + day + '.' + month;
}

function formatTableDate(dateStr) {
  if (!dateStr) return '<span style="color: #A0AEC0;">—</span>';
  const d = new Date(dateStr.replace(' ', 'T'));
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return day + '.' + month + '.' + year + ' <br> <span style="color: #8A96A8; font-size: 10px;">ora ' + hours + ':' + mins + '</span>';
}

function formatExactTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return hours + ':' + minutes + ' \u2014 ' + day + '.' + month;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const normalized = dateStr.replace(' ', 'T');
  const diff = Math.floor((Date.now() - new Date(normalized)) / 1000);
  if (diff < 60) return 'acum ' + diff + 's';
  if (diff < 3600) return 'acum ' + Math.floor(diff / 60) + 'min';
  if (diff < 86400) return 'acum ' + Math.floor(diff / 3600) + 'h';
  return 'acum ' + Math.floor(diff / 86400) + 'z';
}

function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeNumber(value, fallback) {
  if (fallback === undefined) fallback = 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeAverage(values) {
  const filtered = values.map(function(v) { return toNumber(v); }).filter(function(v) { return Number.isFinite(v); });
  if (!filtered.length) return 0;
  return filtered.reduce(function(sum, v) { return sum + v; }, 0) / filtered.length;
}

function formatDays(days) {
  if (days === 1) return '24h';
  if (days === 7) return '7 zile';
  if (days === 30) return '30 zile';
  if (days === 90) return '90 zile';
  if (days === 365) return '1 an';
  return days + ' zile';
}

function formatPercent(value, digits) {
  if (digits === undefined) digits = 1;
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(toNumber(value));
}

function formatNumber(value, digits) {
  if (digits === undefined) digits = 1;
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(toNumber(value));
}

function formatPeriodLabel(days) {
  if (days === 1) return 'ultimele 24h';
  if (days === 7) return 'ultimele 7 zile';
  if (days === 30) return 'ultimele 30 zile';
  if (days === 90) return 'ultimele 90 zile';
  if (days === 365) return 'ultimul an';
  return 'ultimele ' + days + ' zile';
}

async function safeJson(res) {
  if (!res || !res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

function unwrapSettled(result, fallback) {
  if (!result || result.status !== 'fulfilled') return fallback;
  return result.value !== null && result.value !== undefined ? result.value : fallback;
}

function getReactorShortLabel(name, reactorId) {
  if (name) return String(name).trim();
  return reactorId ? 'Reactor ' + reactorId : 'Reactor';
}

function filterByPeriod(items, dateGetter, days) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return (items || []).filter(function(item) {
    const date = parseDateValue(dateGetter(item));
    return date && date.getTime() >= cutoff;
  });
}

function formatPower(value) {
  return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(safeNumber(value)) + ' MW';
}
