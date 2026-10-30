import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Plus, Check, Loader2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { searchGames } from '../api';
import PageHeader from '../components/PageHeader';
import GameCover from '../components/GameCover';
import AddGameModal from '../components/AddGameModal';

export default function SearchPage() {
  const { library } = useLibrary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  // Ищем не на каждую букву, а через 400 мс после того, как пользователь перестал печатать
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const found = await searchGames(query);
        if (!cancelled) setResults(found);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // id записи в библиотеке по id игры — чтобы показать «Уже в библиотеке»
  const inLibrary = new Map(library.map((ug) => [ug.game_id, ug.id]));

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Поиск игр"
        subtitle="Найдите игру и добавьте её в свою библиотеку."

      />

      <div className="relative mb-8 max-w-xl">
        <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите название игры, например Witcher или Hades"
          className="input pl-12 py-3"
        />
        {loading && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 text-neutral-400 animate-spin" />}
      </div>

      {error && <p className="card p-4 mb-6 text-sm">{error}</p>}

      {!loading && results.length === 0 && !error && (
        <p className="text-neutral-500">Ничего не найдено. Попробуйте другое название.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((game) => {
          const libraryId = inLibrary.get(game.id);
          return (
            <div key={game.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <GameCover game={game} className="w-14 h-[72px] rounded shrink-0" small />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm line-clamp-1" title={game.title}>{game.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {[game.release_year, game.genres?.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{game.platforms?.join(' · ')}</p>
                </div>
              </div>
              {libraryId ? (
                <Link to={`/library/${libraryId}`} className="btn-outline px-2.5 shrink-0" title="Уже в библиотеке">
                  <Check className="w-5 h-5" />
                </Link>
              ) : (
                <button className="btn-primary px-2.5 shrink-0" onClick={() => setSelected(game)} title="Добавить в библиотеку">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selected && <AddGameModal game={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
