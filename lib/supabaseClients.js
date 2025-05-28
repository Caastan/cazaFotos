// src/lib/supabaseClients.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoTrueClient } from '@supabase/gotrue-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import { StorageClient } from '@supabase/storage-js';
import Constants from 'expo-constants';

// Lee bien de manifest o expoConfig según tu versión de Expo
const extra = Constants.manifest?.extra ?? Constants.expoConfig?.extra;
if (!extra) throw new Error('Define expo.extra con SUPABASE_URL y SUPABASE_ANON_KEY en app.json');

const URL  = extra.SUPABASE_URL;
const KEY  = extra.SUPABASE_ANON_KEY;

// —— Cliente de Auth ——
export const auth = new GoTrueClient({
  url:    `${URL}/auth/v1`,
  headers:{ apikey: KEY, Authorization: `Bearer ${KEY}` },
  storage:        AsyncStorage,
  storageKey:     'supabase.auth.token',
  autoRefreshToken: true,
  persistSession:   true,
});

// —— Cliente de Base de Datos ——
export const db = new PostgrestClient(`${URL}/rest/v1`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  fetch, // usa el fetch nativo de RN
});

// —— Cliente de Storage ——
export const storage = new StorageClient(`${URL}/storage/v1`, {
  apikey:        KEY,
  Authorization: `Bearer ${KEY}`,
  fetch,
});
