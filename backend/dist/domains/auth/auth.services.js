"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUsernameTaken = exports.createUserProfile = exports.getUserProfile = void 0;
const supabase_1 = __importDefault(require("../../lib/supabase"));
const PROFILE_COLUMNS = `
  user_id,
  first_name,
  last_name,
  username,
  auth_id,
  bio,
  role,
  pfp_path
`;
const getUserProfile = async (authId) => {
    const { data, error } = await supabase_1.default
        .from("users")
        .select(PROFILE_COLUMNS)
        .eq("auth_id", authId)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return data;
};
exports.getUserProfile = getUserProfile;
const createUserProfile = async (authId, profile) => {
    const { data, error } = await supabase_1.default
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
exports.createUserProfile = createUserProfile;
const isUsernameTaken = async (username) => {
    const { data, error } = await supabase_1.default
        .from("users")
        .select("user_id")
        .ilike("username", username)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return Boolean(data);
};
exports.isUsernameTaken = isUsernameTaken;
