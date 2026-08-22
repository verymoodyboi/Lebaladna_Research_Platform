import { apiRequest } from "../../lib/apiClient";

export interface Survey {
  survey_id: string;
  subject_name: string;
  subject_national_id: string | null;
  area_id: string | null;
  area: string | null;
  subject_family_members_number: number | null;
  food_packs_number: number;
  blankets_number: number;
  training_suites: string | null;
  subject_mobile_number: string | null;
  bride: boolean;
  health: boolean;
  microfinance: boolean;
  microfinance_notes: string | null;
  health_notes: string | null;
  additional_notes: string | null;
  collection_id: string;
  created_by: string | null;
  created_at: string;
  team?: any;
  creator?: { user_id?: string; first_name: string; last_name: string } | null;
}

export interface SurveyStats {
  cases: number;
  areas: number;
  family_members: number;
  food_packs: number;
  blankets: number;
  health_cases: number;
  brides: number;
  microfinance_cases: number;
  training_suites: Record<string, number>;
}

export interface SurveyFilters {
  dateFrom?: string;
  dateTo?: string;
  areaId?: string;
  memberId?: string;
  team?:any
}

export const listSurveys = (collectionId: string, filters: SurveyFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.areaId) params.set("area_id", filters.areaId);
  if (filters.team) params.set("team", filters.team);
  if (filters.memberId) params.set("member_id", filters.memberId);

  const query = params.toString();
  return apiRequest<{ surveys: Survey[]; totalStats: SurveyStats }>(
    `/surveys/collection/${collectionId}${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
};

export interface CreateSurveyInput {
  subject_name: string;
  subject_national_id?: string;
  area_id: string;
  subject_family_members_number?: number;
  food_packs_number?: number;
  blankets_number?: number;
  training_suites?: string;
  subject_mobile_number?: string;
  bride?: boolean;
  health?: boolean;
  microfinance?: boolean;
  microfinance_notes?: string;
  health_notes?: string;
  additional_notes?: string;
  collection_id: string;
  team?:any
}

export const createSurvey = (input: CreateSurveyInput) =>
  apiRequest<{ survey: Survey }>("/surveys", {
    method: "POST",
    body: input,
  });

export const deleteSurvey = (surveyId: string) =>
  apiRequest<{ message: string }>(`/surveys/${surveyId}`, {
    method: "DELETE",
  });
