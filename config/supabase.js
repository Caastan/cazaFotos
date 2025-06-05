import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const extra = Constants.manifest?.extra ?? Constants.expoConfig?.extra;
if (!extra) throw new Error('No veo expo.extra en app.config.js/app.json');

// Verifico que las variables de entorno necesarias estén definidas
export const supabase = createClient(
  extra.SUPABASE_URL,
  extra.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,           // Uso AsyncStorage para guardar tokens de sesión en el dispositivo
      autoRefreshToken: true,           // Habilito la renovación automática del token antes de que caduque
      persistSession: true,             // Guardo la sesión de forma persistente en el almacenamiento local
      detectSessionInUrl: false,        // Desactivo la detección automática de sesión desde la URL en React Native
    },
    realtime: { enabled: false },
  }
);
