import supabase from "../../lib/supabase";

interface UpdateUserProfileInput {
  first_name: string;
  last_name: string;
  username: string;
  bio?: string;
  pfp_path?: string;
  autherized:any;
}

export async function updateUserProfile(authId: string, input: UpdateUserProfileInput) {
  const { data, error } = await supabase
    .from("users")
    .update({
      first_name: input.first_name,
      last_name: input.last_name,
      username: input.username,
      bio: input.bio ?? null,
      ...(input.pfp_path ? { pfp_path: input.pfp_path } : {}),
    })
    .eq("auth_id", authId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
