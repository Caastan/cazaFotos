import 'react-native-url-polyfill/auto';
import { supabase } from '../config/supabase';
import { PostgrestClient } from '@supabase/postgrest-js';
import { StorageClient } from '@supabase/storage-js';

// Extraemos la URL y la KEY directamente del cliente supabase configurado
const URL = supabase.supabaseUrl;
const KEY = supabase.supabaseKey;

/**
 * Cliente PostgREST personalizado
 * - Apunta a la API REST de Supabase para operaciones CRUD en tablas.
 * - Incluye la cabecera apikey en cada petición.
 * - Usa supabase.fetch para adjuntar el token de acceso automáticamente cuando exista sesión.
 */
export const db = new PostgrestClient(`${URL}/rest/v1`, {
  headers: { apikey: KEY },
  fetch: supabase.fetch,
});

/**
 * Función auxiliar para obtener el token de acceso actual
 * - En Supabase v2, reemplaza a session() y devuelve el access_token guardado.
 * - Si ocurre un error al recuperar la sesión, emite un warning y regresa null.
 */
async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Error obteniendo sesión:', error);
    return null;
  }
  return data.session?.access_token || null;
}

/**
 * Cliente de Storage personalizado
 * - Apunta al endpoint de Storage de Supabase para gestionar archivos.
 * - Incluye dinámicamente el token de acceso en la cabecera Authorization antes de cada request.
 * - Esto asegura que las rutas protegidas de Storage acepten el token generado tras login.
 */
export const storage = new StorageClient(`${URL}/storage/v1`, {
  apikey: KEY,
  fetch: async (url, init) => {
    // Obtenemos el token actualizado
    const token = await getAccessToken();
    // Construimos las cabeceras a partir de las que reciba init
    const headers = new Headers(init.headers || {});
    // Si existe token, lo incluimos en Authorization
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Creamos una nueva configuración mergeando las cabeceras
    const _init = { ...init, headers };
    return fetch(url, _init);
  },
});
