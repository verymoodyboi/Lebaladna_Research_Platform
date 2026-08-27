import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import supabase from '../../lib/supabase';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = 'interview-audio';
const WORKER_URL = process.env.WORKER_URL!;              // e.g. https://interview-pipeline-worker.<subdomain>.workers.dev
const WORKER_SECRET = process.env.INTERNAL_SHARED_SECRET!; // must match the Worker's INTERNAL_SHARED_SECRET

class ServiceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function createJob(userId: string) {
  const jobId = randomUUID();
  const fileKey = `interviews/${jobId}.mp3`; // must match the Worker's key-parsing pattern exactly

  const { error } = await supabase.from('interview_jobs').insert({
    id: jobId,
    file_key: fileKey,
    status: 'pending_upload',
    created_by: userId,
  });
  if (error) throw new ServiceError(`Failed to create job: ${error.message}`, 500);

  const upload_url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: fileKey, ContentType: 'audio/mpeg' }),
    { expiresIn: 300 }
  );

  return { job_id: jobId, upload_url };
}

export async function getJob(jobId: any) {
const oneMinuteAgo = new Date(Date.now() - 120 * 1000).toISOString();

const { data, error } = await supabase
  .from('interview_jobs')
  .select('id, status, transcript, extracted_data, error_message, created_at, completed_at')
  .eq('id', jobId)
  //.gte('created_at', oneMinuteAgo)
  .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no matching row
    throw new ServiceError(`Failed to fetch job: ${error.message}`, 500);
  }
  return data;
}

export async function retryJob(jobId: any) {
  const { data: job, error } = await supabase
    .from('interview_jobs')
    .select('id, status, file_key, attempt_count, max_attempts')
    .eq('id', jobId)
    .single();

  if (error || !job) throw new ServiceError('Job not found', 404);
  if (job.status !== 'failed') {
    throw new ServiceError(`Job is not in a failed state (current: ${job.status})`, 409);
  }
  if (job.attempt_count >= job.max_attempts) {
    throw new ServiceError('Max retry attempts exceeded', 409);
  }

  const res = await fetch(`${WORKER_URL}/enqueue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': WORKER_SECRET },
    body: JSON.stringify({ job_id: job.id, file_key: job.file_key }),
  });

  if (!res.ok) throw new ServiceError(`Worker rejected retry: ${await res.text()}`, 502);
  return { retried: true };
}

export { ServiceError };