import { getSupabase, updateJob } from "./lib/supabase";
import { transcribeAudio } from "./lib/whisper";
import { extractSurveyData } from "./lib/extract";

interface JobMessage {
  job_id: string;
  file_key: string;
}

// R2 event notifications and our own /enqueue calls have different payload
// shapes. Normalize both into { job_id, file_key } here so processJob never
// has to care which one produced the message.
function normalizeMessage(body: unknown): JobMessage {
  const b = body as any;

  // Shape from our own /enqueue endpoint (manual retry)
  if (b?.job_id && b?.file_key) {
    return { job_id: b.job_id, file_key: b.file_key };
  }

  // Shape from Cloudflare R2 event notifications: { object: { key }, ... }
  const key: string | undefined = b?.object?.key;
  if (key) {
    // key format: interviews/<job_id>.<ext>
    const match = key.match(/interviews\/([^./]+)\.[^.]+$/);
    if (!match) throw new Error(`Could not derive job_id from R2 key: ${key}`);
    return { job_id: match[1], file_key: key };
  }

  throw new Error(`Unrecognized queue message shape: ${JSON.stringify(b)}`);
}

export default {
  // Node API calls this to (re-)enqueue a job — used for manual retry.
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "POST" || new URL(req.url).pathname !== "/enqueue") {
      return new Response("Not found", { status: 404 });
    }
    if (req.headers.get("x-internal-secret") !== env.INTERNAL_SHARED_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json<JobMessage>();
    if (!body.job_id || !body.file_key) {
      return new Response("job_id and file_key required", { status: 400 });
    }

    // guard: don't enqueue if the file no longer exists in R2 (e.g. already completed)
    const head = await env.AUDIO_BUCKET.head(body.file_key);
    if (!head) {
      return new Response(
        "File not found in R2 — cannot retry, re-upload required",
        { status: 409 },
      );
    }

    await updateJob(env, body.job_id, {
      status: "uploaded",
      error_message: null,
    });
    await env.JOB_QUEUE.send(body);
    return new Response(JSON.stringify({ enqueued: true }), { status: 202 });
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const job = normalizeMessage(msg.body);
        await processJob(job, env);
      } catch (err) {

        console.error("Failed to normalize/process queue message:", err);
        msg.ack();
        continue;
      }
      msg.ack(); 
    }
  },
};

async function processJob(job: JobMessage, env: Env) {
  const { job_id, file_key } = job;
  const supabase = getSupabase(env);

  try {
    // bump attempt_count, bail out if max_attempts exceeded
    const { data: current } = await supabase
      .from("interview_jobs")
      .select("attempt_count, max_attempts")
      .eq("id", job_id)
      .single();

    if (current && current.attempt_count >= current.max_attempts) {
      await updateJob(env, job_id, {
        status: "failed",
        error_message: "Max retry attempts exceeded",
      });
      return;
    }
    await updateJob(env, job_id, {
      attempt_count: (current?.attempt_count ?? 0) + 1,
    });

    // 1. fetch from R2
    await updateJob(env, job_id, { status: "transcribing" });
    const object = await env.AUDIO_BUCKET.get(file_key);
    if (!object) throw new Error(`File ${file_key} not found in R2`);
    const audioBlob = await object.blob();

    // 2. Whisper
    const transcript = await transcribeAudio(
      env,
      audioBlob,
      file_key.split("/").pop()!,
    );
    await updateJob(env, job_id, { status: "transcribed", transcript });

    // 3. GPT extraction
    await updateJob(env, job_id, { status: "extracting" });
    const extracted = await extractSurveyData(env, transcript);

    // 4. mark complete
    await updateJob(env, job_id, {
      status: "completed",
      extracted_data: extracted,
      completed_at: new Date().toISOString(),
      error_message: null,
    });

    // 5. delete file — only on full success
   // await env.AUDIO_BUCKET.delete(file_key);
  } catch (err) {
    await updateJob(env, job_id, {
      status: "failed",
      error_message: err instanceof Error ? err.message : String(err),
    });
    // do not rethrow — msg.ack() still runs, no Cloudflare auto-retry
  }
}
