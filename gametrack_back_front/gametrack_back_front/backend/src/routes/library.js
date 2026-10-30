// Личная библиотека пользователя: CRUD для таблицы user_games
import { Router } from 'express';
import { query } from '../db.js';
import { badRequest, HttpError, notFound } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['backlog', 'playing', 'completed', 'dropped'];
const EDITABLE = ['status', 'platform', 'rating', 'price', 'playtime_hours', 'notes', 'is_favorite', 'completed_at'];

// Запись коллекции вместе с данными игры (поле game) — как ждёт фронтенд
const SELECT_WITH_GAME = `
  select ug.*, row_to_json(g) as game
  from user_games ug
  join games g on g.id = ug.game_id`;

// Проверяем и очищаем присланные поля, лишние просто отбрасываем
function cleanFields(body) {
  const out = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (out.status !== undefined && !STATUSES.includes(out.status)) throw badRequest('Неизвестный статус');
  if (out.rating !== undefined && out.rating !== null) {
    if (!Number.isInteger(out.rating) || out.rating < 1 || out.rating > 10) throw badRequest('Оценка — целое число от 1 до 10');
  }
  if (out.playtime_hours !== undefined) {
    if (typeof out.playtime_hours !== 'number' || out.playtime_hours < 0 || out.playtime_hours > 10000) {
      throw badRequest('Часы — число от 0 до 10000');
    }
  }
  if (out.price !== undefined && out.price !== null && (typeof out.price !== 'number' || out.price < 0)) {
    throw badRequest('Цена не может быть отрицательной');
  }
  if (out.notes !== undefined) out.notes = String(out.notes ?? '').slice(0, 5000);
  if (out.is_favorite !== undefined) out.is_favorite = Boolean(out.is_favorite);
  return out;
}

// Витрина «Топ-5»: больше пяти избранных игр быть не может
async function checkFavoritesLimit(userId, exceptId) {
  const { rows } = await query(
    'select count(*)::int as n from user_games where user_id = $1 and is_favorite and id is distinct from $2',
    [userId, exceptId],
  );
  if (rows[0].n >= 5) throw badRequest('В витрине уже 5 игр — уберите одну из них');
}

// GET /api/library — вся библиотека пользователя
router.get('/', async (req, res) => {
  const { rows } = await query(`${SELECT_WITH_GAME} where ug.user_id = $1 order by ug.updated_at desc`, [req.userId]);
  res.json(rows);
});

// GET /api/library/:id — одна запись
router.get('/:id', async (req, res) => {
  const { rows } = await query(`${SELECT_WITH_GAME} where ug.id = $1 and ug.user_id = $2`, [req.params.id, req.userId]);
  if (!rows[0]) throw notFound('Запись не найдена');
  res.json(rows[0]);
});

// POST /api/library  { game: {...}, status, platform, ... } — добавить игру
router.post('/', async (req, res) => {
  const game = req.body.game;
  if (!game || !Number.isFinite(Number(game.id)) || !game.title) throw badRequest('Нужны данные игры: game.id и game.title');
  const fields = cleanFields(req.body);
  if (fields.is_favorite) await checkFavoritesLimit(req.userId, null);
  if (fields.status === 'completed' && !fields.completed_at) fields.completed_at = new Date().toISOString();

  // кладём игру в общий справочник, если её там ещё нет
  await query(
    `insert into games (id, title, cover_url, release_year, developer, genres, platforms)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do nothing`,
    [game.id, game.title, game.cover_url || null, game.release_year || null, game.developer || null,
      game.genres || [], game.platforms || []],
  );

  const columns = ['user_id', 'game_id', ...Object.keys(fields)];
  const values = [req.userId, game.id, ...Object.values(fields)];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const inserted = await query(
    `insert into user_games (${columns.join(', ')}) values (${placeholders}) returning id`,
    values,
  );
  const { rows } = await query(`${SELECT_WITH_GAME} where ug.id = $1`, [inserted.rows[0].id]);
  res.status(201).json(rows[0]);
});

// PATCH /api/library/:id  { status, rating, ... } — изменить запись
router.patch('/:id', async (req, res) => {
  const fields = cleanFields(req.body);
  if (Object.keys(fields).length === 0) throw badRequest('Нечего обновлять');

  const current = await query('select status, is_favorite from user_games where id = $1 and user_id = $2', [req.params.id, req.userId]);
  if (!current.rows[0]) throw notFound('Запись не найдена');

  // дата прохождения ставится и снимается автоматически — по ней считается цель на год
  if (fields.status === 'completed' && current.rows[0].status !== 'completed') fields.completed_at = new Date().toISOString();
  if (fields.status && fields.status !== 'completed') fields.completed_at = null;
  if (fields.is_favorite && !current.rows[0].is_favorite) await checkFavoritesLimit(req.userId, req.params.id);

  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  await query(
    `update user_games set ${sets}, updated_at = now() where id = $${keys.length + 1} and user_id = $${keys.length + 2}`,
    [...Object.values(fields), req.params.id, req.userId],
  );
  const { rows } = await query(`${SELECT_WITH_GAME} where ug.id = $1`, [req.params.id]);
  res.json(rows[0]);
});

// DELETE /api/library/:id — удалить игру из библиотеки (сессии удалятся каскадом)
router.delete('/:id', async (req, res) => {
  const result = await query('delete from user_games where id = $1 and user_id = $2', [req.params.id, req.userId]);
  if (!result.rowCount) throw new HttpError(404, 'Запись не найдена');
  res.status(204).end();
});

export default router;
