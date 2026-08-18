"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = updateUserProfile;
const supabase_1 = __importDefault(require("../../lib/supabase"));
async function updateUserProfile(authId, input) {
    const { data, error } = await supabase_1.default
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
