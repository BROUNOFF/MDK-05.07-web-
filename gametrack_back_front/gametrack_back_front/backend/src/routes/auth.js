// Регистрация, вход и данные текущего пользователя
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { badRequest, HttpError } from '../errors.js';
import { createToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const USER_FIELDS = 'id, email, name, created_at';

function checkEmail(email) {
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) throw badRequest('Введите корректный email');
  return email.trim().toLowerCase();
}

function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 6) throw badRequest('Пароль должен быть не короче 6 символов');
  return password;
}

function checkName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) throw badRequest('Имя должно быть не короче 2 символов');
  return name.trim();
}

// POST /api/auth/register  { email, password, name }
router.post('/register', async (req, res) => {
  const email = checkEmail(req.body.email);
  const password = checkPassword(req.body.password);
  const name = checkName(req.body.name);

  const exists = await query('select 1 from users where email = $1', [email]);
  if (exists.rowCount) throw new HttpError(409, 'Пользователь с таким email уже зарегистрирован');

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `insert into users (email, password_hash, name) values ($1, $2, $3) returning ${USER_FIELDS}`,
    [email, hash, name],
  );
  res.status(201).json({ token: createToken(rows[0].id), user: rows[0] });
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const email = checkEmail(req.body.email);
  const password = String(req.body.password || '');

  const { rows } = await query(`select ${USER_FIELDS}, password_hash from users where email = $1`, [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, 'Неверный email или пароль');
  }
  delete user.password_hash;
  res.json({ token: createToken(user.id), user });
});

// GET /api/auth/me — кто я (по токену)
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query(`select ${USER_FIELDS} from users where id = $1`, [req.userId]);
  if (!rows[0]) throw new HttpError(401, 'Пользователь не найден');
  res.json(rows[0]);
});

// PATCH /api/auth/me  { name } — сменить имя
router.patch('/me', requireAuth, async (req, res) => {
  const name = checkName(req.body.name);
  const { rows } = await query(`update users set name = $1 where id = $2 returning ${USER_FIELDS}`, [name, req.userId]);
  res.json(rows[0]);
});

export default router;
