import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Clock, ListChecks, Dices, Minus, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import PageHeader from '../components/PageHeader';
import GameCover from '../components/GameCover';
import RouletteModal from '../components/RouletteModal';
import { completedInYear, goalPercent, totalHours } from '../utils/stats';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5 flex items-center">
      <div className="bg-neutral-100 p-3 rounded-lg mr-4 border border-neutral-200">
        <Icon className="w-5 h-5 text-black" />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { library, goal, year, loading, changeHours, importDemo } = useLibrary();
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const firstName = user.name.split(' ').pop();
  const playing = library.filter((ug) => ug.status === 'playing');
  const doneThisYear = completedInYear(library, year);

  if (loading) return <p className="text-neutral-500">Загрузка библиотеки...</p>;

  // Пустой аккаунт — предлагаем найти игры или загрузить демо
  if (library.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title={`Добро пожаловать, ${firstName}!`} subtitle="Ваша библиотека пока пуста." />
        <div className="card p-10 text-center max-w-xl mx-auto">
          <Gamepad2 className="w-10 h-10 mx-auto mb-4" />
          <p className="font-bold text-lg">Начните с первой игры</p>
          <p className="text-sm text-neutral-500 mt-1 mb-6">Найдите игру в каталоге и добавьте её в бэклог.</p>
          <div className="flex justify-center gap-3">
            <Link to="/search" className="btn-primary"><Search className="w-4 h-4" /> Найти игры</Link>
            <button
              className="btn-outline"
              disabled={importing}
              onClick={async () => {
                setImporting(true);
                await importDemo();
                setImporting(false);
              }}
            >
              {importing ? 'Загружаем...' : 'Заполнить демо-данными'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={`Добро пожаловать, ${firstName}!`} subtitle="Сводка игровой активности и текущего прогресса." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Gamepad2} label="Всего игр" value={library.length} />
        <StatCard icon={Trophy} label="Пройдено" value={library.filter((ug) => ug.status === 'completed').length} />
        <StatCard icon={Clock} label="Часов в игре" value={`${totalHours(library)} ч.`} />
        <StatCard icon={ListChecks} label="В планах" value={library.filter((ug) => ug.status === 'backlog').length} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Цель на год */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Цель на {year} год</h3>
            {goal && (
              <span className="text-xs font-mono font-bold bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
                {doneThisYear} / {goal} игр
              </span>
            )}
          </div>
          {goal ? (
            <>
              <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden border border-neutral-200">
                <div className="bg-black h-full transition-all" style={{ width: `${goalPercent(doneThisYear, goal)}%` }} />
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                {doneThisYear >= goal
                  ? 'Цель выполнена — отличный год!'
                  : `Выполнено на ${Math.round(goalPercent(doneThisYear, goal))}%. Осталось пройти ${goal - doneThisYear}.`}
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              Цель не задана. <Link to="/profile" className="underline text-black">Задать в профиле</Link>
            </p>
          )}
        </div>

        {/* Рулетка */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold">Не знаете, во что поиграть?</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Рулетка выберет случайную игру из списка «В планах» с учётом платформы и жанра.
            </p>
          </div>
          <button className="btn-primary self-start mt-4" onClick={() => setRouletteOpen(true)}>
            <Dices className="w-4 h-4" /> Крутить рулетку
          </button>
        </div>
      </div>

      {/* Играю сейчас */}
      <div className="card p-6">
        <h3 className="font-bold mb-4">Играю сейчас</h3>
        {playing.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Сейчас вы ничего не проходите. Выберите игру в <Link to="/library" className="underline text-black">библиотеке</Link> или запустите рулетку.
          </p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {playing.map((ug) => (
              <div key={ug.id} className="flex items-center border border-neutral-200 rounded-lg p-3">
                <Link to={`/library/${ug.id}`}>
                  <GameCover game={ug.game} className="w-16 h-20 rounded" small />
                </Link>
                <div className="ml-4 flex-1 min-w-0">
                  <Link to={`/library/${ug.id}`} className="font-bold hover:underline line-clamp-1">{ug.game.title}</Link>
                  <p className="text-xs text-neutral-500 mt-0.5">{ug.platform || 'Платформа не указана'}</p>
                  <p className="text-xs font-mono mt-2">{ug.playtime_hours} ч. зафиксировано</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline px-2.5" onClick={() => changeHours(ug, -1)} title="Убрать час">
                    <Minus className="w-4 h-4" />
                  </button>
                  <button className="btn-primary px-3" onClick={() => changeHours(ug, 1)} title="Добавить час">
                    <Plus className="w-4 h-4" /> 1 ч
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rouletteOpen && <RouletteModal onClose={() => setRouletteOpen(false)} />}
    </div>
  );
}
