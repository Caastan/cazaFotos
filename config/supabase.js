// config/supabase.js
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const extra = Constants.manifest?.extra ?? Constants.expoConfig?.extra;
if (!extra) throw new Error('No veo expo.extra en app.config.js/app.json');

export const supabase = createClient(
  extra.SUPABASE_URL,
  extra.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: { enabled: false },
  }
);
