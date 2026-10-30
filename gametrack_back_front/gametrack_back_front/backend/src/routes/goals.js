// Цель на год: сколько игр пользователь хочет пройти
import { Router } from 'express';
import { query } from '../db.js';
import { badRequest } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function checkYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw badRequest('Некорректный год');
  return year;
}

// GET /api/goals/2026 -> { year, target } (target = null, если цель не задана)
router.get('/:year', async (req, res) => {
  const year = checkYear(req.params.year);
  const { rows } = await query('select target from yearly_goals where user_id = $1 and year = $2', [req.userId, year]);
  res.json({ year, target: rows[0]?.target ?? null });
});

// PUT /api/goals/2026  { target: 12 }
router.put('/:year', async (req, res) => {
  const year = checkYear(req.params.year);
  const target = req.body.target;
  if (!Number.isInteger(target) || target < 1 || target > 365) throw badRequest('Цель — целое число от 1 до 365');

  await query(
    `insert into yearly_goals (user_id, year, target) values ($1, $2, $3)
     on conflict (user_id, year) do update set target = excluded.target`,
    [req.userId, year, target],
  );
  res.json({ year, target });
});

export default router;
