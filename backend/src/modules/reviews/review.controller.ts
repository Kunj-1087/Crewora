import { Request, Response, NextFunction } from 'express';
import * as reviewService from './review.service';

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rating, comment } = req.body;
    const review = await reviewService.createReview(
      req.params.jobId,
      req.user!.id,
      { rating: Number(rating), comment }
    );
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorkerReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = 1, limit = 10 } = req.query as { page?: number; limit?: number };
    const result = await reviewService.getWorkerReviews(
      req.params.workerId,
      Number(page),
      Number(limit)
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
