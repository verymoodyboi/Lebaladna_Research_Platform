import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/index.js';

if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('upabase not configured: Missing URL or service role key');
}

const supabase: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

console.log('Supabase client initialized');

export default supabase;
