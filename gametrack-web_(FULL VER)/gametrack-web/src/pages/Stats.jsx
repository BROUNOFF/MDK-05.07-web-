import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import PageHeader from '../components/PageHeader';
import Heatmap from '../components/Heatmap';
import { genreShare, platformShare, costPerHour } from '../utils/stats';
import { getAchievements } from '../utils/achievements';

// Горизонтальные полоски вместо круговой диаграммы в чёрно-белом стиле
function BarList({ items, limit = 6 }) {
  if (items.length === 0) return <p className="text-sm text-neutral-500">Пока нет наигранных часов.</p>;

  let rows = items;
  if (items.length > limit) {
    const rest = items.slice(limit - 1);
    rows = [
      ...items.slice(0, limit - 1),
      {
        label: 'Другие',
        hours: rest.reduce((s, x) => s + x.hours, 0),
        percent: rest.reduce((s, x) => s + x.percent, 0),
      },
    ];
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between text-sm mb-1">
            <span>{row.label}</span>
            <span className="font-mono text-neutral-500">
              {Math.round(row.hours)} ч. · {Math.round(row.percent)}%
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full" style={{ width: `${row.percent}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Stats() {
  const { library, sessions, loading } = useLibrary();
  if (loading) return <p className="text-neutral-500">Загрузка...</p>;

  const achievements = getAchievements(library, sessions);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  // самые выгодные покупки — с минимальной стоимостью часа
  const bestValue = library
    .map((ug) => ({ ug, value: costPerHour(ug.price, ug.playtime_hours) }))
    .filter((x) => x.value !== null)
    .sort((a, b) => a.value - b.value)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Статистика" subtitle="Аналитика игрового времени, активность и достижения." />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <section className="card p-6">
          <h3 className="font-bold mb-5">Распределение времени по жанрам</h3>
          <BarList items={genreShare(library)} />
        </section>
        <section className="card p-6">
          <h3 className="font-bold mb-5">Распределение времени по платформам</h3>
          <BarList items={platformShare(library)} />
        </section>
      </div>

      <section className="card p-6 mb-6">
        <h3 className="font-bold mb-5">Карта игровой активности</h3>
        <Heatmap sessions={sessions} />
      </section>

      <section className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">Достижения</h3>
          <span className="text-xs font-mono bg-neutral-100 border border-neutral-200 rounded px-2.5 py-1">
            {unlocked} / {achievements.length}
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map(({ id, title, description, icon: Icon, value, target, unlocked: done }) => (
            <div key={id} className={`rounded-lg border p-4 ${done ? 'border-black' : 'border-neutral-200 text-neutral-400'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${done ? 'bg-black text-white' : 'bg-neutral-100'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className={`font-bold text-sm ${done ? 'text-black' : ''}`}>{title}</p>
              <p className="text-xs mt-0.5">{description}</p>
              <div className="h-1.5 bg-neutral-100 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${done ? 'bg-black' : 'bg-neutral-400'}`} style={{ width: `${(value / target) * 100}%` }} />
              </div>
              <p className="text-[11px] font-mono mt-1">{value} / {target}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="font-bold mb-1">Самые выгодные покупки</h3>
        <p className="text-sm text-neutral-500 mb-4">Стоимость часа = цена игры / наигранные часы.</p>
        {bestValue.length === 0 ? (
          <p className="text-sm text-neutral-500">Укажите цену и часы в карточках игр, чтобы увидеть расчёт.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <th className="py-2 font-medium">Игра</th>
                <th className="py-2 font-medium text-right">Цена</th>
                <th className="py-2 font-medium text-right">Часы</th>
                <th className="py-2 font-medium text-right">₽ / час</th>
              </tr>
            </thead>
            <tbody>
              {bestValue.map(({ ug, value }) => (
                <tr key={ug.id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2.5"><Link to={`/library/${ug.id}`} className="hover:underline">{ug.game.title}</Link></td>
                  <td className="py-2.5 text-right font-mono">{ug.price} ₽</td>
                  <td className="py-2.5 text-right font-mono">{ug.playtime_hours}</td>
                  <td className="py-2.5 text-right font-mono font-bold">{value.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
