import { createClient } from "@supabase/supabase-js";

export function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function updateJob(
  env: Env,
  jobId: string,
  patch: Record<string, unknown>,
) {
  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("interview_jobs")
    .update(patch)
    .eq("id", jobId);
  if (error) throw new Error(`Supabase update failed: ${error.message}`);
}
