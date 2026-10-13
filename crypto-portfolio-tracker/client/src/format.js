export function money(value, currency = 'usd') {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  const max = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: Math.min(2, max),
    maximumFractionDigits: max,
  }).format(value);
}

export function compactMoney(value, currency = 'usd') {
  if (value == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function pct(value, { sign = true } = {}) {
  if (value == null || Number.isNaN(value)) return '—';
  const s = sign && value > 0 ? '+' : '';
  return `${s}${value.toFixed(2)}%`;
}

export function amount(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(value);
}

export const tone = (value) => (value == null || value === 0 ? '' : value > 0 ? 'pos' : 'neg');

export const shortAddress = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

export function formatDateTime(ms) {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAxisTime(ms, days) {
  const d = new Date(ms);
  return days <= 2
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
