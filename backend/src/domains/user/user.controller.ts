import type { Request, Response } from "express";

import { updateUserProfile } from "./user.service";

export async function updateProfile(req: any, res: Response): Promise<void> {
  // Set by requireAuth after verifying the Supabase JWT from the
  // Authorization header attached by the frontend's axios interceptor.
  const authId = req.user?.id;

  if (!authId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { first_name, last_name, username, bio, pfp_path } = req.body ?? {};

  if (!first_name || !last_name || !username) {
    res.status(400).json({ error: "first_name, last_name, and username are required." });
    return;
  }

  try {
    const updatedUser = await updateUserProfile(authId, {
      first_name,
      last_name,
      username,
      bio,
      pfp_path,
    });

    res.status(200).json({ userInfo: updatedUser });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to update profile.",
    });
  }
}
