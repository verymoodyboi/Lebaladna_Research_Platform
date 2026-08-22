// Adjust this import path to wherever apiRequest actually lives in your project
// (matching whatever surveys.services.ts / areas.services.ts already import).
import { apiRequest } from "../../lib/apiClient";

export type InterviewJobStatus =
  | "pending_upload"
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "extracting"
  | "completed"
  | "failed";

export type ExtractedSurveyData = {
  subject_name?: string | null;
  subject_national_id?: string | null;
  area?: string | null;
  subject_family_members_number?: number | null;
  subject_mobile_number?: string | null;
  food_packs_number?: number | null;
  blankets_number?: number | null;
  training_suites?: string | null;
  bride?: boolean | null;
  health?: boolean | null;
  health_notes?: string | null;
  microfinance?: boolean | null;
  microfinance_notes?: string | null;
  additional_notes?: string | null;
};

export type InterviewJob = {
  id: string;
  status: InterviewJobStatus;
  transcript: string | null;
  extracted_data: ExtractedSurveyData | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

/**
 * Creates a job row + presigned R2 upload URL. `extension` must match one
 * the backend recognizes (mp3, wav, m4a, ogg, webm) — see interviews.util.ts.
 */
export async function requestInterviewUpload(
  extension: string,
): Promise<{ job_id: string; upload_url: string }> {
  return apiRequest<{ job_id: string; upload_url: string }>(
    `/interviews?ext=${encodeURIComponent(extension)}`,
    { method: "POST" },
  );
}

/**
 * PUTs the raw audio directly to R2 using the presigned URL. Deliberately
 * bypasses apiRequest — this isn't a call to our API (no auth header, no
 * JSON body, no /message-shaped error parsing), R2 just wants the raw bytes.
 */
export async function uploadInterviewAudio(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload to storage failed (${res.status})`);
  }
}

export async function getInterviewJob(jobId: string): Promise<InterviewJob> {
  return apiRequest<InterviewJob>(`/interviews/${jobId}`);
}

export async function retryInterviewJob(jobId: string): Promise<void> {
  await apiRequest<{ retried: boolean }>(`/interviews/${jobId}/retry`, {
    method: "POST",
  });
}