import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Calendar, Pencil, LogOut, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import GameCover from '../components/GameCover';
import YearSummary from '../components/YearSummary';
import { completedInYear, goalPercent, totalHours } from '../utils/stats';
import { formatDate } from '../utils/date';

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

export default function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const { library, sessions, goal, year, setGoal } = useLibrary();
  const showToast = useToast();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [goalInput, setGoalInput] = useState('');

  // цель приходит из базы асинхронно, поэтому подставляем её, когда загрузится
  useEffect(() => {
    if (goal) setGoalInput(String(goal));
  }, [goal]);

  const favorites = library.filter((ug) => ug.is_favorite).slice(0, 5);
  const rated = library.filter((ug) => ug.rating);
  const avgRating = rated.length ? rated.reduce((s, ug) => s + ug.rating, 0) / rated.length : null;
  const doneThisYear = completedInYear(library, year);

  async function saveName(e) {
    e.preventDefault();
    if (name.trim().length < 2) return showToast('Имя слишком короткое', 'error');
    try {
      await updateProfile({ name });
      setEditingName(false);
      showToast('Имя обновлено');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function saveGoal(e) {
    e.preventDefault();
    const target = Number(goalInput);
    if (!Number.isInteger(target) || target < 1 || target > 365) {
      return showToast('Цель — целое число от 1 до 365', 'error');
    }
    await setGoal(target);
  }

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Профиль пользователя" subtitle="Учётная запись, годовая цель, итоги года и витрина любимых игр." />

      {/* Карточка пользователя */}
      <div className="card p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold font-mono shrink-0">
          {initials(user.name)}
        </div>
        <div className="flex-1">
          {editingName ? (
            <form onSubmit={saveName} className="flex gap-2 max-w-sm">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              <button className="btn-primary">OK</button>
            </form>
          ) : (
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {user.name}
              <button onClick={() => setEditingName(true)} className="text-neutral-400 hover:text-black" title="Изменить имя">
                <Pencil className="w-4 h-4" />
              </button>
            </h3>
          )}
          <p className="text-sm text-neutral-500 flex items-center mt-2"><Mail className="w-4 h-4 mr-2" />{user.email}</p>
          <p className="text-sm text-neutral-500 flex items-center mt-1"><Calendar className="w-4 h-4 mr-2" />С нами с {formatDate(user.created_at)}</p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div><p className="text-2xl font-bold">{library.length}</p><p className="text-xs text-neutral-500">игр</p></div>
          <div><p className="text-2xl font-bold">{totalHours(library)}</p><p className="text-xs text-neutral-500">часов</p></div>
          <div><p className="text-2xl font-bold">{avgRating ? avgRating.toFixed(1) : '—'}</p><p className="text-xs text-neutral-500">ср. оценка</p></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Цель на год */}
        <form onSubmit={saveGoal} className="card p-6">
          <h4 className="font-bold flex items-center mb-4"><Target className="w-5 h-5 mr-2" /> Цель на {year} год</h4>
          <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden border border-neutral-200">
            <div className="bg-black h-full" style={{ width: `${goalPercent(doneThisYear, goal)}%` }} />
          </div>
          <p className="text-xs text-neutral-500 mt-2 mb-4">
            {goal ? `Пройдено ${doneThisYear} из ${goal}` : `Пройдено в этом году: ${doneThisYear}. Задайте цель.`}
          </p>
          <div className="flex gap-2">
            <input
              className="input"
              type="number"
              min="1"
              max="365"
              placeholder="Сколько игр пройти"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
            />
            <button className="btn-primary shrink-0">Сохранить</button>
          </div>
        </form>

        <YearSummary library={library} sessions={sessions} year={year} />
      </div>

      {/* Витрина любимых игр */}
      <div className="card p-6 mb-6">
        <h4 className="font-bold mb-1">Топ-5 любимых игр</h4>
        <p className="text-sm text-neutral-500 mb-5">Отметьте игру звёздочкой «В витрину» в её карточке.</p>
        {favorites.length === 0 ? (
          <p className="text-sm text-neutral-400">Витрина пока пуста.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-3xl">
            {favorites.map((ug) => (
              <Link key={ug.id} to={`/library/${ug.id}`} className="group">
                <GameCover game={ug.game} className="w-full aspect-[3/4] rounded-lg border border-neutral-200" />
                <p className="text-xs font-medium mt-2 line-clamp-1 group-hover:underline">{ug.game.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleLogout} className="btn-outline">
        <LogOut className="w-4 h-4" /> Выйти из аккаунта
      </button>
    </div>
  );
}
