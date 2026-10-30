// Точка входа сервера GameTrack: REST API на Express поверх PostgreSQL
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import { initDatabase, seedLibrary } from './seed.js';
import { requireAuth } from './middleware/auth.js';
import { HttpError } from './errors.js';
import authRoutes from './routes/auth.js';
import libraryRoutes from './routes/library.js';
import sessionRoutes from './routes/sessions.js';
import goalRoutes from './routes/goals.js';
import gameRoutes from './routes/games.js';
import statsRoutes from './routes/stats.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// короткий лог каждого запроса в консоль: метод, адрес, код ответа, время
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} мс)`));
  next();
});

// GET /api/health — жив ли сервер и есть ли связь с базой
app.get('/api/health', async (req, res) => {
  const { rows } = await query('select now() as db_time');
  res.json({ status: 'ok', db_time: rows[0].db_time });
});

app.use('/api/auth', authRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/stats', statsRoutes);

// POST /api/demo/import — заполнить библиотеку текущего пользователя демо-играми
app.post('/api/demo/import', requireAuth, async (req, res) => {
  const added = await seedLibrary(req.userId);
  res.json({ added });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

// Все ошибки собираются здесь и отдаются клиенту в одном формате { error: "..." }
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  if (err.code === '23505') return res.status(409).json({ error: 'Эта игра уже есть в библиотеке' });
  if (err.code === '22P02') return res.status(400).json({ error: 'Некорректный идентификатор' });
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Сервер GameTrack запущен: http://localhost:${PORT}/api/health`));
  })
  .catch((e) => {
    console.error('Не удалось подключиться к базе данных:', e.message);
    console.error('Проверьте, что PostgreSQL запущен и DATABASE_URL в .env указан верно');
    process.exit(1);
  });
