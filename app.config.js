import 'dotenv/config';    // carga variables de .env en process.env

export default ({ config }) => {
  return {
    ...config,
    extra: {
      SUPABASE_URL:     process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  };
};