// Клиент REST API нашего сервера (папка backend).
// Все страницы получают и сохраняют данные только через эти функции.
// Токен входа (JWT) хранится в localStorage и отправляется в заголовке Authorization.

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'gametrack-token';

export const DEMO_EMAIL = 'demo@gametrack.ru';
export const DEMO_PASSWORD = 'demo123';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // в приватном режиме браузера localStorage может быть недоступен
  }
}

// Один общий метод для всех запросов: подставляет токен и превращает ошибки сервера в понятный текст
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте, что бэкенд запущен');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null); // токен просрочен — забываем его
    throw new Error(data.error || `Ошибка сервера (${res.status})`);
  }
  return data;
}

// Авторизация

export async function getCurrentUser() {
  if (!getToken()) return null;
  try {
    return await request('GET', '/auth/me');
  } catch {
    return null;
  }
}

export async function signIn(email, password) {
  const { token, user } = await request('POST', '/auth/login', { email, password });
  setToken(token);
  return user;
}

export async function signUp(email, password, name) {
  const { token, user } = await request('POST', '/auth/register', { email, password, name });
  setToken(token);
  return user;
}

export async function signOut() {
  setToken(null);
}

export function updateProfile({ name }) {
  return request('PATCH', '/auth/me', { name });
}

// Библиотека

export function getLibrary() {
  return request('GET', '/library');
}

export function addToLibrary(game, fields) {
  return request('POST', '/library', { game, ...fields });
}

export function updateUserGame(id, patch) {
  return request('PATCH', `/library/${id}`, patch);
}

export function removeFromLibrary(id) {
  return request('DELETE', `/library/${id}`);
}

export function importDemo() {
  return request('POST', '/demo/import');
}

// Игровые сессии

export function getSessions() {
  return request('GET', '/sessions');
}

export function addSession(userGameId, hours) {
  return request('POST', '/sessions', { user_game_id: userGameId, hours });
}

// Цель на год

export async function getGoal(year) {
  const { target } = await request('GET', `/goals/${year}`);
  return target;
}

export async function setGoal(year, target) {
  await request('PUT', `/goals/${year}`, { target });
  return target;
}

// Поиск по справочнику игр

export function searchGames(q) {
  return request('GET', `/games/search?q=${encodeURIComponent(q)}`);
}

const api = {
  getCurrentUser, signIn, signUp, signOut, updateProfile,
  getLibrary, addToLibrary, updateUserGame, removeFromLibrary, importDemo,
  getSessions, addSession, getGoal, setGoal, searchGames,
};

export default api;
