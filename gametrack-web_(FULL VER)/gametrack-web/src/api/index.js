// Единая точка доступа к данным.
// если в .env указан Supabase — работаем с облачной БД, иначе с localStorage.

import * as localDb from './localDb';
import * as supabaseDb from './supabaseDb';

export const isSupabase = Boolean(supabaseDb.supabase);

const api = isSupabase ? supabaseDb : localDb;

export default api;
