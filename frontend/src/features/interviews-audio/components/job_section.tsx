import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  Pause,
  Upload,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Area } from "../../areas/areas.services";
import {
  requestInterviewUpload,
  uploadInterviewAudio,
  getInterviewJob,
  retryInterviewJob,
  type InterviewJob,
  type InterviewJobStatus,
} from "../interviews.services";
import { guessExtensionFromFile, mimeForExt } from "../util/interviews.util";
import { convertToMonoWav16k } from "../util/audio-conv.util";

type ClientStatus = InterviewJobStatus | "uploading" | "upload_failed";

type TrackedJob = {
  id: string;
  label: string;
  clientStatus: ClientStatus;
  extracted_data?: InterviewJob["extracted_data"];
  error_message?: string | null;
};

const TERMINAL: ClientStatus[] = ["completed", "failed", "upload_failed"];

const STATUS_LABEL: Record<ClientStatus, string> = {
  uploading: "Uploading…",
  pending_upload: "Waiting to process…",
  uploaded: "Queued…",
  transcribing: "Transcribing…",
  transcribed: "Transcribed",
  extracting: "Extracting data…",
  completed: "Click to submit →",
  failed: "Failed",
  upload_failed: "Upload failed",
};

/* ---------- Job card ---------- */

function JobCard({
  job,
  onOpen,
  onRetry,
  onDismiss,
}: {
  job: TrackedJob;
  onOpen: (job: TrackedJob) => void;
  onRetry: (job: TrackedJob) => void;
  onDismiss: (job: TrackedJob) => void;
}): React.ReactElement {
  const inProgress = !TERMINAL.includes(job.clientStatus);
  const clickable = job.clientStatus === "completed";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen(job) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onOpen(job);
            }
          : undefined
      }
      className={`focus-brand flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm transition ${
        clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="truncate text-sm font-medium text-ink"
          title={job.label}
        >
          {job.label}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(job);
          }}
          className="focus-brand shrink-0 rounded-full p-0.5 text-ink-soft hover:bg-sage-50 hover:text-ink"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        {inProgress && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-soft" />
        )}
        {/* {job.clientStatus === "completed" && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        )} */}
        {(job.clientStatus === "failed" ||
          job.clientStatus === "upload_failed") && (
          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
        )}
        <span
          className={
            job.clientStatus === "completed"
              ? "font-medium text-emerald-700"
              : job.clientStatus === "failed" ||
                  job.clientStatus === "upload_failed"
                ? "font-medium text-red-700"
                : "text-ink-soft"
          }
        >
          {STATUS_LABEL[job.clientStatus]}
        </span>
      </div>

      {job.error_message &&
        (job.clientStatus === "failed" ||
          job.clientStatus === "upload_failed") && (
          <p className="text-xs text-ink-soft">{job.error_message}</p>
        )}

      {job.clientStatus === "failed" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRetry(job);
          }}
          className="btn-secondary focus-brand mt-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}

      {/* {job.clientStatus === "completed" && (
        <span className="text-xs font-medium text-emerald-700">
          Click to submit →
        </span>
      )} */}
    </div>
  );
}

/* ---------- Section ---------- */

export default function InterviewJobsSection({
  collectionId,
  onReviewJob,
}: {
  collectionId: string;
  onReviewJob: (job: InterviewJob) => void;
}): React.ReactElement {
  const storageKey = `interview-jobs:${collectionId}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);

  const [jobs, setJobs] = useState<TrackedJob[]>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed: { id: string; label: string }[] = JSON.parse(raw);
      return parsed.map((j) => ({
        ...j,
        clientStatus: "pending_upload" as const,
      }));
    } catch {
      return [];
    }
  });
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [openError, setOpenError] = useState("");

  // Persist tracked (real) jobs only — not the transient local-failure rows.
  useEffect(() => {
    const toPersist = jobs
      .filter((j) => !j.id.startsWith("local-"))
      .map((j) => ({ id: j.id, label: j.label }));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(toPersist));
    } catch {
      // storage unavailable — tracking just won't survive a refresh
    }
  }, [jobs, storageKey]);

  const refreshJob = async (jobId: string) => {
    try {
      const job = await getInterviewJob(jobId);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                clientStatus: job.status,
                extracted_data: job.extracted_data,
                error_message: job.error_message,
              }
            : j,
        ),
      );
    } catch {
      // transient — next poll tick will retry
    }
  };

  // Refresh immediately for anything hydrated from localStorage.
  useEffect(() => {
    jobs.forEach((j) => {
      if (!j.id.startsWith("local-")) void refreshJob(j.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 3s for anything still in progress.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setJobs((prev) => {
        prev
          .filter(
            (j) =>
              !j.id.startsWith("local-") &&
              !TERMINAL.includes(j.clientStatus) &&
              j.clientStatus !== "uploading",
          )
          .forEach((j) => void refreshJob(j.id));
        return prev;
      });
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const trackNewUpload = async (file: Blob, label: string) => {
    let uploadBlob: Blob = file;
    let ext = file instanceof File ? guessExtensionFromFile(file) : "webm";

    try {
      uploadBlob = await convertToMonoWav16k(file);
      ext = "wav";
    } catch (err) {
      // Decoding failed (unsupported codec, corrupt file, etc.) — fall back
      // to uploading the original file exactly as before. No behavior change
      // on failure, this is a pure best-effort optimization.
      console.warn(
        "Audio conversion to WAV failed, uploading original file:",
        err,
      );
    }

    let jobId: string;
    let uploadUrl: string;
    try {
      const created = await requestInterviewUpload(ext);
      jobId = created.job_id;
      uploadUrl = created.upload_url;
    } catch (err) {
      setJobs((prev) => [
        {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          label,
          clientStatus: "upload_failed",
          error_message:
            err instanceof Error ? err.message : "Could not start upload.",
        },
        ...prev,
      ]);
      return;
    }

    setJobs((prev) => [
      { id: jobId, label, clientStatus: "uploading" },
      ...prev,
    ]);

    try {
      await uploadInterviewAudio(uploadUrl, uploadBlob, mimeForExt(ext));
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, clientStatus: "uploaded" } : j,
        ),
      );
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                clientStatus: "upload_failed",
                error_message:
                  err instanceof Error ? err.message : "Upload failed.",
              }
            : j,
        ),
      );
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(
      (file) => void trackNewUpload(file, file.name),
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());

        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        void trackNewUpload(
          blob,
          `Recording ${new Date().toLocaleTimeString()}`,
        );
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setPaused(false);
    } catch {
      setRecordError("Microphone access was denied or is unavailable.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state !== "recording") return;
    mediaRecorderRef.current.pause();
    setPaused(true);
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state !== "paused") return;
    mediaRecorderRef.current.resume();
    setPaused(false);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    setPaused(false);
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    setPaused(false);
  };

  const handleRetry = async (job: TrackedJob) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? { ...j, clientStatus: "uploaded", error_message: null }
          : j,
      ),
    );
    try {
      await retryInterviewJob(job.id);
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                clientStatus: "failed",
                error_message:
                  err instanceof Error ? err.message : "Retry failed.",
              }
            : j,
        ),
      );
    }
  };

  const handleDismiss = (job: TrackedJob) => {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
  };

  const handleClearHistory = () => {
    if (jobs.length === 0) return;
    setConfirmClearOpen(true);
  };

  const confirmClearHistory = () => {
    setJobs([]);
    setConfirmClearOpen(false);
  };

  const handleOpen = async (job: TrackedJob) => {
    // re-fetch once on click to guarantee freshest extracted_data before opening the modal
    try {
      const fresh = await getInterviewJob(job.id);
      onReviewJob(fresh);
    } catch (err) {
      setOpenError(
        err instanceof Error ? err.message : "Unable to load job details.",
      );
    }
  };

  return (
    <section className="mt-2 ">
      <div className="mb-4 flex flex-wrap items-end justify-center gap-3">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.caf,.amr,.mp4"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          {!recording && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-secondary focus-brand flex min-w-[3.5rem] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
            >
              <Upload className="h-4 w-4" />
            </button>
          )}

          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-full  btn-primary focus-brand flex min-w-[3.5rem] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
            >
              <Mic className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelRecording}
                aria-label="Cancel recording"
                title="Cancel"
                className="btn-secondary focus-brand flex min-w-[3.5rem] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
              >
                <X className="h-4 w-4" />
              </button>

              {!paused ? (
                <button
                  type="button"
                  onClick={pauseRecording}
                  aria-label="Pause recording"
                  title="Pause"
                  className="btn-secondary focus-brand flex min-w-[3.5rem] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
                >
                  <Pause className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeRecording}
                  aria-label="Resume recording"
                  title="Resume"
                  className="btn-secondary focus-brand flex min-w-[3.5rem] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={stopRecording}
                aria-label="Stop and submit recording"
                title="Submit"
                className="focus-brand flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-sm hover:bg-red-700"
              >
                <span className="block h-5 w-5 rounded-sm bg-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {recordError && (
        <div className="alert-error mb-4 rounded-xl px-4 py-3 text-sm">
          {recordError}
        </div>
      )}

      {openError && (
        <div className="alert-error mb-4 flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm">
          <span>{openError}</span>
          <button
            type="button"
            onClick={() => setOpenError("")}
            className="focus-brand shrink-0 rounded-full p-0.5 hover:bg-black/5"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {jobs.length === 0 ? (
        <></>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleClearHistory}
              className="focus-brand rounded-lg px-2 py-1 text-xs font-medium text-ink-soft hover:bg-sage-50 hover:text-ink"
            >
              Clear history
            </button>
          </div>
          <div className="max-h-[28rem] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 p-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onOpen={handleOpen}
                  onRetry={handleRetry}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {confirmClearOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmClearOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-history-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
          >
            <h3
              id="clear-history-title"
              className="text-base font-semibold text-ink"
            >
              Clear interview history?
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              This removes all recordings from this list. It won&apos;t
              delete the underlying jobs, just remove them from view.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="btn-secondary focus-brand rounded-xl px-3.5 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearHistory}
                className="focus-brand rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Clear history
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
