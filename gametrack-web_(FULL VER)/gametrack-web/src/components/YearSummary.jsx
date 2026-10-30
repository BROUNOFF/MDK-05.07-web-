import { Sparkles } from 'lucide-react';
import { genreShare } from '../utils/stats';
import { longestStreak } from '../utils/achievements';

// «Итоги года»:
export default function YearSummary({ library, sessions, year }) {
  const yearSessions = sessions.filter((s) => s.played_on.startsWith(String(year)) && s.hours > 0);
  const hours = yearSessions.reduce((sum, s) => sum + s.hours, 0);
  const days = new Set(yearSessions.map((s) => s.played_on)).size;

  const completed = library.filter(
    (ug) => ug.status === 'completed' && ug.completed_at && new Date(ug.completed_at).getFullYear() === year,
  );

  // игра года: самая высокая оценка среди пройденных, при равенстве — где больше часов
  const gameOfYear = [...completed].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0) || b.playtime_hours - a.playtime_hours,
  )[0];

  const topGenre = genreShare(completed.length ? completed : library)[0];

  const tiles = [
    { label: 'Пройдено игр', value: completed.length },
    { label: 'Часов за год', value: hours },
    { label: 'Игровых дней', value: days },
    { label: 'Лучшая серия', value: `${longestStreak(yearSessions)} дн.` },
    { label: 'Любимый жанр', value: topGenre?.label || '—' },
    { label: 'Игра года', value: gameOfYear?.game.title || '—' },
  ];

  return (
    <div className="card p-6">
      <h4 className="font-bold flex items-center mb-4">
        <Sparkles className="w-5 h-5 mr-2" /> Итоги {year} года
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2.5 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{t.label}</p>
            <p className="font-bold mt-0.5 truncate" title={String(t.value)}>{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
