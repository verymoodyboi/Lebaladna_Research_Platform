import { apiRequest } from "../../lib/apiClient";

export interface Area {
  area_id: string;
  area_name: string;
  province: string;
  number_of_cases: number;
  blankets_needed: number;
  food_packs_needed: number;
  health_cases_needed: number;
  brides_needed: number;
  microfinance_cases_needed: number;
  guide_name: string | null;
  guide_phone_number: string | null;
  collection_id: string;
  /** Comma-separated list of team names assigned to this area, e.g. "one, two, three". */
  teams: string | null;
  created_at: string;
  updated_at: string;
}

export const listAreas = (collectionId: string) =>
  apiRequest<{ areas: Area[] }>(`/areas/collection/${collectionId}`, {
    method: "GET",
  });

export interface CreateAreaInput {
  collection_id: string;
  area_name: string;
  province: any;
  /** Comma-separated list of team names, e.g. "one, two, three". */
  teams: string;
}

/**
 * Splits an area's raw "teams" column (e.g. "one, two, three") into a clean,
 * de-duplicated array of team names for use in dropdowns/selects.
 */
export function parseAreaTeams(teams: string | null | undefined): string[] {
  if (!teams) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of teams.split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/**
 * Joins an array of team names back into the comma-separated string format
 * used by the "teams" column, de-duplicating (case-insensitive) along the way.
 */
export function stringifyAreaTeams(teams: string[]): string {
  return parseAreaTeams(teams.join(",")).join(", ");
}

export const createArea = (input: CreateAreaInput) =>
  apiRequest<{ area: Area }>("/areas", {
    method: "POST",
    body: input,
  });