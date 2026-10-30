// Поиск игр в справочнике.
// С ключом RAWG ищем по настоящей базе rawg.io,
// без ключа — по встроенному списку из data/catalog.js.

import { catalog } from '../data/catalog';

const RAWG_KEY = import.meta.env.VITE_RAWG_KEY;

export const isRawg = Boolean(RAWG_KEY);

// Названия приводим к нашим коротким
function mapPlatform(name) {
  if (name === 'PC') return 'PC';
  if (name === 'PlayStation 5') return 'PS5';
  if (name === 'PlayStation 4') return 'PS4';
  if (name.startsWith('Xbox Series')) return 'Xbox Series';
  if (name === 'Nintendo Switch') return 'Nintendo Switch';
  if (name === 'iOS' || name === 'Android') return 'Mobile';
  return null;
}

function fromRawg(item) {
  const platforms = (item.platforms || []).map((p) => mapPlatform(p.platform.name)).filter(Boolean);
  return {
    id: item.id,
    title: item.name,
    cover_url: item.background_image,
    release_year: item.released ? Number(item.released.slice(0, 4)) : null,
    developer: null, // в списке поиска RAWG разработчика не отдаёт
    genres: (item.genres || []).map((g) => g.name),
    platforms: [...new Set(platforms)],
  };
}

export async function searchGames(query) {
  const q = query.trim().toLowerCase();

  if (isRawg) {
    const params = new URLSearchParams({ key: RAWG_KEY, page_size: '18' });
    if (q) params.set('search', q);
    else params.set('ordering', '-added'); // без запроса показываем популярные
    const res = await fetch(`https://api.rawg.io/api/games?${params}`);
    if (!res.ok) throw new Error('RAWG API не ответил, попробуйте позже');
    const json = await res.json();
    return json.results.map(fromRawg);
  }

  if (!q) return catalog;
  return catalog.filter(
    (g) => g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q),
  );
}
