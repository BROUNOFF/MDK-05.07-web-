// Дата в формате YYYY-MM-DD по местному времени (toISOString дал бы UTC и мог сдвинуть день)
export function toLocalDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Короткий вариант: 23.10.2026
export function formatShortDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU');
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
