// Создание таблиц и демо-данных при запуске сервера
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';
import { demoLibrary, demoGoal, makeDemoSessions } from './data/demoData.js';

export const DEMO_EMAIL = 'demo@gametrack.ru';
export const DEMO_PASSWORD = 'demo123';

// Ждём, пока поднимется PostgreSQL (в Docker база стартует на пару секунд дольше сервера)
async function waitForDb(attempts = 30) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await query('select 1');
      return;
    } catch (e) {
      if (i === attempts) throw e;
      console.log(`База данных ещё не готова, пробую снова (${i}/${attempts})...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// Заполнить библиотеку пользователя демо-играми (пропуская те, что уже есть)
export async function seedLibrary(userId) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const added = [];
    for (const item of demoLibrary) {
      const g = item.game;
      await client.query(
        `insert into games (id, title, cover_url, release_year, developer, genres, platforms)
         values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing`,
        [g.id, g.title, g.cover_url, g.release_year, g.developer, g.genres, g.platforms],
      );
      const { rows } = await client.query(
        `insert into user_games (user_id, game_id, status, platform, rating, price, playtime_hours, is_favorite, completed_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (user_id, game_id) do nothing
         returning id, status, completed_at`,
        [userId, g.id, item.status, item.platform, item.rating, item.price, item.playtime_hours, item.is_favorite, item.completed_at],
      );
      if (rows[0]) added.push(rows[0]);
    }
    for (const s of makeDemoSessions(added)) {
      await client.query(
        'insert into game_sessions (user_id, user_game_id, played_on, hours) values ($1, $2, $3, $4)',
        [userId, s.user_game_id, s.played_on, s.hours],
      );
    }
    await client.query(
      `insert into yearly_goals (user_id, year, target) values ($1, $2, $3) on conflict do nothing`,
      [userId, new Date().getFullYear(), demoGoal],
    );
    await client.query('commit');
    return added.length;
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

export async function initDatabase() {
  await waitForDb();
  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await query(schema);

  // демо-аккаунт создаётся один раз, при самом первом запуске
  const exists = await query('select id from users where email = $1', [DEMO_EMAIL]);
  if (!exists.rowCount) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const { rows } = await query(
      'insert into users (email, password_hash, name) values ($1, $2, $3) returning id',
      [DEMO_EMAIL, hash, 'Пастернак Сергей'],
    );
    const count = await seedLibrary(rows[0].id);
    console.log(`Создан демо-аккаунт ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${count} игр)`);
  }
}
