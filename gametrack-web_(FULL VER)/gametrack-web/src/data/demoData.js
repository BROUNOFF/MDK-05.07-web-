// Демо-библиотека: чтобы на защите все экраны сразу были заполнены.
// Даты считаются от текущего дня, поэтому карта активности всегда «живая».

import { catalog } from './catalog';
import { toLocalDate } from '../utils/date';

const byTitle = (title) => catalog.find((g) => g.title === title);

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// [название, статус, платформа, оценка, цена, часы, пройдено N дней назад, в избранном]
const rows = [
  ['The Witcher 3: Wild Hunt', 'completed', 'PC', 10, 1199, 120, 230, true],
  ['Cyberpunk 2077', 'playing', 'PC', 8, 1999, 45, null, false],
  ['Elden Ring', 'backlog', 'PS5', null, 3999, 0, null, false],
  ['Hollow Knight', 'completed', 'Nintendo Switch', 9, 499, 38, 160, true],
  ['Hollow Knight: Silksong', 'backlog', 'PS5', null, null, 0, null, false],
  ['Final Fantasy VII Rebirth', 'playing', 'PS5', 10, 5999, 62, null, true],
  ["Baldur's Gate 3", 'completed', 'PC', 10, 1999, 140, 90, true],
  ['Hades', 'completed', 'Nintendo Switch', 9, 899, 52, 60, false],
  ['Stardew Valley', 'dropped', 'PC', 7, 349, 21, null, false],
  ['Celeste', 'completed', 'PC', 8, 469, 14, 30, false],
  ['Disco Elysium', 'backlog', 'PC', null, 499, 0, null, false],
  ['Frostpunk', 'backlog', 'PC', null, null, 0, null, false],
  ['Ghost of Tsushima', 'completed', 'PS5', 9, 2999, 55, 12, true],
  ['Persona 5 Royal', 'backlog', 'PS5', null, null, 0, null, false],
];

export const demoLibrary = rows.map(([title, status, platform, rating, price, hours, doneAgo, fav]) => ({
  game: byTitle(title),
  status,
  platform,
  rating,
  price,
  playtime_hours: hours,
  completed_at: doneAgo === null ? null : daysAgo(doneAgo),
  is_favorite: fav,
}));

export const demoGoal = 12;

// Простой генератор псевдослучайных чисел, чтобы сессии были одинаковыми при каждом запуске
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Сессии за последние 4 месяца: только по играм, которые в тот день ещё проходились
export function makeDemoSessions(userGames) {
  const rnd = seeded(42);
  const sessions = [];

  for (let day = 120; day >= 0; day--) {
    if (rnd() > 0.45) continue; // примерно в половину дней не играли
    const date = new Date(daysAgo(day));
    const candidates = userGames.filter(
      (ug) => ug.status === 'playing' || (ug.status === 'completed' && new Date(ug.completed_at) >= date),
    );
    if (candidates.length === 0) continue;
    const ug = candidates[Math.floor(rnd() * candidates.length)];
    sessions.push({
      user_game_id: ug.id,
      played_on: toLocalDate(date),
      hours: 1 + Math.floor(rnd() * 4),
    });
  }
  return sessions;
}
