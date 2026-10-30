import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import GameCover from '../components/GameCover';
import StatusBadge from '../components/StatusBadge';
import { STATUSES, STATUS_KEYS, PLATFORMS } from '../utils/constants';
import { costPerHour } from '../utils/stats';
import { formatDate, formatShortDate } from '../utils/date';

const MAX_FAVORITES = 5;

// Из записи библиотеки делаем значения для полей формы
function toForm(ug) {
  return {
    status: ug.status,
    platform: ug.platform || '',
    rating: ug.rating ? String(ug.rating) : '',
    playtime_hours: String(ug.playtime_hours ?? 0),
    price: ug.price === null || ug.price === undefined ? '' : String(ug.price),
    notes: ug.notes || '',
    is_favorite: ug.is_favorite,
  };
}

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { library, sessions, loading, updateGame, removeGame } = useLibrary();
  const item = library.find((ug) => ug.id === id);

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item) setForm(toForm(item));
  }, [item]);

  if (loading) return <p className="text-neutral-500">Загрузка...</p>;
  if (!item) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <p className="font-bold">Игра не найдена</p>
        <Link to="/library" className="btn-outline mt-4">Вернуться в библиотеку</Link>
      </div>
    );
  }
  if (!form) return null;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const changed = JSON.stringify(form) !== JSON.stringify(toForm(item));
  const value = costPerHour(Number(form.price), Number(form.playtime_hours));
  const favoritesCount = library.filter((ug) => ug.is_favorite).length;

  const gameSessions = sessions
    .filter((s) => s.user_game_id === item.id && s.hours > 0)
    .sort((a, b) => b.played_on.localeCompare(a.played_on))
    .slice(0, 5);

  function validate() {
    const e = {};
    const hours = Number(form.playtime_hours);
    if (form.playtime_hours === '' || Number.isNaN(hours) || hours < 0 || hours > 10000) {
      e.playtime_hours = 'Укажите число от 0 до 10000';
    }
    if (form.price !== '' && (Number.isNaN(Number(form.price)) || Number(form.price) < 0)) {
      e.price = 'Цена не может быть отрицательной';
    }
    return e;
  }

  function toggleFavorite() {
    if (!form.is_favorite && !item.is_favorite && favoritesCount >= MAX_FAVORITES) {
      showToast(`В витрине уже ${MAX_FAVORITES} игр — уберите одну из них`, 'error');
      return;
    }
    setForm({ ...form, is_favorite: !form.is_favorite });
  }

  async function handleSave(e) {
    e.preventDefault();
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(true);
    await updateGame(item, {
      status: form.status,
      platform: form.platform || null,
      rating: form.rating ? Number(form.rating) : null,
      playtime_hours: Math.round(Number(form.playtime_hours) * 10) / 10,
      price: form.price === '' ? null : Number(form.price),
      notes: form.notes.trim(),
      is_favorite: form.is_favorite,
    });
    setSaving(false);
  }

  async function handleDelete() {
    const ok = await removeGame(item);
    if (ok) navigate('/library');
  }

  const { game } = item;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-neutral-500 hover:text-black mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Назад
      </button>

      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        {/* Левая колонка — обложка и справочные данные */}
        <div>
          <GameCover game={game} className="w-full h-80 rounded-xl border border-neutral-200" />
          <div className="card p-5 mt-4 text-sm space-y-2">
            <InfoRow label="Разработчик" value={game.developer || '—'} />
            <InfoRow label="Год выхода" value={game.release_year || '—'} />
            <InfoRow label="Жанры" value={game.genres?.join(', ') || '—'} />
            <InfoRow label="Платформы" value={game.platforms?.join(', ') || '—'} />
            <InfoRow label="Добавлена" value={formatShortDate(item.created_at)} />
            {item.completed_at && <InfoRow label="Пройдена" value={formatShortDate(item.completed_at)} />}
          </div>
        </div>

        {/* Правая колонка — форма редактирования */}
        <form onSubmit={handleSave} noValidate>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{game.title}</h2>
              <div className="mt-2"><StatusBadge status={item.status} /></div>
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              className={`btn-outline shrink-0 ${form.is_favorite ? 'border-black' : ''}`}
              title="Витрина любимых игр в профиле"
            >
              <Star className={`w-4 h-4 ${form.is_favorite ? 'fill-black' : ''}`} />
              {form.is_favorite ? 'В витрине' : 'В витрину'}
            </button>
          </div>

          <div className="card p-6 mt-6 grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Статус</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUSES[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Платформа</label>
              <select className="input" value={form.platform} onChange={set('platform')}>
                <option value="">Не указана</option>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Оценка</label>
              <select className="input" value={form.rating} onChange={set('rating')}>
                <option value="">Без оценки</option>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} / 10</option>)}
              </select>
            </div>
            <div>
              <label className="label">Наиграно, часов</label>
              <input className="input" type="number" min="0" step="0.5" value={form.playtime_hours} onChange={set('playtime_hours')} />
              {errors.playtime_hours && <p className="text-xs mt-1">{errors.playtime_hours}</p>}
            </div>
            <div>
              <label className="label">Цена покупки, ₽</label>
              <input className="input" type="number" min="0" placeholder="Не указана" value={form.price} onChange={set('price')} />
              {errors.price && <p className="text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="label">Стоимость часа</label>
              <div className="input bg-neutral-50 font-mono">
                {value === null ? '—' : `${value.toFixed(1)} ₽/час`}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Заметки / отзыв</label>
              <textarea
                className="input min-h-[100px] resize-y"
                placeholder="Впечатления, на чём остановились, что понравилось..."
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
            <button type="submit" className="btn-primary" disabled={!changed || saving}>
              {saving ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-2 text-sm">
                Удалить игру из библиотеки?
                <button type="button" className="btn-primary px-3 py-1.5" onClick={handleDelete}>Да</button>
                <button type="button" className="btn-outline px-3 py-1.5" onClick={() => setConfirmDelete(false)}>Нет</button>
              </div>
            ) : (
              <button type="button" className="btn text-neutral-500 hover:text-black" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-4 h-4" /> Удалить
              </button>
            )}
          </div>

          {gameSessions.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold mb-3">Последние сессии</h3>
              <ul className="card divide-y divide-neutral-100 text-sm">
                {gameSessions.map((s) => (
                  <li key={s.id} className="flex justify-between px-5 py-2.5">
                    <span>{formatDate(s.played_on)}</span>
                    <span className="font-mono">+{s.hours} ч.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
