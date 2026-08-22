import supabase from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?? "http://localhost:3001/api";

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/**
 * Thin wrapper around fetch that:
 *  - prefixes API_BASE_URL
 *  - attaches the current Supabase access token as a Bearer header
 *  - JSON-encodes the body / parses the response
 *  - throws an Error with the backend's `message` on non-2xx responses
 */
export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? (payload as { message?: string }).message
        : undefined) ?? "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return payload as T;
};
