/**
 * Analytics Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services';
import { sendSuccess } from '../utils';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.analyticsService.getDashboardStats();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getDrawAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.analyticsService.getDrawAnalytics();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
