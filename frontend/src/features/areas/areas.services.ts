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
  province:any;
}

export const createArea = (input: CreateAreaInput) =>
  apiRequest<{ area: Area }>("/areas", {
    method: "POST",
    body: input,
  });
