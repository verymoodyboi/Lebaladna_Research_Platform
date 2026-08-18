import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  ALLOWED_ORIGINS: ('http://localhost:5173/').split(','),
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 100000000000,
  },
};

export default config;
