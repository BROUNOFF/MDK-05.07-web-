// Проверка JWT-токена из заголовка Authorization: Bearer <токен>
import jwt from 'jsonwebtoken';
import { HttpError } from '../errors.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function createToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Пропускает запрос дальше только с правильным токеном и кладёт id пользователя в req.userId
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Нужно войти в систему');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, 'Сессия истекла, войдите заново');
  }
}
