"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const supabase_js_1 = require("@supabase/supabase-js");
const index_js_1 = __importDefault(require("../config/index.js"));
const supabaseAdmin = (0, supabase_js_1.createClient)(index_js_1.default.SUPABASE_URL ?? '', index_js_1.default.SUPABASE_SERVICE_ROLE_KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
});
async function requireAuth(req, res, next) {
    try {
        const raw = req.headers.authorization || '';
        const token = raw.replace(/^Bearer\s+/i, '').trim();
        if (!token) {
            res.status(401).json({ error: 'Missing auth token' });
            return;
        }
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !data?.user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        req.user = data.user;
        next();
    }
    catch (err) {
        console.log('Auth error:', err);
        res.status(500).json({ error: 'Auth check failed' });
    }
}
