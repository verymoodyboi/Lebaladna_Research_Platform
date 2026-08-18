import { Request, Response } from "express";
import { createUserProfile, getUserProfile, isUsernameTaken } from "./auth.services";

export const getMe = async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userProfile = await getUserProfile(req.user.id);

    return res.status(200).json({
      user: req.user,
      userInfo: userProfile,
    });
  } catch (error) {
    console.error("Error getting current user:", error);

    return res.status(500).json({
      message: "Failed to get user information",
    });
  }
};

export const createProfile = async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { first_name, last_name, username, bio, pfp_path } = req.body ?? {};

    if (!first_name || !last_name || !username) {
      return res.status(400).json({
        message: "First name, last name, and username are required.",
      });
    }

    const existingProfile = await getUserProfile(req.user.id);

    if (existingProfile) {
      return res.status(409).json({
        message: "A profile already exists for this account.",
      });
    }

    const userInfo = await createUserProfile(req.user.id, {
      first_name,
      last_name,
      username,
      bio,
      pfp_path,
    });

    return res.status(201).json({ userInfo });
  } catch (error: any) {
    console.error("Error creating user profile:", error);

    // Postgres unique_violation (e.g. duplicate username)
    if (error?.code === "23505") {
      return res.status(409).json({
        message: "That username is already taken.",
      });
    }

    return res.status(500).json({
      message: "Failed to create user profile",
    });
  }
};


export const checkUsernameAvailability = async (req: any, res: any) => {
  try {
    const usernameParam = req.query.username;
    const username = typeof usernameParam === "string" ? usernameParam.trim() : "";
 
    if (!username) {
      return res.status(400).json({
        message: "Username is required.",
      });
    }
 
    const taken = await isUsernameTaken(username);
 
    return res.status(200).json({ available: !taken });
  } catch (error) {
    console.error("Error checking username availability:", error);
 
    return res.status(500).json({
      message: "Failed to check username availability",
    });
  }
};