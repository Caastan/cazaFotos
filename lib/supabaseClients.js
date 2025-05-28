// src/lib/supabaseClients.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoTrueClient } from '@supabase/gotrue-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import { StorageClient } from '@supabase/storage-js';
import Constants from 'expo-constants';

// — tus variables de entorno —
const URL = Constants.expoConfig.extra.SUPABASE_URL;
const KEY = Constants.expoConfig.extra.SUPABASE_ANON_KEY;

// — cliente de Auth estándar —
export const auth = new GoTrueClient({
  url:    `${URL}/auth/v1`,
  headers:{ apikey: KEY, Authorization: `Bearer ${KEY}` },
  storage: AsyncStorage,
});

// — función que obtiene el token actual o null —
async function getToken() {
  const { data: { session } } = await auth.getSession();
  return session?.access_token ?? null;
}

// — fetch envoltorio que inyecta Authorization si hay token —
async function authFetch(url, init = {}) {
  const token = await getToken();
  init.headers = {
    ...init.headers,
    apikey:        KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, init);
}

// — cliente Postgrest con nuestro fetch personalizado —
export const db = new PostgrestClient(`${URL}/rest/v1`, {
  headers: { apikey: KEY },    // la anon key por defecto
  fetch:   authFetch,          // nuestro fetch que añade el JWT si existe
});

// — cliente de Storage, igual que antes —
export const storage = new StorageClient(`${URL}/storage/v1`, {
  apikey:        KEY,
  Authorization: `Bearer ${KEY}`,
  fetch,
});