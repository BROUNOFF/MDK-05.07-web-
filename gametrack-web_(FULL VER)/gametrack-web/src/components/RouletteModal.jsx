import { useEffect, useRef, useState } from 'react';
import { Dices, Play } from 'lucide-react';
import Modal from './Modal';
import GameCover from './GameCover';
import { useLibrary } from '../context/LibraryContext';
import { pickRandom } from '../utils/stats';

// «Рулетка бэклога»: случайная игра из списка «В планах» с фильтрами
export default function RouletteModal({ onClose }) {
  const { library, updateGame } = useLibrary();
  const backlog = library.filter((ug) => ug.status === 'backlog');

  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [current, setCurrent] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const platforms = [...new Set(backlog.map((ug) => ug.platform).filter(Boolean))];
  const genres = [...new Set(backlog.flatMap((ug) => ug.game?.genres || []))];

  const pool = backlog.filter(
    (ug) => (!platform || ug.platform === platform) && (!genre || ug.game?.genres?.includes(genre)),
  );

  // Несколько раз быстро меняем игру, чтобы было похоже на вращение, потом останавливаемся
  function spin() {
    if (pool.length === 0) return;
    setSpinning(true);
    let ticks = 0;
    timer.current = setInterval(() => {
      setCurrent(pickRandom(pool));
      ticks++;
      if (ticks >= 12) {
        clearInterval(timer.current);
        setSpinning(false);
      }
    }, 90);
  }

  async function startPlaying() {
    const ok = await updateGame(current, { status: 'playing' }, `Удачной игры в «${current.game.title}»!`);
    if (ok) onClose();
  }

  return (
    <Modal title="Рулетка бэклога" onClose={onClose}>
      {backlog.length === 0 ? (
        <p className="text-sm text-neutral-500">В списке «В планах» пока нет игр — добавьте их через поиск.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">Любая платформа</option>
              {platforms.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">Любой жанр</option>
              {genres.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div className="h-44 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-5">
            {current ? (
              <div className="flex items-center gap-4 px-4">
                <GameCover game={current.game} className="w-24 h-32 rounded" small />
                <div>
                  <p className="font-bold text-lg leading-tight">{current.game.title}</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {current.platform || 'Платформа не указана'} · {current.game.genres?.join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">
                {pool.length > 0 ? `Игр в выборке: ${pool.length}` : 'Под фильтры ничего не подходит'}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={spin} disabled={spinning || pool.length === 0}>
              <Dices className="w-4 h-4" /> {current ? 'Ещё раз' : 'Крутить'}
            </button>
            <button className="btn-primary flex-1" onClick={startPlaying} disabled={!current || spinning}>
              <Play className="w-4 h-4" /> Начать играть
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
