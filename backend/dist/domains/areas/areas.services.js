"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArea = exports.getAreaById = exports.getAreasByCollection = void 0;
const supabase_1 = __importDefault(require("../../lib/supabase"));
const AREA_COLUMNS = `
  area_id,
  area_name,
  province,
  number_of_cases,
  blankets_needed,
  food_packs_needed,
  health_cases_needed,
  brides_needed,
  microfinance_cases_needed,
  guide_name,
  guide_phone_number,
  created_at,
  updated_at,
  collection_id
`;
const getAreasByCollection = async (collectionId) => {
    const { data, error } = await supabase_1.default
        .from("areas")
        .select(AREA_COLUMNS)
        .eq("collection_id", collectionId)
        .order("area_name", { ascending: true });
    if (error)
        throw error;
    return data;
};
exports.getAreasByCollection = getAreasByCollection;
const getAreaById = async (areaId) => {
    const { data, error } = await supabase_1.default
        .from("areas")
        .select(AREA_COLUMNS)
        .eq("area_id", areaId)
        .single();
    if (error)
        throw error;
    return data;
};
exports.getAreaById = getAreaById;
const createArea = async (input) => {
    const { data: existing, error: existingError } = await supabase_1.default
        .from("areas")
        .select("area_id")
        .eq("collection_id", input.collection_id)
        .ilike("area_name", input.area_name)
        .limit(1);
    if (existingError)
        throw existingError;
    if (existing?.length) {
        const duplicateError = new Error("An area with this name already exists in this collection.");
        duplicateError.code = "AREA_DUPLICATE";
        throw duplicateError;
    }
    const { data, error } = await supabase_1.default
        .from("areas")
        .insert({
        collection_id: input.collection_id,
        area_name: input.area_name,
        province: input.province,
    })
        .select(AREA_COLUMNS)
        .single();
    if (error)
        throw error;
    return data;
};
exports.createArea = createArea;
