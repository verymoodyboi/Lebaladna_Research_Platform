
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUB_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing VITE_SUPABASE env vars for client. Make sure VITE_ vars are set.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  
});

export default supabase;
