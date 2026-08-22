interface Env {
  AUDIO_BUCKET: R2Bucket;
  JOB_QUEUE: Queue;
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INTERNAL_SHARED_SECRET: string;
}
