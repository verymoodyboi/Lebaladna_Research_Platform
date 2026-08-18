import { apiRequest } from "../../lib/apiClient";

export interface Collection {
  collection_id: string;
  collection_name: string;
  created_at: string;
  bg_path: string | null;
  province: string;
  number_of_cases: number;
  number_of_areas: number;
  blankets_needed: number;
  food_packs_needed: number;
  health_cases_needed: number;
  brides_needed: number;
  microfinance_cases_needed: number;
  training_suite_8m: number;
  training_suite_10m: number;
  training_suite_12m: number;
  training_suite_14m: number;
  training_suite_16m: number;
  training_suite_8f: number;
  training_suite_10f: number;
  training_suite_12f: number;
  training_suite_14f: number;
  training_suite_16f: number;
}

export const listCollections = () =>
  apiRequest<{ collections: Collection[] }>("/collections", {
    method: "GET",
  });

export const getCollection = (collectionId: string) =>
  apiRequest<{ collection: Collection }>(`/collections/${collectionId}`, {
    method: "GET",
  });

export interface CreateCollectionPayload {
  collection_name: string;
  bg_path?: string;
}

export const createCollection = (payload: CreateCollectionPayload) =>
  apiRequest<{ collection: Collection }>("/collections", {
    method: "POST",
    body: payload,
  });
