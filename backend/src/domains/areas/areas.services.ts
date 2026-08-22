import supabase from "../../lib/supabase";

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
  collection_id,
  teams
`;

export const getAreasByCollection = async (collectionId: string) => {
  const { data, error } = await supabase
    .from("areas")
    .select(AREA_COLUMNS)
    .eq("collection_id", collectionId)
    .order("area_name", { ascending: true });

  if (error) throw error;
  return data;
};

export const getAreaById = async (areaId: string) => {
  const { data, error } = await supabase
    .from("areas")
    .select(AREA_COLUMNS)
    .eq("area_id", areaId)
    .single();

  if (error) throw error;
  return data;
};

export interface CreateAreaInput {
  collection_id: string;
  area_name: string;
  province: string;
  teams: any
}

export const createArea = async (input: CreateAreaInput) => {
  const { data: existing, error: existingError } = await supabase
    .from("areas")
    .select("area_id")
    .eq("collection_id", input.collection_id)
    .ilike("area_name", input.area_name)
    .limit(1);

  if (existingError) throw existingError;

  if (existing?.length) {
    const duplicateError = new Error(
      "An area with this name already exists in this collection.",
    );
    (duplicateError as any).code = "AREA_DUPLICATE";
    throw duplicateError;
  }

  const { data, error } = await supabase
    .from("areas")
    .insert({
      collection_id: input.collection_id,
      area_name: input.area_name,
      province: input.province,
      teams:input.teams
    })
    .select(AREA_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};
