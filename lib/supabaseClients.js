/* lib/supabaseClients.js */
import 'react-native-url-polyfill/auto';
import { supabase } from '../config/supabase';
import { PostgrestClient } from '@supabase/postgrest-js';
import { StorageClient } from '@supabase/storage-js';

// URL y KEY extraídos del objeto supabase
const URL = supabase.supabaseUrl;
const KEY = supabase.supabaseKey;

// Cliente PostgREST: utiliza supabase.fetch para incluir automáticamente el token si hay sesión
export const db = new PostgrestClient(`${URL}/rest/v1`, {
  headers: { apikey: KEY },
  fetch: supabase.fetch,
});

// Función auxiliar que obtiene el token de acceso actual
async function getAccessToken() {
  // Supabase v2 usa getSession() en lugar de session()
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Error obteniendo sesión:', error);
    return null;
  }
  return data.session?.access_token;
}

// Cliente Storage: incorpora el token dinámicamente antes de cada request
export const storage = new StorageClient(`${URL}/storage/v1`, {
  apikey: KEY,
  fetch: async (url, init) => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const _init = { ...init, headers };
    return fetch(url, _init);
  },
});