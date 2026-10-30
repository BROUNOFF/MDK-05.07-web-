// Сделать я просто скопировал с ТЗ данные о том как считаются переменные

// Стоимость часа развлечения: C = P / H
export function costPerHour(price, hours) {
  if (!price || !hours || hours <= 0) return null;
  return price / hours;
}

// Процент выполнения цели на год: P = min(100, N_пройдено / N_цель * 100)
export function goalPercent(completed, target) {
  if (!target) return 0;
  return Math.min(100, (completed / target) * 100);
}

// Сколько игр пройдено в указанном году
export function completedInYear(library, year) {
  return library.filter(
    (ug) => ug.status === 'completed' && ug.completed_at && new Date(ug.completed_at).getFullYear() === year,
  ).length;
}

export function totalHours(library) {
  return library.reduce((sum, ug) => sum + (ug.playtime_hours || 0), 0);
} 

// Доля жанра: D = H_жанра / H_всего * 100.
// Часы игры делим поровну между её жанрами
export function genreShare(library) {
  const hoursByGenre = {};
  let total = 0;
  for (const ug of library) {
    const genres = ug.game?.genres?.length ? ug.game.genres : ['Без жанра'];
    const hours = ug.playtime_hours || 0;
    if (hours <= 0) continue;
    total += hours;
    for (const g of genres) {
      hoursByGenre[g] = (hoursByGenre[g] || 0) + hours / genres.length;
    }
  }
  return Object.entries(hoursByGenre)
    .map(([genre, hours]) => ({ label: genre, hours, percent: (hours / total) * 100 }))
    .sort((a, b) => b.hours - a.hours);
}

// Распределение часов по платформам
export function platformShare(library) {
  const map = {};
  let total = 0;
  for (const ug of library) {
    const hours = ug.playtime_hours || 0;
    if (hours <= 0) continue;
    const key = ug.platform || 'Не указана';
    map[key] = (map[key] || 0) + hours;
    total += hours;
  }
  return Object.entries(map)
    .map(([label, hours]) => ({ label, hours, percent: (hours / total) * 100 }))
    .sort((a, b) => b.hours - a.hours);
}

// Рулетка бэклога: Index = floor(random() * N)
export function pickRandom(list) {
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
