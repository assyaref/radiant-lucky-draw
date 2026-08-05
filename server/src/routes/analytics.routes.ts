/**
 * Analytics Routes
 */

import { Router } from 'express';
import { AnalyticsController } from '../controllers';
import { createAuthenticate } from '../middlewares';
import { TokenService } from '../services';

export function createAnalyticsRoutes(
  analyticsController: AnalyticsController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  router.use(authenticate);

  router.get('/dashboard', analyticsController.getDashboardStats);
  router.get('/draws', analyticsController.getDrawAnalytics);

  return router;
}
