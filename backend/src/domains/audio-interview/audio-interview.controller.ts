import { Request, Response } from 'express';
import * as interviewService from './audio-interview.services';

export async function createInterviewJob(req: any, res: Response) {
  try {
    const result = await interviewService.createJob(req.user!.id); // adjust to your auth middleware's user shape
    res.status(201).json(result);
  } catch (err) {
    const status = err instanceof interviewService.ServiceError ? err.status : 500;
    res.status(status).json({ error: (err as Error).message });
  }
}

export async function getInterviewJob(req: Request, res: Response) {
  try {
    const job = await interviewService.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    const status = err instanceof interviewService.ServiceError ? err.status : 500;
    res.status(status).json({ error: (err as Error).message });
  }
}

export async function retryInterviewJob(req: Request, res: Response) {
  try {
    const result = await interviewService.retryJob(req.params.id);
    res.status(202).json(result);
  } catch (err) {
    const status = err instanceof interviewService.ServiceError ? err.status : 500;
    res.status(status).json({ error: (err as Error).message });
  }
}