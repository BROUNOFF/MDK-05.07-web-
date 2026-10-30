// Игровые сессии: из них строятся карта активности и «Итоги года»
import { Router } from 'express';
import { query } from '../db.js';
import { badRequest, notFound } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/sessions — все сессии пользователя
router.get('/', async (req, res) => {
  const { rows } = await query(
    'select * from game_sessions where user_id = $1 order by played_on desc',
    [req.userId],
  );
  res.json(rows);
});

// POST /api/sessions  { user_game_id, hours, played_on? }
// hours может быть отрицательным — так записывается кнопка «−1 ч»
router.post('/', async (req, res) => {
  const { user_game_id: userGameId, hours, played_on: playedOn } = req.body;
  if (typeof hours !== 'number' || hours === 0 || Math.abs(hours) > 24) throw badRequest('hours — число от -24 до 24, не ноль');
  if (playedOn !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(playedOn)) throw badRequest('played_on в формате YYYY-MM-DD');

  const owner = await query('select 1 from user_games where id = $1 and user_id = $2', [userGameId, req.userId]);
  if (!owner.rowCount) throw notFound('Игра не найдена в вашей библиотеке');

  const { rows } = await query(
    `insert into game_sessions (user_id, user_game_id, hours, played_on)
     values ($1, $2, $3, coalesce($4::date, current_date)) returning *`,
    [req.userId, userGameId, hours, playedOn || null],
  );
  res.status(201).json(rows[0]);
});

export default router;
