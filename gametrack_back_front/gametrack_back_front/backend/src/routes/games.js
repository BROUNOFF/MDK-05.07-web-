// Справочник игр: поиск по встроенному каталогу или по RAWG API (если задан ключ)
import { Router } from 'express';
import { catalog } from '../data/catalog.js';
import { HttpError } from '../errors.js';

const router = Router();
const RAWG_KEY = process.env.RAWG_KEY;

// Длинные названия платформ из RAWG приводим к нашим коротким
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
    developer: null,
    genres: (item.genres || []).map((g) => g.name),
    platforms: [...new Set(platforms)],
  };
}

// GET /api/games/search?q=witcher
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();

  if (RAWG_KEY) {
    const params = new URLSearchParams({ key: RAWG_KEY, page_size: '18' });
    if (q) params.set('search', q);
    else params.set('ordering', '-added');
    const response = await fetch(`https://api.rawg.io/api/games?${params}`);
    if (!response.ok) throw new HttpError(502, 'RAWG API не ответил, попробуйте позже');
    const json = await response.json();
    return res.json(json.results.map(fromRawg));
  }

  const found = q
    ? catalog.filter((g) => g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q))
    : catalog;
  // steam_id нужен только серверу, наружу его не отдаём
  res.json(found.map(({ steam_id, ...game }) => game));
});

export default router;
