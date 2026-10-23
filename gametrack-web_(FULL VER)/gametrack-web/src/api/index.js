// Единая точка доступа к данным.
// Страницы импортируют только этот файл и не знают, где лежат данные:
// если в .env указан Supabase — работаем с облачной БД, иначе с localStorage.

import * as localDb from './localDb';
import * as supabaseDb from './supabaseDb';

export const isSupabase = Boolean(supabaseDb.supabase);

const api = isSupabase ? supabaseDb : localDb;

export default api;
