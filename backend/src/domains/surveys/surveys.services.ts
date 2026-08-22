import supabase from "../../lib/supabase";

const SURVEY_COLUMNS = `
  survey_id,
  subject_name,
  subject_national_id,
  area_id,
  area:areas(area_name),
  subject_family_members_number,
  food_packs_number,
  blankets_number,
  training_suites,
  subject_mobile_number,
  bride,
  health,
  microfinance,
  microfinance_notes,
  health_notes,
  additional_notes,
  collection_id,
  created_by,
  created_at,
  creator:users(user_id, first_name, last_name),
  team
`;

export interface SurveyFilters {
  dateFrom?: string;
  dateTo?: string;
  areaId?: string;
  memberId?: string;
  team?:string
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

const emptyStats = (): SurveyStats => ({
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

const addTrainingSuites = (
  stats: SurveyStats,
  value: string | null | undefined,
) => {
  if (!value) return;

  for (const part of value.split(",")) {
    const [qty, size] = part.trim().split("X");
    const quantity = Number(qty);

    if (size && Number.isFinite(quantity)) {
      stats.training_suites[size] = (stats.training_suites[size] ?? 0) + quantity;
    }
  }
};

export const calculateSurveyStats = (surveys: any[]): SurveyStats => {
  const stats = emptyStats();
  const areaIds = new Set<string>();

  for (const survey of surveys) {
    stats.cases += 1;
    stats.family_members += Number(survey.subject_family_members_number ?? 0);
    stats.food_packs += Number(survey.food_packs_number ?? 0);
    stats.blankets += Number(survey.blankets_number ?? 0);
    stats.health_cases += survey.health ? 1 : 0;
    stats.brides += survey.bride ? 1 : 0;
    stats.microfinance_cases += survey.microfinance ? 1 : 0;

    if (survey.area_id) areaIds.add(survey.area_id);
    addTrainingSuites(stats, survey.training_suites);
  }

  stats.areas = areaIds.size;
  return stats;
};

export const getSurveysByCollection = async (
  collectionId: string,
  filters: SurveyFilters = {},
) => {
  let query = supabase
    .from("surveys")
    .select(SURVEY_COLUMNS)
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (filters.areaId) {
    query = query.eq("area_id", filters.areaId);
  }

  if (filters.memberId) {
    query = query.eq("created_by", filters.memberId);
  }

  if (filters.team) {
    query = query.eq("team", filters.team);
  }


  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lt("created_at", filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  const surveys = (data ?? []).map((survey: any) => ({
    ...survey,
    area: survey.area?.area_name ?? null,
  }));

  return {
    surveys,
    totalStats: calculateSurveyStats(surveys),
  };
};

export interface CreateSurveyInput {
  subject_name: string;
  subject_national_id?: string | null;
  area_id: string;
  subject_family_members_number?: number | null;
  food_packs_number?: number;
  blankets_number?: number;
  training_suites?: string | null;
  subject_mobile_number?: string | null;
  bride?: boolean;
  health?: boolean;
  microfinance?: boolean;
  microfinance_notes?: string | null;
  health_notes?: string | null;
  additional_notes?: string | null;
  collection_id: string;
  created_by: string;
  team?:string
}

export const createSurvey = async (input: CreateSurveyInput) => {
  const { data, error } = await supabase
    .from("surveys")
    .insert(input)
    .select(SURVEY_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

export const deleteSurvey = async (surveyId: string, createdBy?: string) => {
  let query = supabase
    .from("surveys")
    .delete()
    .eq("survey_id", surveyId);

  if (createdBy) {
    query = query.eq("created_by", createdBy);
  }

  const { data, error } = await query
    .select("survey_id")
    .single();

  if (error) throw error;
  return data;
};
