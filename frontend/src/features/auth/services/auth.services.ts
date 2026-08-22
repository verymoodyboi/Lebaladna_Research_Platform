import supabase from "../../../lib/supabaseClient";
import { apiRequest } from "../../../lib/apiClient";
import { api } from "../../../lib/api";

const AVATAR_BUCKET = "avatars";

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Land on a dedicated callback route so we can check (and create,
      // if missing) the user's `public.users` profile row before sending
      // first-time Google sign-ins to /setup-profile.
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

export const signupWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

/**
 * Uploads a profile picture to the `avatars` Storage bucket under the
 * user's auth id and returns the storage path (NOT a public URL) so it
 * can be persisted in `public.users.pfp_path`.
 */
export const uploadPfp = async (file: File, authId: string): Promise<string> => {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${authId}/${Date.now()}.${extension}`;
const { data } = await supabase.auth.getSession();
console.log("session uid:", data.session?.user.id);
console.log("authId param:", authId);
console.log("upload path:", path);
  const { error } = await supabase.storage
    .from('pfps')
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  return path;
};

/** Resolves a stored `pfp_path` into a displayable public URL. */
export const getPfpPublicUrl = (path: string | null | undefined): string | null => {
  if (!path) {
    return null;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export interface CreateProfilePayload {
  first_name: string;
  last_name: string;
  username: string;
  bio?: string;
  pfp_path?: string;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  auth_id: string;
  bio: string | null;
  role: string | null;
  pfp_path: string | null;
  autherized: any;
}

/** Creates the `public.users` row for the currently authenticated user. */
export const createProfile = (payload: CreateProfilePayload) =>
  apiRequest<{ userInfo: UserProfile }>("/auth/profile", {
    method: "POST",
    body: payload,
  });

/** Fetches the current auth user + their profile row (null if not set up yet). */
export const fetchMe = () =>
  apiRequest<{ user: unknown; userInfo: UserProfile | null }>("/auth/me", {
    method: "GET",
  });




interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  username: string;
  bio?: string;
  pfp_path?: string;
}
 
export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  try {
    await api.patch("/user/update", input);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.error ?? "Unable to update your profile. Please try again.",
    );
  }
}


export const checkUsernameAvailable = (username: string) =>
  apiRequest<{ available: boolean }>(
    `/auth/username-available?username=${encodeURIComponent(username)}`,
    { method: "GET" },
  );
 
interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  username: string;
  bio?: string;
  pfp_path?: string;
}