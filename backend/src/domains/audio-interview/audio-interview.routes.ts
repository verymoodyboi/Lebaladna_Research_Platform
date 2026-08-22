import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';// your existing auth guard
import {
  createInterviewJob,
  getInterviewJob,
  retryInterviewJob,
} from './audio-interview.controller';

const router = Router();

router.post('/', requireAuth, createInterviewJob);
router.get('/:id', requireAuth, getInterviewJob);
router.post('/:id/retry', requireAuth, retryInterviewJob);
router.get('/ping', (_req, res) => {
  res.json({ ok: true, route: 'audio-interview.routes.ts' });
});


export default router;