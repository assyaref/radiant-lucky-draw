/**
 * Health Check Routes
 */

import { Router } from 'express';
import { HealthController } from '../controllers';

export function createHealthRoutes(healthController: HealthController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/health:
   *   get:
   *     tags: [Health]
   *     summary: Health check endpoint
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  router.get('/', healthController.check);

  return router;
}
