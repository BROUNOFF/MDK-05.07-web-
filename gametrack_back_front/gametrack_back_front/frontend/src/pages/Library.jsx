import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import PageHeader from '../components/PageHeader';
import GameCover from '../components/GameCover';
import StatusBadge from '../components/StatusBadge';
import { STATUSES, STATUS_KEYS } from '../utils/constants';

const sorters = {
  updated: { label: 'Недавно изменённые', fn: (a, b) => b.updated_at.localeCompare(a.updated_at) },
  title: { label: 'По названию', fn: (a, b) => a.game.title.localeCompare(b.game.title) },
  rating: { label: 'По оценке', fn: (a, b) => (b.rating || 0) - (a.rating || 0) },
  hours: { label: 'По наигранным часам', fn: (a, b) => b.playtime_hours - a.playtime_hours },
};

export default function Library() {
  const { library, loading } = useLibrary();
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('');
  const [sort, setSort] = useState('updated');

  const platforms = [...new Set(library.map((ug) => ug.platform).filter(Boolean))].sort();

  const games = library
    .filter((ug) => status === 'all' || ug.status === status)
    .filter((ug) => !platform || ug.platform === platform)
    .filter((ug) => ug.game.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort(sorters[sort].fn);

  const countOf = (key) => (key === 'all' ? library.length : library.filter((ug) => ug.status === key).length);
  const tabs = [['all', 'Все'], ...STATUS_KEYS.map((k) => [k, STATUSES[k]])];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Моя библиотека" subtitle="Каталог игр и управление статусами прохождения.">
        <div className="flex flex-wrap bg-white rounded-lg border border-neutral-200 p-1">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                status === key ? 'bg-black text-white' : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
              }`}
            >
              {label} <span className="opacity-50 font-mono text-xs">{countOf(key)}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Поиск, фильтр и сортировка */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input
            className="input pl-9"
            placeholder="Поиск по названию..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input md:w-48" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">Все платформы</option>
          {platforms.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="input md:w-56" value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(sorters).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-neutral-500">Загрузка...</p>
      ) : games.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          {library.length === 0 ? (
            <>Библиотека пуста. <Link to="/search" className="underline text-black">Найдите первую игру</Link></>
          ) : (
            'По выбранным условиям ничего не найдено.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {games.map((ug) => (
            <Link
              key={ug.id}
              to={`/library/${ug.id}`}
              className="card overflow-hidden flex flex-col hover:border-black transition-colors group"
            >
              <div className="relative">
                <GameCover game={ug.game} className="w-full h-48" />
                {ug.is_favorite && (
                  <Star className="absolute top-2 right-2 w-5 h-5 fill-white text-white drop-shadow" />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:underline" title={ug.game.title}>{ug.game.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
                    {ug.platform || '—'}
                    {ug.rating ? <span className="normal-case"> · {ug.rating}/10</span> : null}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <StatusBadge status={ug.status} />
                  <span className="text-xs font-mono text-neutral-600 whitespace-nowrap">{ug.playtime_hours} ч.</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
