// Работа с облачной базой Supabase.
// Включается автоматически, если в файле .env заполнены VITE_SUPABASE_URL и VITE_SUPABASE_KEY.
// Таблицы и права доступа создаются скриптом supabase/schema.sql.

import { createClient } from '@supabase/supabase-js';
import { toLocalDate } from '../utils/date';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// Ошибки переводим самые частые
function check(error) {
  if (!error) return;
  const msg = error.message || '';
  if (error.code === '23505') throw new Error('Эта игра уже есть в библиотеке');
  if (msg.includes('Invalid login credentials')) throw new Error('Неверный email или пароль');
  if (msg.includes('already registered')) throw new Error('Пользователь с таким email уже зарегистрирован');
  if (msg.includes('Email not confirmed')) throw new Error('Email не подтверждён — проверьте почту');
  if (msg.includes('Password should be')) throw new Error('Пароль должен быть не короче 6 символов');
  throw new Error(msg || 'Ошибка при обращении к базе данных');
}

function mapUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.user_metadata?.name || u.email, created_at: u.created_at };
}

// numeric из PostgreSQL приводим к числу
function normalize(ug) {
  return {
    ...ug,
    playtime_hours: Number(ug.playtime_hours) || 0,
    price: ug.price === null ? null : Number(ug.price),
  };
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Нужно войти в систему');
  return data.session.user.id;
}

// Авторизация

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return mapUser(data.session?.user);
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  check(error);
  return mapUser(data.user);
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  });
  check(error);
  // Если в Supabase включено подтверждение почты, сессии ещё нет
  if (!data.session) return { needsConfirm: true };
  return mapUser(data.user);
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function updateProfile({ name }) {
  const { data, error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
  check(error);
  return mapUser(data.user);
}

// Библиотека

const SELECT_WITH_GAME = '*, game:games(*)';

export async function getLibrary() {
  const { data, error } = await supabase
    .from('user_games')
    .select(SELECT_WITH_GAME)
    .order('updated_at', { ascending: false });
  check(error);
  return data.map(normalize);
}

export async function addToLibrary(game, fields) {
  // Сначала кладём игру в общий справочник (если её там ещё нет)
  const { error: gameError } = await supabase.from('games').upsert(
    {
      id: game.id,
      title: game.title,
      cover_url: game.cover_url,
      release_year: game.release_year,
      developer: game.developer,
      genres: game.genres,
      platforms: game.platforms,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  check(gameError);

  const { data, error } = await supabase
    .from('user_games')
    .insert({ user_id: await currentUserId(), game_id: game.id, ...fields })
    .select(SELECT_WITH_GAME)
    .single();
  check(error);
  return normalize(data);
}

export async function updateUserGame(id, patch) {
  const { data, error } = await supabase
    .from('user_games')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_WITH_GAME)
    .single();
  check(error);
  return normalize(data);
}

export async function removeFromLibrary(id) {
  // это on delete cascade
  const { error } = await supabase.from('user_games').delete().eq('id', id);
  check(error);
}

// Игровые сессии

export async function getSessions() {
  const { data, error } = await supabase.from('game_sessions').select('*');
  check(error);
  return data.map((s) => ({ ...s, hours: Number(s.hours) }));
}

export async function addSession(userGameId, hours, playedOn = toLocalDate()) {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({ user_id: await currentUserId(), user_game_id: userGameId, hours, played_on: playedOn })
    .select()
    .single();
  check(error);
  return { ...data, hours: Number(data.hours) };
}

// Цель на год

export async function getGoal(year) {
  const { data, error } = await supabase.from('yearly_goals').select('target').eq('year', year).maybeSingle();
  check(error);
  return data?.target ?? null;
}

export async function setGoal(year, target) {
  const { error } = await supabase
    .from('yearly_goals')
    .upsert({ user_id: await currentUserId(), year, target }, { onConflict: 'user_id,year' });
  check(error);
  return target;
}
