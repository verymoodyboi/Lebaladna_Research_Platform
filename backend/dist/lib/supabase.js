"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const index_js_1 = __importDefault(require("../config/index.js"));
if (!index_js_1.default.SUPABASE_URL || !index_js_1.default.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('upabase not configured: Missing URL or service role key');
}
const supabase = (0, supabase_js_1.createClient)(index_js_1.default.SUPABASE_URL, index_js_1.default.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
console.log('Supabase client initialized');
exports.default = supabase;
