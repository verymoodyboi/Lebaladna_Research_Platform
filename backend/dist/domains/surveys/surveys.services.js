"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSurvey = exports.createSurvey = exports.getSurveysByCollection = exports.calculateSurveyStats = void 0;
const supabase_1 = __importDefault(require("../../lib/supabase"));
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
const emptyStats = () => ({
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
const addTrainingSuites = (stats, value) => {
    if (!value)
        return;
    for (const part of value.split(",")) {
        const [qty, size] = part.trim().split("X");
        const quantity = Number(qty);
        if (size && Number.isFinite(quantity)) {
            stats.training_suites[size] = (stats.training_suites[size] ?? 0) + quantity;
        }
    }
};
const calculateSurveyStats = (surveys) => {
    const stats = emptyStats();
    const areaIds = new Set();
    for (const survey of surveys) {
        stats.cases += 1;
        stats.family_members += Number(survey.subject_family_members_number ?? 0);
        stats.food_packs += Number(survey.food_packs_number ?? 0);
        stats.blankets += Number(survey.blankets_number ?? 0);
        stats.health_cases += survey.health ? 1 : 0;
        stats.brides += survey.bride ? 1 : 0;
        stats.microfinance_cases += survey.microfinance ? 1 : 0;
        if (survey.area_id)
            areaIds.add(survey.area_id);
        addTrainingSuites(stats, survey.training_suites);
    }
    stats.areas = areaIds.size;
    return stats;
};
exports.calculateSurveyStats = calculateSurveyStats;
const getSurveysByCollection = async (collectionId, filters = {}) => {
    let query = supabase_1.default
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
    if (error)
        throw error;
    const surveys = (data ?? []).map((survey) => ({
        ...survey,
        area: survey.area?.area_name ?? null,
    }));
    return {
        surveys,
        totalStats: (0, exports.calculateSurveyStats)(surveys),
    };
};
exports.getSurveysByCollection = getSurveysByCollection;
const createSurvey = async (input) => {
    const { data, error } = await supabase_1.default
        .from("surveys")
        .insert(input)
        .select(SURVEY_COLUMNS)
        .single();
    if (error)
        throw error;
    return data;
};
exports.createSurvey = createSurvey;
const deleteSurvey = async (surveyId, createdBy) => {
    let query = supabase_1.default
        .from("surveys")
        .delete()
        .eq("survey_id", surveyId);
    if (createdBy) {
        query = query.eq("created_by", createdBy);
    }
    const { data, error } = await query
        .select("survey_id")
        .single();
    if (error)
        throw error;
    return data;
};
exports.deleteSurvey = deleteSurvey;
