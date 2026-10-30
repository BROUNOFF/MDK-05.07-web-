// Сводная статистика, посчитанная прямо в SQL — удобно показать агрегирующие запросы
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/stats/summary
router.get('/summary', async (req, res) => {
  const totals = await query(
    `select count(*)::int                                    as total_games,
            coalesce(sum(playtime_hours), 0)                 as total_hours,
            round(avg(rating)::numeric, 1)                   as avg_rating,
            count(*) filter (where status = 'completed')::int as completed
     from user_games where user_id = $1`,
    [req.userId],
  );

  const byStatus = await query(
    `select status, count(*)::int as count
     from user_games where user_id = $1
     group by status order by count desc`,
    [req.userId],
  );

  const byPlatform = await query(
    `select coalesce(platform, 'Не указана') as platform, sum(playtime_hours) as hours
     from user_games where user_id = $1
     group by 1 order by hours desc`,
    [req.userId],
  );

  // стоимость часа = цена / часы (формула из ТЗ), пять самых выгодных покупок
  const bestValue = await query(
    `select g.title, ug.price, ug.playtime_hours,
            round(ug.price / ug.playtime_hours, 1) as cost_per_hour
     from user_games ug join games g on g.id = ug.game_id
     where ug.user_id = $1 and ug.price > 0 and ug.playtime_hours > 0
     order by cost_per_hour asc limit 5`,
    [req.userId],
  );

  res.json({
    ...totals.rows[0],
    by_status: byStatus.rows,
    by_platform: byPlatform.rows,
    best_value: bestValue.rows,
  });
});

export default router;
