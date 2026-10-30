import { useEffect, useState } from 'react';
import { catalogCovers } from '../data/catalog';

// Оттенки серого для заглушки, если ни одна картинка не загрузилась
const shades = ['bg-neutral-900', 'bg-neutral-800', 'bg-neutral-700', 'bg-stone-800', 'bg-zinc-800'];

// Обложка игры. Пробуем картинки по очереди: сохранённую в базе, постер из Steam, шапку из Steam.
// Если не загрузилась ни одна — заглушка.
export default function GameCover({ game, className = '', small = false }) {
  const sources = [...new Set([game?.cover_url, ...catalogCovers(game?.id)].filter(Boolean))];
  const [index, setIndex] = useState(0);

  // при смене игры начинаем перебор заново
  useEffect(() => setIndex(0), [game?.id]);

  if (index < sources.length) {
    return (
      <img
        key={sources[index]}
        src={sources[index]}
        alt={game.title}
        loading="lazy"
        onError={() => setIndex((i) => i + 1)}
        className={`object-cover bg-neutral-200 ${className}`}
      />
    );
  }

  const title = game?.title || '?';
  const shade = shades[title.length % shades.length];

  return (
    <div className={`${shade} text-white flex items-end p-3 select-none ${className}`}>
      <span className={`font-semibold leading-tight ${small ? 'text-[10px] line-clamp-3' : 'text-sm line-clamp-3'}`}>
        {title}
      </span>
    </div>
  );
}
