// Достижения считаются «на лету» из библиотеки, отдельная таблица не нужна.
// Чтобы добавить новое достижение, достаточно дописать объект в массив rules.

import { Footprints, Trophy, Swords, Timer, Library, Star, PiggyBank, Flame } from 'lucide-react';
import { costPerHour } from './stats';

const completed = (lib) => lib.filter((ug) => ug.status === 'completed');

const rules = [
  {
    id: 'first-game',
    title: 'Первый шаг',
    description: 'Добавить первую игру в библиотеку',
    icon: Footprints,
    target: 1,
    progress: (lib) => lib.length,
  },
  {
    id: 'backlog-cleaner',
    title: 'Разгребатель бэклога',
    description: 'Пройти 10 игр',
    icon: Trophy,
    target: 10,
    progress: (lib) => completed(lib).length,
  },
  {
    id: 'rpg-lover',
    title: 'Ценитель RPG',
    description: 'Пройти 5 игр жанра RPG',
    icon: Swords,
    target: 5,
    progress: (lib) => completed(lib).filter((ug) => ug.game?.genres?.includes('RPG')).length,
  },
  {
    id: 'marathon',
    title: 'Марафонщик',
    description: 'Наиграть 500 часов суммарно',
    icon: Timer,
    target: 500,
    progress: (lib) => Math.round(lib.reduce((s, ug) => s + (ug.playtime_hours || 0), 0)),
  },
  {
    id: 'collector',
    title: 'Коллекционер',
    description: 'Собрать 25 игр в библиотеке',
    icon: Library,
    target: 25,
    progress: (lib) => lib.length,
  },
  {
    id: 'critic',
    title: 'Критик',
    description: 'Поставить оценку 10 играм',
    icon: Star,
    target: 10,
    progress: (lib) => lib.filter((ug) => ug.rating).length,
  },
  {
    id: 'thrifty',
    title: 'Экономист',
    description: 'Найти игру дешевле 20 ₽ за час',
    icon: PiggyBank,
    target: 1,
    progress: (lib) => lib.filter((ug) => (costPerHour(ug.price, ug.playtime_hours) ?? Infinity) < 20).length,
  },
  {
    id: 'streak',
    title: 'В ритме',
    description: 'Играть 5 дней подряд',
    icon: Flame,
    target: 5,
    progress: (lib, sessions) => longestStreak(sessions),
  },
];

// Самая длинная серия дней подряд с игровыми сессиями
export function longestStreak(sessions) {
  const days = [...new Set(sessions.filter((s) => s.hours > 0).map((s) => s.played_on))].sort();
  let best = 0;
  let current = 0;
  let prev = null;
  for (const day of days) {
    const date = new Date(day);
    current = prev && (date - prev) / 86400000 === 1 ? current + 1 : 1;
    best = Math.max(best, current);
    prev = date;
  }
  return best;
}

export function getAchievements(library, sessions) {
  return rules.map((rule) => {
    const value = rule.progress(library, sessions);
    return { ...rule, value: Math.min(value, rule.target), unlocked: value >= rule.target };
  });
}
