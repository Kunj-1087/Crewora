import { Request, Response, NextFunction } from 'express';
import * as jobService from './job.service';

export async function createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const io = req.app.get('io');
    const job = await jobService.createJob(req.user!.id, req.body, io);
    res.status(201).json({ success: true, message: 'Job posted successfully', data: { job } });
  } catch (error) { next(error); }
}

export async function getMyJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 10, status } = req.query as { page?: number; limit?: number; status?: string };
    const result = await jobService.getCustomerJobs(req.user!.id, Number(page), Number(limit), status);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await jobService.getJobById(req.params.id, req.user!.id, req.user!.type);
    res.json({ success: true, data: { job } });
  } catch (error) { next(error); }
}

export async function updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await jobService.updateJob(req.params.id, req.user!.id, req.body);
    res.json({ success: true, message: 'Job updated', data: { job } });
  } catch (error) { next(error); }
}

export async function getJobMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matches = await jobService.getJobMatches(req.params.id, req.user!.id);
    res.json({ success: true, data: { matches } });
  } catch (error) { next(error); }
}

export async function getWorkerJobFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 10, status } = req.query as { page?: number; limit?: number; status?: string };
    const jobs = await jobService.getWorkerJobFeed(req.user!.id, Number(page), Number(limit), status);
    res.json({ success: true, data: { jobs } });
  } catch (error) { next(error); }
}

export async function respondToMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action } = req.body as { action: 'accept' | 'decline' };
    const io = req.app.get('io');
    const match = await jobService.respondToMatch(req.params.matchId, req.user!.id, action, io);
    res.json({ success: true, message: `Job ${action}ed`, data: { match } });
  } catch (error) { next(error); }
}
