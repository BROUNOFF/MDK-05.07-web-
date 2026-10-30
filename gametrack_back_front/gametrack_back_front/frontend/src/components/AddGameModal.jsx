import { useState } from 'react';
import Modal from './Modal';
import GameCover from './GameCover';
import { useLibrary } from '../context/LibraryContext';
import { STATUSES, STATUS_KEYS, PLATFORMS } from '../utils/constants';

// Окно добавления игры: выбираем статус и платформу, на которой будем играть
export default function AddGameModal({ game, onClose }) {
  const { addGame } = useLibrary();
  const available = game.platforms?.length ? game.platforms : PLATFORMS;

  const [status, setStatus] = useState('backlog');
  const [platform, setPlatform] = useState(available[0]);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    const fields = { status, platform };
    if (status === 'completed') fields.completed_at = new Date().toISOString();
    const added = await addGame(game, fields);
    setSaving(false);
    if (added) onClose();
  }

  return (
    <Modal title="Добавить в библиотеку" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <GameCover game={game} className="w-16 h-20 rounded" small />
        <div>
          <p className="font-bold">{game.title}</p>
          <p className="text-sm text-neutral-500">
            {[game.release_year, game.genres?.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <label className="label">Статус</label>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {STATUS_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              status === key ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'
            }`}
          >
            {STATUSES[key]}
          </button>
        ))}
      </div>

      <label className="label">Платформа</label>
      <select className="input mb-6" value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {available.map((p) => <option key={p}>{p}</option>)}
      </select>

      <button className="btn-primary w-full" onClick={handleAdd} disabled={saving}>
        {saving ? 'Добавляем...' : 'Добавить'}
      </button>
    </Modal>
  );
}
