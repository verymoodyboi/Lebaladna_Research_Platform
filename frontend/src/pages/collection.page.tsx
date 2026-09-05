import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Minus, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../layouts/Layout";
import {
  listSurveys,
  createSurvey,
  deleteSurvey,
  type Survey,
  type SurveyStats,
} from "../features/surveys/surveys.services";
import {
  listAreas,
  createArea,
  parseAreaTeams,
  type Area,
} from "../features/areas/areas.services";
import {
  getCollection,
  type Collection,
} from "../features/collections/collections.services";
import {
  TRAINING_SUITE_SIZES,
  stringifyTrainingSuites,
  type SuiteCounts,
} from "../features/surveys/surveys.util";
import InterviewJobsSection from "../features/interviews-audio/components/job_section";
import { mapExtractedDataToFormPatch } from "../features/interviews-audio/util/interviews.util";
import { extractedTrainingSuitesToCounts } from "../features/interviews-audio/util/training-suites-extraction.util";
import type { InterviewJob } from "../features/interviews-audio/interviews.services";

// NOTE (integration): this file assumes the backend + surveys.services.ts
// have been updated to support a "team" column on surveys, mirroring
// area.teams:
//   - Survey (surveys.services.ts) gains: team: string | null
//   - createSurvey()'s input type gains: team?: string
//   - listSurveys() results/rows include `team` on each survey
// Nothing here changes surveys.services.ts directly — only this page and
// areas.services.ts are provided.

type MemberOption = {
  id: string;
  name: string;
};

const EGYPT_PROVINCES = [
  "Cairo",
  "Alexandria",
  "Port Said",
  "Suez",
  "Damietta",
  "Dakahlia",
  "Sharqia",
  "Qalyubia",
  "Kafr El Sheikh",
  "Gharbia",
  "Monufia",
  "Beheira",
  "Ismailia",
  "Giza",
  "Beni Suef",
  "Fayoum",
  "Minya",
  "Asyut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Red Sea",
  "New Valley",
  "Matrouh",
  "North Sinai",
  "South Sinai",
] as const;
/* ---------- Row ---------- */

function SurveyRow({
  survey,
  onSelect,
}: {
  survey: Survey;
  onSelect: (s: Survey) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onSelect(survey)}
      className="focus-brand w-full rounded-xl bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
    >
      {/* Mobile: compact stacked card */}
      <div className="flex flex-col gap-1 sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-ink">{survey.subject_name}</span>
          <span className="shrink-0 whitespace-nowrap text-xs text-ink-soft">
            {survey.subject_family_members_number ?? "—"} members
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-soft">
          <span>
            {survey.area || "—"}
            {survey.team ? ` · ${survey.team}` : ""}
          </span>
          {survey.subject_mobile_number && (
            <>
              <span aria-hidden="true">•</span>
              <span>{survey.subject_mobile_number}</span>
            </>
          )}
        </div>
      </div>

      {/* Tablet/desktop: aligned columns */}
      <div className="hidden sm:grid sm:grid-cols-4 sm:items-center sm:gap-3">
        <span className="font-medium text-ink">{survey.subject_name}</span>
        <span className="text-ink-soft">
          {survey.area || "—"}
          {survey.team ? ` · ${survey.team}` : ""}
        </span>
        <span className="text-ink-soft">
          {survey.subject_mobile_number || "—"}
        </span>
        <span className="text-ink-soft">
          {survey.subject_family_members_number ?? "—"} members
        </span>
      </div>
    </button>
  );
}

/* ---------- Detail dialog ---------- */

