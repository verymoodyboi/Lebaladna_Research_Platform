import supabase from "../../lib/supabase";

const PROFILE_COLUMNS = `
  user_id,
  first_name,
  last_name,
  username,
  auth_id,
  bio,
  role,
  pfp_path,
autherized
`;

export const getUserProfile = async (authId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export interface CreateUserProfileInput {
  first_name: string;
  last_name: string;
  username: string;
  bio?: string | null;
  pfp_path?: string | null;
}

export const createUserProfile = async (
  authId: string,
  profile: CreateUserProfileInput,
) => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      auth_id: authId,
      first_name: profile.first_name,
      last_name: profile.last_name,
      username: profile.username,
      bio: profile.bio ?? null,
      pfp_path: profile.pfp_path ?? null,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
};


export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .ilike("username", username)
    .maybeSingle();
 
  if (error) {
    throw error;
  }
 
  return Boolean(data);
};
 
