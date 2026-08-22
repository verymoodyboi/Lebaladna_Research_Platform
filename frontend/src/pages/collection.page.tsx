import React, { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
      className="focus-brand grid w-full grid-cols-4 gap-3 rounded-xl bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="font-medium text-ink">{survey.subject_name}</span>
      <span className="text-ink-soft">{survey.area || "—"}</span>
      <span className="text-ink-soft">
        {survey.subject_mobile_number || "—"}
      </span>
      <span className="text-ink-soft">
        {survey.subject_family_members_number ?? "—"} members
      </span>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setName("");
      setProvince(initialProvince || "");
      setError("");
      setLoading(false);
    }
  }, [open, initialProvince]);

  if (!open) return null;

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

    setLoading(true);
    setError("");

    try {
      const { area } = await createArea({
        collection_id: collectionId,
        area_name: areaName,
        province,
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

function FillSurveyDialog({
  open,
  collectionId,
  collectionProvince,
  areas,
  canAddArea,
  onClose,
  onCreated,
  onAreaCreated,
}: {
  open: boolean;
  collectionId: string;
  collectionProvince: string;
  areas: Area[];
  canAddArea: boolean;
  onClose: () => void;
  onCreated: (s: Survey) => void;
  onAreaCreated: (area: Area) => void;
}): React.ReactElement | null {
  const { userInfo } = useAuth();
  const [form, setForm] = useState({
    subject_name: "",
    subject_national_id: "",
    area_id: "",
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
  });
  const [suiteCounts, setSuiteCounts] = useState<SuiteCounts>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addAreaOpen, setAddAreaOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        subject_name: "",
        subject_national_id: "",
        area_id: "",
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
      });
      setSuiteCounts({});
      setError("");
      setAddAreaOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDigits = (key: keyof typeof form, value: string) =>
    set(key, value.replace(/\D/g, ""));

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
                {error && (
                  <div className="alert-error rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                {/* Filled by */}
                <div className="flex w-full flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">
                    Filled by
                  </span>

                  <div className="input-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink-soft">
                    {userInfo?.first_name} {userInfo?.last_name}
                  </div>
                </div>

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
                        onChange={(e) => set("area_id", e.target.value)}
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
                        setDigits(
                          "subject_family_members_number",
                          e.target.value,
                        )
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
                    <span className="text-sm font-medium text-ink">
                      Blankets
                    </span>

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
                <div className="flex flex-wrap gap-5">
                  {(["bride", "health", "microfinance"] as const).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => set(key, e.target.checked)}
                        disabled={loading}
                        className="peer sr-only"
                      />

<span className="relative h-6 w-11 rounded-full border border-sage-300 bg-sage-100 transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600">
  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
</span>

<span className="peer-checked:font-semibold peer-checked:text-emerald-700">
  {key.charAt(0).toUpperCase() + key.slice(1)}
</span>
                    </label>
                  ))}
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
                      onChange={(e) =>
                        set("microfinance_notes", e.target.value)
                      }
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
                <div className="mt-1 flex gap-3 pb-2">
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
            set("area_id", area.area_id);
          }}
        />
      </>
      );
      <AddAreaDialog
        open={addAreaOpen}
        collectionId={collectionId}
        initialProvince={collectionProvince}
        onClose={() => setAddAreaOpen(false)}
        onCreated={(area) => {
          onAreaCreated(area);
          set("area_id", area.area_id);
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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase text-ink-soft">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function SurveyTotals({
  stats,
  title = "Survey totals",
}: {
  stats: SurveyStats;
  title?: string;
}): React.ReactElement {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <span className="text-sm text-ink-soft">{stats.cases} cases</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Cases" value={stats.cases} />
        <StatCard label="Areas" value={stats.areas} />
        <StatCard label="Family members" value={stats.family_members} />
        <StatCard label="Food packs" value={stats.food_packs} />
        <StatCard label="Blankets" value={stats.blankets} />
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

  const canAddArea = ["admin", "manager"].includes(
    String(userInfo?.role ?? "").toLowerCase(),
  );

  const [collection, setCollection] = useState<Collection | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
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
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<MemberOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Survey | null>(null);
  const [fillOpen, setFillOpen] = useState(false);
  const [addAreaOpen, setAddAreaOpen] = useState(false);

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
    setMemberId("");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loading) {
        void loadSurveys(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [dateFrom, dateTo, areaId, memberId]);

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

            <button
              type="button"
              onClick={() => setFillOpen(true)}
              className="btn-primary focus-brand flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Fill survey
            </button>
          </div>
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

            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Surveys
                  </h2>
                  <p className="text-sm text-ink-soft">
                    Filter by date, area, or the member who filled the survey.
                  </p>
                </div>

                {(dateFrom || dateTo || areaId || memberId) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-secondary focus-brand rounded-xl px-3 py-2 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-2xl bg-sage-50 p-4 md:grid-cols-4">
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
                    onChange={(e) => setAreaId(e.target.value)}
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
                  dateFrom || dateTo || areaId || memberId
                    ? "Filtered survey totals"
                    : "Survey totals"
                }
              />

              {loadingFilters && (
                <p className="mt-3 text-sm text-ink-soft">
                  Updating results...
                </p>
              )}

              <div className="mt-5 grid grid-cols-4 gap-3 px-4 pb-2 text-xs font-semibold uppercase text-ink-soft">
                <span>Name</span>
                <span>Area</span>
                <span>Mobile</span>
                <span>Members</span>
              </div>

              <div className="flex flex-col gap-2">
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
        onClose={() => setFillOpen(false)}
        onCreated={async (survey) => {
          setFillOpen(false);

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