function SurveyDetailDialog({
  survey,
  onClose,
  onDeleted,
}: {
  survey: Survey | null;
  onClose: () => void;
  onDeleted: (surveyId: string) => void;
}): React.ReactElement | null {
  const { userInfo } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const canDelete =
    !!survey &&
    (userInfo?.role?.toLowerCase() === "admin" ||
      userInfo?.role?.toLowerCase() === "manager" ||
      userInfo?.user_id === survey.created_by);

  const handleDelete = async () => {
    if (!survey || !canDelete || deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the survey for "${survey.subject_name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteSurvey(survey.survey_id);
      onDeleted(survey.survey_id);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to delete survey.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!survey) return null;

  const rows: [string, React.ReactNode][] = [
    ["Subject name", survey.subject_name],
    ["National ID", survey.subject_national_id || "—"],
    ["Area", survey.area || "—"],
    ["Team", survey.team || "—"],
    ["Mobile number", survey.subject_mobile_number || "—"],
    ["Family members", survey.subject_family_members_number ?? "—"],
    ["Food packs", survey.food_packs_number],
    ["Blankets", survey.blankets_number],
    ["Training suites", survey.training_suites || "—"],
    ["Bride", survey.bride ? "Yes" : "No"],
    ["Health", survey.health ? "Yes" : "No"],
    ["Health notes", survey.health_notes || "—"],
    ["Microfinance", survey.microfinance ? "Yes" : "No"],
    ["Microfinance notes", survey.microfinance_notes || "—"],
    ["Additional notes", survey.additional_notes || "—"],
    [
      "Filled by",
      survey.creator
        ? `${survey.creator.first_name} ${survey.creator.last_name}`
        : "—",
    ],
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 px-4 py-4"
      onClick={onClose}
      style={{ overflow: "hidden" }}
    >
      <div
        className="auth-card relative mx-auto flex w-full max-w-xl flex-col rounded-3xl bg-white shadow-sm"
        style={{
          height: "calc(100dvh - 2rem)",
          maxHeight: "calc(100dvh - 2rem)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="min-h-0 flex-1 overflow-y-scroll p-8"
          style={{
            overflowY: "scroll",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="focus-brand absolute right-5 top-5 rounded-full p-1 text-ink-soft hover:bg-sage-50 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {survey.subject_name}
          </h2>
          <dl className="mt-6 flex flex-col gap-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-sm">
                <dt className="text-ink-soft">{label}</dt>
                <dd className="text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete survey"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Training suites picker ---------- */

function TrainingSuitePicker({
  counts,
  onChange,
}: {
  counts: SuiteCounts;
  onChange: (c: SuiteCounts) => void;
}): React.ReactElement {
  const bump = (size: string, delta: number) => {
    const next = Math.max(0, (counts[size] ?? 0) + delta);
    onChange({ ...counts, [size]: next });
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {TRAINING_SUITE_SIZES.map((size) => (
        <div
          key={size}
          className="flex flex-col items-center gap-1 rounded-xl border border-sage-100 p-2"
        >
          <span className="text-xs font-medium text-ink">{size}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bump(size, -1)}
              className="focus-brand flex h-6 w-6 items-center justify-center rounded-full bg-sage-50 text-ink-soft"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-sm">{counts[size] ?? 0}</span>
            <button
              type="button"
              onClick={() => bump(size, 1)}
              className="focus-brand flex h-6 w-6 items-center justify-center rounded-full bg-sage-50 text-ink-soft"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Fill survey dialog ---------- */

function AddAreaDialog({
  open,
  collectionId,
  initialProvince,
  onClose,
  onCreated,
}: {
  open: boolean;
  collectionId: string;
  initialProvince?: string;
  onClose: () => void;
  onCreated: (area: Area) => void;
}): React.ReactElement | null {
  const [name, setName] = useState("");
  const [province, setProvince] = useState(initialProvince || "");
  const [teams, setTeams] = useState<string[]>([]);
  const [teamInput, setTeamInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setName("");
      setProvince(initialProvince || "");
      setTeams([]);
      setTeamInput("");
      setError("");
      setLoading(false);
    }
  }, [open, initialProvince]);

  if (!open) return null;

  const addTeam = () => {
    const team = teamInput.trim();
    if (!team) return;

    if (teams.some((t) => t.toLowerCase() === team.toLowerCase())) {
      setError(`Team "${team}" was already added.`);
      return;
    }

    setTeams((prev) => [...prev, team]);
    setTeamInput("");
    setError("");
  };

  const removeTeam = (team: string) => {
    setTeams((prev) => prev.filter((t) => t !== team));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const areaName = name.trim();
    if (!province) {
      setError("Province is required.");
      return;
    }
    if (!areaName) {
      setError("Area name is required.");
      return;
    }

    if (teams.length === 0) {
      setError("At least one team is required — add one below.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Teams were added one at a time via the "Add" button below; concat
      // them into the comma-separated string the backend expects.
      const { area } = await createArea({
        collection_id: collectionId,
        area_name: areaName,
        province,
        teams: teams.join(", "),
      });
      onCreated(area);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add area.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="auth-card relative w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="focus-brand absolute right-5 top-5 rounded-full p-1 text-ink-soft hover:bg-sage-50 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-2xl font-semibold text-ink">
          Add area
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          This area will be added to {province || "this collection"}.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="alert-error rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Area name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
              placeholder="Enter area name"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Province</span>

            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              disabled={loading}
              required
              className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
            >
              <option value="">Select province</option>

              {EGYPT_PROVINCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Teams</span>

            <div className="flex gap-2">
              <input
                value={teamInput}
                onChange={(e) => {
                  setTeamInput(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  // Enter adds the team instead of submitting the form.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTeam();
                  }
                }}
                disabled={loading}
                className="input-brand focus-brand min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-sm"
                placeholder="Enter a team name"
              />

              <button
                type="button"
                onClick={addTeam}
                disabled={loading || !teamInput.trim()}
                className="btn-secondary focus-brand inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {teams.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {teams.map((team) => (
                  <span
                    key={team}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 py-1 pl-3 pr-1.5 text-sm text-ink"
                  >
                    {team}
                    <button
                      type="button"
                      onClick={() => removeTeam(team)}
                      disabled={loading}
                      className="focus-brand rounded-full p-0.5 text-ink-soft hover:bg-sage-100 hover:text-ink"
                      aria-label={`Remove ${team}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <span className="text-xs text-ink-soft">
              Add each team one at a time, then submit. They're combined into
              one list for the area.
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary focus-brand w-full rounded-xl py-3 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary focus-brand w-full rounded-xl py-3 text-sm font-semibold"
            >
              {loading ? "Adding..." : "Add area"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BLANK_SURVEY_FORM = {
  subject_name: "",
  subject_national_id: "",
  area_id: "",
  team: "",
  subject_family_members_number: "",
  food_packs_number: "0",
  blankets_number: "0",
  subject_mobile_number: "",
  bride: false,
  health: false,
  microfinance: false,
  microfinance_notes: "",
  health_notes: "",
  additional_notes: "",
};

function FillSurveyDialog({
  open,
  collectionId,
  collectionProvince,
  areas,
  canAddArea,
  onClose,
  onCreated,
  onAreaCreated,
  initialData,
  initialSuiteCounts,
  sourceJobId,
  currentAreaId,
  currentTeam,
}: {
  open: boolean;
  collectionId: string;
  collectionProvince: string;
  areas: Area[];
  canAddArea: boolean;
  onClose: () => void;
  onCreated: (s: Survey) => void;
  onAreaCreated: (area: Area) => void;
  /** Pre-fills the form (e.g. from a completed interview job) instead of starting blank. */
  initialData?: Partial<typeof BLANK_SURVEY_FORM>;
  /** Pre-fills the training suite picker from the same interview job, if any. */
  initialSuiteCounts?: SuiteCounts;
  /** interview_jobs.id this survey is being created from, if any — links the two on submit. */
  sourceJobId?: string;
  /** The page's "current area" default (from the URL) — pre-fills area_id for manual and audio surveys alike. */
  currentAreaId?: string;
  /** The page's "current team" default (from the URL) — pre-fills team for manual and audio surveys alike. */
  currentTeam?: string;
}): React.ReactElement | null {
  const { userInfo } = useAuth();
  const [form, setForm] = useState({
    ...BLANK_SURVEY_FORM,
    ...initialData,
    area_id: currentAreaId || initialData?.area_id || "",
    team: currentTeam || initialData?.team || "",
  });
  const [suiteCounts, setSuiteCounts] = useState<SuiteCounts>(
    initialSuiteCounts ?? {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...BLANK_SURVEY_FORM,
        ...initialData,
        // The page's current area/team (picked once, encoded in the URL)
        // automatically fill every subsequent survey — manual or
        // audio-derived — so the user doesn't have to re-select them each
        // time. They can still be changed per survey below.
        area_id: currentAreaId || initialData?.area_id || "",
        team: currentTeam || initialData?.team || "",
      });
      setSuiteCounts(initialSuiteCounts ?? {});
      setError("");
      setAddAreaOpen(false);
      setAudioUnavailable(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    initialData,
    initialSuiteCounts,
    currentAreaId,
    currentTeam,
    sourceJobId,
  ]);

  const availableTeams = useMemo(() => {
    const area = areas.find((a) => a.area_id === form.area_id);
    return area ? parseAreaTeams(area.teams) : [];
  }, [areas, form.area_id]);

  if (!open) return null;

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDigits = (key: keyof typeof form, value: string) =>
    set(key, value.replace(/\D/g, ""));

  const handleAreaChange = (newAreaId: string) => {
    const newArea = areas.find((a) => a.area_id === newAreaId);
    const newAreaTeams = newArea ? parseAreaTeams(newArea.teams) : [];
    setForm((f) => ({
      ...f,
      area_id: newAreaId,
      // Keep the current team only if it's actually valid for the newly
      // selected area, otherwise clear it so a mismatched team can't be
      // submitted.
      team: newAreaTeams.includes(f.team) ? f.team : "",
    }));
  };

  const hasSupportRequest = form.bride || form.health || form.microfinance;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const subjectName = form.subject_name.trim();
    const nationalId = form.subject_national_id.trim();
    const familyMembers = form.subject_family_members_number.trim();
    const foodPacks = form.food_packs_number.trim();
    const blankets = form.blankets_number.trim();
    const mobileNumber = form.subject_mobile_number.trim();

    if (!subjectName) {
      setError("Subject name is required.");
      return;
    }

    if (!/^\d{14}$/.test(nationalId)) {
      setError("National ID must contain exactly 14 numbers.");
      return;
    }

    if (!form.area_id) {
      setError("Area is required.");
      return;
    }

    if (availableTeams.length > 0 && !form.team) {
      setError("Team is required for the selected area.");
      return;
    }

    if (!/^\d+$/.test(familyMembers) || Number(familyMembers) <= 0) {
      setError("Family members must be a number greater than 0.");
      return;
    }

    if (!/^\d+$/.test(foodPacks) || Number(foodPacks) < 0) {
      setError("Food packs must be a valid number and can be 0.");
      return;
    }

    if (!/^\d+$/.test(blankets) || Number(blankets) < 0) {
      setError("Blankets must be a valid number and can be 0.");
      return;
    }

    if (hasSupportRequest && !mobileNumber) {
      setError(
        "Mobile number is required when Bride, Health, or Microfinance is enabled.",
      );
      return;
    }

    if (mobileNumber && !/^\d+$/.test(mobileNumber)) {
      setError("Mobile number can contain numbers only.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { survey } = await createSurvey({
        collection_id: collectionId,
        subject_name: subjectName,
        subject_national_id: nationalId,
        area_id: form.area_id,
        team: form.team || undefined,
        // NOTE: requires surveys.services.ts's createSurvey() input type and
        // implementation to accept and forward this optional "team" field
        // (see integration note near the top of this file).
        subject_family_members_number: Number(familyMembers),
        food_packs_number: Number(foodPacks),
        blankets_number: Number(blankets),
        training_suites: stringifyTrainingSuites(suiteCounts) || undefined,
        subject_mobile_number: mobileNumber || undefined,
        bride: form.bride,
        health: form.health,
        microfinance: form.microfinance,
        microfinance_notes: form.microfinance_notes.trim() || undefined,
        health_notes: form.health_notes.trim() || undefined,
        additional_notes: form.additional_notes.trim() || undefined,
      });

      onCreated(survey);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save survey.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Dialog wrapper */}
      <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center p-4">
        {/* Dialog */}
        <div
          className="auth-card flex h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - fixed */}
          <div className="shrink-0 border-b border-sage-100 px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Fill survey
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="focus-brand rounded-full p-1 text-ink-soft hover:bg-sage-50 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
              {/* Filled by */}
              <div className="flex w-full flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Filled by</span>

                <div className="input-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink-soft">
                  {userInfo?.first_name} {userInfo?.last_name}
                </div>
              </div>

              {/* Original recording — only present for surveys created from an interview job */}
              {sourceJobId && (
                <div className="flex flex-col gap-1.5 rounded-xl bg-sage-50 p-3">
                  <span className="text-sm font-medium text-ink">
                    Original recording
                  </span>

                  {audioUnavailable ? (
                    <p className="text-xs text-ink-soft">
                      The audio for this interview is no longer available.
                    </p>
                  ) : (
                    <audio
                      key={sourceJobId}
                      controls
                      preload="none"
                      src={`https://interviews.try-yugen.com/interviews/${sourceJobId}.mp3`}
                      onError={() => setAudioUnavailable(true)}
                      className="w-full"
                    >
                      Your browser does not support audio playback.
                    </audio>
                  )}
                </div>
              )}

              {/* Subject information */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Subject name */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Subject name
                  </span>

                  <input
                    value={form.subject_name}
                    onChange={(e) => set("subject_name", e.target.value)}
                    disabled={loading}
                    required
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                {/* National ID */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    National ID
                  </span>

                  <input
                    inputMode="numeric"
                    maxLength={14}
                    value={form.subject_national_id}
                    onChange={(e) =>
                      setDigits("subject_national_id", e.target.value)
                    }
                    disabled={loading}
                    required
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                {/* Area */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">Area</span>

                  <div className="flex gap-2">
                    <select
                      value={form.area_id}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      disabled={loading}
                      required
                      className="input-brand focus-brand min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-sm"
                    >
                      <option value="">Select area</option>

                      {areas.map((area) => (
                        <option key={area.area_id} value={area.area_id}>
                          {area.area_name}
                        </option>
                      ))}
                    </select>

                    {canAddArea && (
                      <button
                        type="button"
                        onClick={() => setAddAreaOpen(true)}
                        disabled={loading}
                        className="btn-secondary focus-brand inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold"
                        title="Add new area"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    )}
                  </div>

                  {areas.length === 0 && (
                    <p className="text-xs text-ink-soft">
                      No areas have been added to this collection yet.
                      {canAddArea ? " Add one to continue." : ""}
                    </p>
                  )}
                </div>

                {/* Team */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">Team</span>

                  <select
                    value={form.team}
                    onChange={(e) => set("team", e.target.value)}
                    disabled={loading || availableTeams.length === 0}
                    required={availableTeams.length > 0}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="">
                      {form.area_id
                        ? availableTeams.length === 0
                          ? "No teams for this area"
                          : "Select team"
                        : "Select an area first"}
                    </option>

                    {availableTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile number */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Mobile number
                  </span>

                  <input
                    inputMode="numeric"
                    value={form.subject_mobile_number}
                    onChange={(e) =>
                      setDigits("subject_mobile_number", e.target.value)
                    }
                    disabled={loading}
                    required={hasSupportRequest}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                {/* Family members */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Family members
                  </span>

                  <input
                    inputMode="numeric"
                    min={1}
                    value={form.subject_family_members_number}
                    onChange={(e) =>
                      setDigits("subject_family_members_number", e.target.value)
                    }
                    disabled={loading}
                    required
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                {/* Food packs */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Food packs
                  </span>

                  <input
                    inputMode="numeric"
                    min={0}
                    value={form.food_packs_number}
                    onChange={(e) =>
                      setDigits("food_packs_number", e.target.value)
                    }
                    disabled={loading}
                    required
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                {/* Blankets */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">Blankets</span>

                  <input
                    inputMode="numeric"
                    min={0}
                    value={form.blankets_number}
                    onChange={(e) =>
                      setDigits("blankets_number", e.target.value)
                    }
                    disabled={loading}
                    required
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>
              </div>

              {/* Training suites */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">
                  Training suites
                </span>

                <TrainingSuitePicker
                  counts={suiteCounts}
                  onChange={setSuiteCounts}
                />
              </div>

              {/* Support requests */}
              {/* NOTE: these are plain buttons driven directly by React state
                  rather than a hidden checkbox + peer-checked CSS. The old
                  sr-only checkbox pattern relied on the browser's native
                  label-click delegation, which on mobile could race with
                  React's controlled `checked` state (iOS Safari in
                  particular sometimes fires the native toggle before React
                  re-renders), producing a visible flicker or a tap that
                  silently didn't register. A button with no underlying
                  native input has no separate state to desync from. */}
              <div className="flex flex-wrap gap-5">
                {(["bride", "health", "microfinance"] as const).map((key) => {
                  const checked = form[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm text-ink"
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        aria-label={key}
                        disabled={loading}
                        onClick={() => set(key, !checked)}
                        style={{
                          touchAction: "manipulation",
                          WebkitTapHighlightColor: "transparent",
                        }}
                        className={`focus-brand relative h-6 w-11 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          checked
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-sage-300 bg-sage-100"
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            checked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => set(key, !checked)}
                        style={{ touchAction: "manipulation" }}
                        className={`focus-brand text-left ${
                          checked ? "font-semibold text-emerald-700" : ""
                        }`}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Health notes */}
              {form.health && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Health notes
                  </span>

                  <textarea
                    value={form.health_notes}
                    onChange={(e) => set("health_notes", e.target.value)}
                    disabled={loading}
                    rows={2}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>
              )}

              {/* Microfinance notes */}
              {form.microfinance && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Microfinance notes
                  </span>

                  <textarea
                    value={form.microfinance_notes}
                    onChange={(e) => set("microfinance_notes", e.target.value)}
                    disabled={loading}
                    rows={2}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>
              )}

              {/* Additional notes */}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">
                  Additional notes
                </span>

                <textarea
                  value={form.additional_notes}
                  onChange={(e) => set("additional_notes", e.target.value)}
                  disabled={loading}
                  rows={2}
                  className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                />
              </label>

              {/* Buttons */}
              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn-secondary focus-brand w-full rounded-xl py-3 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || areas.length === 0}
                  className="btn-primary focus-brand w-full rounded-xl py-3 text-sm font-semibold"
                >
                  {loading ? "Saving..." : "Save survey"}
                </button>
              </div>

              {/* Required field / validation warning — shown below the
                  submit button so it reads as feedback on the attempted
                  submit rather than a blocking banner at the top. */}
              {error && (
                <div className="alert-error rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <div className="pb-2" />
            </form>
          </div>
        </div>
      </div>

      {/* Add Area Dialog */}
      <AddAreaDialog
        open={addAreaOpen}
        collectionId={collectionId}
        initialProvince={collectionProvince}
        onClose={() => setAddAreaOpen(false)}
        onCreated={(area) => {
          onAreaCreated(area);
          // A newly created area comes with its own fresh team list, so
          // select it and clear any previously chosen team.
          set("area_id", area.area_id);
          set("team", "");
        }}
      />
    </>
  );
}

/* ---------- Page ---------- */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="w-[7.5rem] shrink-0 snap-start rounded-2xl bg-white p-3 shadow-sm sm:w-auto sm:shrink sm:p-4">
      <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-soft sm:text-xs">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

function SurveyTotals({
  stats,
  title = "Survey stats",
}: {
  stats: SurveyStats;
  title?: string;
}): React.ReactElement {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <span className="text-sm text-ink-soft">{stats.cases} cases</span>
      </div>

      {/* Horizontally scrollable strip on mobile so all stats stay
          reachable without crowding a phone screen; a normal grid from
          the sm breakpoint up. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
        <StatCard label="Cases" value={stats.cases} />
        <StatCard label="Areas" value={stats.areas} />
        <StatCard label="Family members" value={stats.family_members} />
        <StatCard label="Food packs" value={stats.food_packs} />
        <StatCard label="Blankets" value={stats.blankets} />
      <StatCard
          label="Blankets/Case"
            value={(stats.blankets / stats.cases || 0).toFixed(2)}
        />

        <StatCard label="Health" value={stats.health_cases} />
        <StatCard label="Brides" value={stats.brides} />
        <StatCard label="Microfinance" value={stats.microfinance_cases} />
        <StatCard
          label="Training suites"
          value={Object.values(stats.training_suites).reduce(
            (sum, value) => sum + value,
            0,
          )}
        />
      </div>

      {Object.keys(stats.training_suites).length > 0 && (
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-ink-soft">
            Training suite breakdown
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRAINING_SUITE_SIZES.map((size) => (
              <span
                key={size}
                className="rounded-full bg-sage-50 px-3 py-1.5 text-sm font-medium text-ink"
              >
                {size}: {stats.training_suites[size] ?? 0}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CollectionStats({
  collection,
}: {
  collection: Collection;
}): React.ReactElement {
  const needs = [
    ["Cases", collection.number_of_cases],
    ["Areas", collection.number_of_areas],
    ["Food packs", collection.food_packs_needed],
    ["Blankets", collection.blankets_needed],
    ["Health", collection.health_cases_needed],
    ["Brides", collection.brides_needed],
    ["Microfinance", collection.microfinance_cases_needed],
  ] as const;

  const training = [
    ["8M", collection.training_suite_8m],
    ["10M", collection.training_suite_10m],
    ["12M", collection.training_suite_12m],
    ["14M", collection.training_suite_14m],
    ["16M", collection.training_suite_16m],
    ["8F", collection.training_suite_8f],
    ["10F", collection.training_suite_10f],
    ["12F", collection.training_suite_12f],
    ["14F", collection.training_suite_14f],
    ["16F", collection.training_suite_16f],
  ] as const;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-ink-soft">
            Collection stats
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            {collection.collection_name}
          </h2>
          <p className="text-sm text-ink-soft">{collection.province}</p>
        </div>
        <span className="text-xs text-ink-soft">
          Created {new Date(collection.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {needs.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold uppercase text-ink-soft">
          Training suite needs
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {training.map(([size, value]) => (
            <span
              key={size}
              className="rounded-full bg-sage-50 px-3 py-1.5 text-sm font-medium text-ink"
            >
              {size}: {value}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CollectionPage(): React.ReactElement {
  const { collectionId = "" } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const canAddArea = ["admin", "manager"].includes(
    String(userInfo?.role ?? "").toLowerCase(),
  );

  const [collection, setCollection] = useState<Collection | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  // The "current area" / "current team" are encoded in the page URL
  // (?area=...&team=...) so they persist across refreshes and can be
  // shared. Surveys filled while these are set — manual or audio-derived —
  // are automatically pre-filled with them instead of requiring a re-select
  // every time.
  const currentAreaId = searchParams.get("area") || "";
  const currentTeam = searchParams.get("team") || "";

  const currentAreaTeams = useMemo(() => {
    const area = areas.find((a) => a.area_id === currentAreaId);
    return area ? parseAreaTeams(area.teams) : [];
  }, [areas, currentAreaId]);

  const setCurrentArea = (nextAreaId: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextAreaId) next.set("area", nextAreaId);
    else next.delete("area");
    // A new area may not have the previously selected team, so clear it.
    next.delete("team");
    setSearchParams(next, { replace: true });
  };

  const setCurrentTeam = (nextTeam: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextTeam) next.set("team", nextTeam);
    else next.delete("team");
    setSearchParams(next, { replace: true });
  };
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [totalStats, setTotalStats] = useState<SurveyStats>({
    cases: 0,
    areas: 0,
    family_members: 0,
    food_packs: 0,
    blankets: 0,
    health_cases: 0,
    brides: 0,
    microfinance_cases: 0,
    training_suites: {},
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [areaId, setAreaId] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<MemberOption[]>([]);

  // Teams available for the "Team" filter — scoped to the selected Area
  // filter, or the union of every team across all areas when no area
  // filter is set.
  const filterAreaTeams = useMemo(() => {
    if (areaId) {
      const area = areas.find((a) => a.area_id === areaId);
      return area ? parseAreaTeams(area.teams) : [];
    }

    const seen = new Set<string>();
    const all: string[] = [];
    for (const area of areas) {
      for (const team of parseAreaTeams(area.teams)) {
        const key = team.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(team);
      }
    }
    return all.sort((a, b) => a.localeCompare(b));
  }, [areas, areaId]);

  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Survey | null>(null);
  const [fillOpen, setFillOpen] = useState(false);
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [interviewPrefill, setInterviewPrefill] = useState<{
    jobId: string;
    data: Partial<typeof BLANK_SURVEY_FORM>;
    suiteCounts: SuiteCounts;
  } | null>(null);

  const handleReviewInterviewJob = (job: InterviewJob) => {
    if (!job.extracted_data) return;

    const patch = mapExtractedDataToFormPatch(job.extracted_data, areas);
    // Additional notes must always be entered manually — never auto-filled
    // from the audio transcript extraction, even though the rest of the
    // extracted data is used to pre-fill the form.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { additional_notes: _omittedAdditionalNotes, ...patchWithoutNotes } =
      patch;

    setInterviewPrefill({
      jobId: job.id,
      data: patchWithoutNotes,
      suiteCounts: extractedTrainingSuitesToCounts(
        (
          job.extracted_data as {
            training_suites?: { size: string; count: number }[];
          }
        ).training_suites,
      ),
    });
    setFillOpen(true);
  };

  const toIsoStart = (date: string) =>
    new Date(`${date}T00:00:00`).toISOString();

  const toIsoEndExclusive = (date: string) => {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + 1);
    return next.toISOString();
  };

  const loadSurveys = async (withInitialLoading = false) => {
    if (withInitialLoading) setLoading(true);
    else setLoadingFilters(true);

    try {
      const { surveys: data, totalStats: stats } = await listSurveys(
        collectionId,
        {
          dateFrom: dateFrom ? toIsoStart(dateFrom) : undefined,
          dateTo: dateTo ? toIsoEndExclusive(dateTo) : undefined,
          areaId: areaId || undefined,
          // NOTE: requires listSurveys() (surveys.services.ts) to accept
          // and forward this optional "team" filter, same as areaId/memberId.
          team: teamFilter || undefined,
          memberId: memberId || undefined,
        },
      );
      setSurveys(data);
      setTotalStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load surveys.");
    } finally {
      if (withInitialLoading) setLoading(false);
      else setLoadingFilters(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [
          { collection: collectionData },
          { areas: areaData },
          surveyData,
        ] = await Promise.all([
          getCollection(collectionId),
          listAreas(collectionId),
          listSurveys(collectionId),
        ]);

        if (cancelled) return;

        setCollection(collectionData);
        setAreas(areaData);
        setSurveys(surveyData.surveys);
        setTotalStats(surveyData.totalStats);
        setMembers(
          Array.from(
            new Map(
              surveyData.surveys
                .filter((survey) => survey.created_by && survey.creator)
                .map((survey) => [
                  survey.created_by as string,
                  {
                    id: survey.created_by as string,
                    name: `${survey.creator?.first_name ?? ""} ${
                      survey.creator?.last_name ?? ""
                    }`.trim(),
                  },
                ]),
            ).values(),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load collection.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAreaId("");
    setTeamFilter("");
    setMemberId("");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loading) {
        void loadSurveys(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [dateFrom, dateTo, areaId, teamFilter, memberId]);

  const handleAreaCreated = (area: Area) => {
    setAreas((prev) =>
      [...prev, area].sort((a, b) => a.area_name.localeCompare(b.area_name)),
    );
  };

  const refreshAfterSurveyChange = async () => {
    await loadSurveys(false);
  };

  return (
    <Layout>
      <Layout.Header userInfo={userInfo ?? undefined} />{" "}
      <Layout.Body>
        <section className="flex items-center justify-between gap-4 pb-6 pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="focus-brand flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to collections
          </button>

          <div className="flex items-center gap-2">
            {canAddArea && (
              <button
                type="button"
                onClick={() => setAddAreaOpen(true)}
                className="btn-secondary focus-brand flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add area
              </button>
            )}
          </div>
        </section>

        <section className="mb-6 rounded-2xl border-2 border-emerald-200 bg-sage-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
              Working context
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase text-ink-soft">
                Current area
              </span>
              <select
                value={currentAreaId}
                onChange={(e) => setCurrentArea(e.target.value)}
                className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm font-medium"
              >
                <option value="">No default area</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase text-ink-soft">
                Current team
              </span>
              <select
                value={currentTeam}
                onChange={(e) => setCurrentTeam(e.target.value)}
                disabled={currentAreaTeams.length === 0}
                className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm font-medium"
              >
                <option value="">
                  {currentAreaId
                    ? currentAreaTeams.length === 0
                      ? "No teams for this area"
                      : "No default team"
                    : "Select an area first"}
                </option>
                {currentAreaTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-3 text-xs text-ink-soft">
            Surveys you fill from here on — manual or from an audio interview —
            start pre-filled with this area and team. You can still change them
            per survey.
          </p>
        </section>

        {error && !loading && (
          <div className="alert-error mb-5 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-soft">Loading collection...</p>
        ) : (
          <>
            {/* {collection && <CollectionStats collection={collection} />} */}

            {/* Add a survey — manual entry and the audio interview flow are
                grouped together in one card so both ways of starting a
                survey are visually close to each other. */}
            <section className="mb-8 rounded-2xl border border-sage-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-xl font-semibold text-ink">
                Add a survey
              </h2>
              <p className="mb-4 text-sm text-ink-soft">
                Fill one in on the spot, or record an interview and review it
                once it's transcribed.
              </p>

              {/* Stacked at every breakpoint (not side-by-side on desktop):
                  InterviewJobsSection lays its own header out with
                  justify-between (title/description left, Upload/Record
                  buttons pinned right), so squeezing it into a flex-1
                  sibling next to the manual button was stretching that
                  internal row across the leftover width — pushing the
                  audio buttons far from "Fill survey manually" and leaving
                  the job card floating underneath, disconnected from
                  either. A divider keeps the two options visually
                  distinct without relying on side-by-side space. */}
              <div className="flex flex-col gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setInterviewPrefill(null);
                    setFillOpen(true);
                  }}
                  className="btn-primary focus-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-sm sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Fill survey manually
                </button>

                <div className="border-t border-sage-100 pt-6">
                  <InterviewJobsSection
                    collectionId={collectionId}
                    onReviewJob={handleReviewInterviewJob}
                  />
                </div>
              </div>
            </section>

            {/* Survey records — kept visually separate from the "Add a
                survey" card above. */}
            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Survey records
                  </h2>
                  <p className="text-sm text-ink-soft">
                    Filter by date, area, team, or the member who filled the
                    survey.
                  </p>
                </div>

                {(dateFrom || dateTo || areaId || teamFilter || memberId) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-secondary focus-brand rounded-xl px-3 py-2 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-sage-50 p-4 sm:grid-cols-3 lg:grid-cols-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-ink-soft">
                    From
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-ink-soft">
                    To
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-ink-soft">
                    Area
                  </span>
                  <select
                    value={areaId}
                    onChange={(e) => {
                      const newAreaId = e.target.value;
                      setAreaId(newAreaId);
                      // The team filter is scoped to the selected area, so
                      // clear it whenever the area filter changes.
                      setTeamFilter("");
                    }}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="">All areas</option>
                    {areas.map((area) => (
                      <option key={area.area_id} value={area.area_id}>
                        {area.area_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-ink-soft">
                    Team
                  </span>
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    disabled={filterAreaTeams.length === 0}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="">
                      {filterAreaTeams.length === 0 ? "No teams" : "All teams"}
                    </option>
                    {filterAreaTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-ink-soft">
                    Member
                  </span>
                  <select
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="input-brand focus-brand rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="">All members</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <SurveyTotals
                stats={totalStats}
                title={
                  dateFrom || dateTo || areaId || teamFilter || memberId
                    ? "Filtered survey stats"
                    : "Survey stats"
                }
              />

              {loadingFilters && (
                <p className="mt-3 text-sm text-ink-soft">
                  Updating results...
                </p>
              )}

              <div className="mt-5 hidden gap-3 px-4 pb-2 text-xs font-semibold uppercase text-ink-soft sm:grid sm:grid-cols-4">
                <span>Name</span>
                <span>Area</span>
                <span>Mobile</span>
                <span>Members</span>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {surveys.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    No surveys match the selected filters.
                  </p>
                ) : (
                  surveys.map((survey) => (
                    <SurveyRow
                      key={survey.survey_id}
                      survey={survey}
                      onSelect={setSelected}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </Layout.Body>
      <Layout.Footer />
      <SurveyDetailDialog
        survey={selected}
        onClose={() => setSelected(null)}
        onDeleted={async () => {
          setSelected(null);
          await refreshAfterSurveyChange();
        }}
      />
      <AddAreaDialog
        open={addAreaOpen}
        initialProvince={collection?.province ?? ""}
        collectionId={collectionId}
        onClose={() => setAddAreaOpen(false)}
        onCreated={handleAreaCreated}
      />
      <FillSurveyDialog
        open={fillOpen}
        collectionId={collectionId}
        collectionProvince={collection?.province ?? ""}
        areas={areas}
        canAddArea={canAddArea}
        initialData={interviewPrefill?.data}
        initialSuiteCounts={interviewPrefill?.suiteCounts}
        sourceJobId={interviewPrefill?.jobId}
        currentAreaId={currentAreaId}
        currentTeam={currentTeam}
        onClose={() => {
          setFillOpen(false);
          setInterviewPrefill(null);
        }}
        onCreated={async (survey) => {
          setFillOpen(false);
          setInterviewPrefill(null);

          if (survey.created_by && survey.creator) {
            setMembers((prev) => {
              if (prev.some((member) => member.id === survey.created_by)) {
                return prev;
              }

              return [
                ...prev,
                {
                  id: survey.created_by as string,
                  name: `${survey.creator?.first_name ?? ""} ${
                    survey.creator?.last_name ?? ""
                  }`.trim(),
                },
              ].sort((a, b) => a.name.localeCompare(b.name));
            });
          }

          await refreshAfterSurveyChange();
        }}
        onAreaCreated={handleAreaCreated}
      />
    </Layout>
  );
}
