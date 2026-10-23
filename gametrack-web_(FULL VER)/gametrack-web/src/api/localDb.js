// Локальная «база данных» в localStorage браузера.
// Нужна, чтобы приложение работало без интернета и без настройки Supabase.
// Функции повторяют supabaseDb.js один в один, поэтому страницы не знают, откуда данные.
//
// Важно: пароль здесь хранится открытым текстом — это только заглушка для демо.
// В Supabase пароли хранятся в виде хэша и сюда не попадают.

import { demoLibrary, demoGoal, makeDemoSessions } from '../data/demoData';
import { toLocalDate } from '../utils/date';

const KEY = 'gametrack-db';

export const DEMO_EMAIL = 'demo@gametrack.ru';
export const DEMO_PASSWORD = 'demo123';

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return saved;
  } catch {
    // повреждённые данные просто пересоздаём
  }
  const db = { users: [], games: {}, userGames: [], sessions: [], goals: [], sessionUserId: null };
  seedDemoUser(db);
  save(db);
  return db;
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

// При первом запуске создаём демо-аккаунт с заполненной библиотекой
function seedDemoUser(db) {
  const user = {
    id: uid(),
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    name: 'Пастернак Сергей',
    created_at: new Date().toISOString(),
  };
  db.users.push(user);

  const now = new Date().toISOString();
  const ugs = demoLibrary.map((item) => {
    db.games[item.game.id] = item.game;
    return {
      id: uid(),
      user_id: user.id,
      game_id: item.game.id,
      status: item.status,
      platform: item.platform,
      rating: item.rating,
      price: item.price,
      playtime_hours: item.playtime_hours,
      notes: '',
      is_favorite: item.is_favorite,
      completed_at: item.completed_at,
      created_at: now,
      updated_at: now,
    };
  });
  db.userGames.push(...ugs);
  db.sessions.push(...makeDemoSessions(ugs).map((s) => ({ ...s, id: uid(), user_id: user.id })));
  db.goals.push({ user_id: user.id, year: new Date().getFullYear(), target: demoGoal });
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, created_at: u.created_at };
}

function requireUser(db) {
  const user = db.users.find((u) => u.id === db.sessionUserId);
  if (!user) throw new Error('Нужно войти в систему');
  return user;
}

// К записи коллекции подклеиваем данные игры — так же, как делает select('*, game:games(*)')
function withGame(db, ug) {
  return { ...ug, game: db.games[ug.game_id] };
}

// Авторизация

export async function getCurrentUser() {
  const db = load();
  const user = db.users.find((u) => u.id === db.sessionUserId);
  return user ? publicUser(user) : null;
}

export async function signIn(email, password) {
  const db = load();
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.password !== password) throw new Error('Неверный email или пароль');
  db.sessionUserId = user.id;
  save(db);
  return publicUser(user);
}

export async function signUp(email, password, name) {
  const db = load();
  const normalized = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === normalized)) {
    throw new Error('Пользователь с таким email уже зарегистрирован');
  }
  const user = { id: uid(), email: normalized, password, name: name.trim(), created_at: new Date().toISOString() };
  db.users.push(user);
  db.sessionUserId = user.id;
  save(db);
  return publicUser(user);
}

export async function signOut() {
  const db = load();
  db.sessionUserId = null;
  save(db);
}

export async function updateProfile({ name }) {
  const db = load();
  const user = requireUser(db);
  user.name = name.trim();
  save(db);
  return publicUser(user);
}

// Библиотека

export async function getLibrary() {
  const db = load();
  const user = requireUser(db);
  return db.userGames
    .filter((ug) => ug.user_id === user.id)
    .map((ug) => withGame(db, ug))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function addToLibrary(game, fields) {
  const db = load();
  const user = requireUser(db);
  if (db.userGames.some((ug) => ug.user_id === user.id && ug.game_id === game.id)) {
    throw new Error('Эта игра уже есть в библиотеке');
  }
  // кэшируем справочные данные игры, чтобы не ходить за ними во внешний API повторно
  db.games[game.id] = game;

  const now = new Date().toISOString();
  const ug = {
    id: uid(),
    user_id: user.id,
    game_id: game.id,
    status: 'backlog',
    platform: null,
    rating: null,
    price: null,
    playtime_hours: 0,
    notes: '',
    is_favorite: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
    ...fields,
  };
  db.userGames.push(ug);
  save(db);
  return withGame(db, ug);
}

export async function updateUserGame(id, patch) {
  const db = load();
  const user = requireUser(db);
  const ug = db.userGames.find((x) => x.id === id && x.user_id === user.id);
  if (!ug) throw new Error('Запись не найдена');
  Object.assign(ug, patch, { updated_at: new Date().toISOString() });
  save(db);
  return withGame(db, ug);
}

export async function removeFromLibrary(id) {
  const db = load();
  const user = requireUser(db);
  db.userGames = db.userGames.filter((x) => !(x.id === id && x.user_id === user.id));
  db.sessions = db.sessions.filter((s) => s.user_game_id !== id);
  save(db);
}

// Игровые сессии (для карты активности)

export async function getSessions() {
  const db = load();
  const user = requireUser(db);
  return db.sessions.filter((s) => s.user_id === user.id);
}

export async function addSession(userGameId, hours, playedOn = toLocalDate()) {
  const db = load();
  const user = requireUser(db);
  const session = { id: uid(), user_id: user.id, user_game_id: userGameId, played_on: playedOn, hours };
  db.sessions.push(session);
  save(db);
  return session;
}

// Цель на год

export async function getGoal(year) {
  const db = load();
  const user = requireUser(db);
  return db.goals.find((g) => g.user_id === user.id && g.year === year)?.target ?? null;
}

export async function setGoal(year, target) {
  const db = load();
  const user = requireUser(db);
  const goal = db.goals.find((g) => g.user_id === user.id && g.year === year);
  if (goal) goal.target = target;
  else db.goals.push({ user_id: user.id, year, target });
  save(db);
  return target;
}
