import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

const supabaseAdmin = createClient(
  config.SUPABASE_URL ?? '',
  config.SUPABASE_SERVICE_ROLE_KEY ?? '',
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);


export async function requireAuth(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
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
  } catch (err) {
    console.log('Auth error:', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}
