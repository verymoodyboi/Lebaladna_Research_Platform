import supabase from "../../lib/supabase";

const COLLECTION_COLUMNS = `
  collection_id,
  collection_name,
  created_at,
  bg_path,
  number_of_cases,
  number_of_areas,
  blankets_needed,
  food_packs_needed,
  health_cases_needed,
  brides_needed,
  microfinance_cases_needed,
  training_suite_8m,
  training_suite_10m,
  training_suite_12m,
  training_suite_14m,
  training_suite_16m,
  training_suite_8f,
  training_suite_10f,
  training_suite_12f,
  training_suite_14f,
  training_suite_16f
`;

export const getCollections = async () => {
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getCollectionById = async (collectionId: string) => {
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .eq("collection_id", collectionId)
    .single();

  if (error) throw error;
  return data;
};

export interface CreateCollectionInput {
  collection_name: string;
  bg_path?: string | null;
}

export const createCollection = async (input: CreateCollectionInput) => {
  const { data, error } = await supabase
    .from("collections")
    .insert({
      collection_name: input.collection_name,
      bg_path: input.bg_path ?? null,
    })
    .select(COLLECTION_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};
