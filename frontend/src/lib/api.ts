import axios from "axios";
import supabase from "./supabaseClient";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config:any) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Could not attach auth token:", error);
  }

  return config;
});
