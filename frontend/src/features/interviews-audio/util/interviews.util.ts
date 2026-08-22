import type { Area } from "../../areas/areas.services";
import type { ExtractedSurveyData } from "../interviews.services";

const MIME_BY_EXT: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  webm: "audio/webm",
};

export function mimeForExt(ext: string): string {
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Picks a safe extension for an uploaded File, defaulting to mp3. */
export function guessExtensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && MIME_BY_EXT[fromName]) return fromName;

  const fromType = file.type.split("/").pop()?.toLowerCase();
  if (fromType && MIME_BY_EXT[fromType]) return fromType;

  return "mp3";
}

/** Best-effort case-insensitive match of a free-text area name against the collection's areas. */
export function matchAreaId(
  areaNameFromInterview: string | null | undefined,
  areas: Area[],
): string | undefined {
  if (!areaNameFromInterview) return undefined;
  const normalized = areaNameFromInterview.trim().toLowerCase();
  if (!normalized) return undefined;

  const exact = areas.find((a) => a.area_name.trim().toLowerCase() === normalized);
  if (exact) return exact.area_id;

  const partial = areas.find(
    (a) =>
      a.area_name.trim().toLowerCase().includes(normalized) ||
      normalized.includes(a.area_name.trim().toLowerCase()),
  );
  return partial?.area_id;
}

/**
 * Maps GPT-extracted interview data onto the FillSurveyDialog form shape.
 * `training_suites` comes back as free text (the survey form uses structured
 * counts instead), so it's folded into additional_notes as a reviewable hint
 * rather than silently dropped or auto-filled incorrectly.
 */
export function mapExtractedDataToFormPatch(
  data: ExtractedSurveyData,
  areas: Area[],
) {
  const notesParts: string[] = [];
  if (data.training_suites) {
    notesParts.push(`Training suites (from interview): ${data.training_suites}`);
  }
  if (data.additional_notes) {
    notesParts.push(data.additional_notes);
  }

  return {
    subject_name: data.subject_name ?? "",
    subject_national_id: data.subject_national_id ?? "",
    area_id: matchAreaId(data.area, areas) ?? "",
    subject_family_members_number:
      data.subject_family_members_number != null
        ? String(data.subject_family_members_number)
        : "",
    food_packs_number:
      data.food_packs_number != null ? String(data.food_packs_number) : "0",
    blankets_number:
      data.blankets_number != null ? String(data.blankets_number) : "0",
    subject_mobile_number: data.subject_mobile_number ?? "",
    bride: !!data.bride,
    health: !!data.health,
    microfinance: !!data.microfinance,
    microfinance_notes: data.microfinance_notes ?? "",
    health_notes: data.health_notes ?? "",
    additional_notes: notesParts.join("\n\n"),
  };
}