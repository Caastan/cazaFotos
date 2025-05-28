import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// lee tanto de manifest (legacy) como de expoConfig (nuevo dev client / EAS)
const extra = Constants.manifest?.extra ?? Constants.expoConfig?.extra;

if (!extra) {
  throw new Error(
    '🛑 No encuentro la sección "extra" en tu app.json/app.config.js. ' +
    'Revisa que en tu app.json tengas:\n\n' +
    '  "expo": {\n' +
    '    …,\n' +
    '    "extra": {\n' +
    '      "SUPABASE_URL": "https://xyz.supabase.co",\n' +
    '      "SUPABASE_ANON_KEY": "tu_anon_key"\n' +
    '    }\n' +
    '  }\n'
  );
}

const SUPABASE_URL  = extra.SUPABASE_URL;
const SUPABASE_ANON = extra.SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  realtime: { enabled: false },
});
