/**
 * Monitor Routes — /api/monitor
 * GET  /state  public (Monitor screens)
 * PUT  /state  login + draw:execute (switch mode, update wheel)
 */

import { Router } from 'express';
import { MonitorController } from '../controllers';
import { validate, requirePermission } from '../middlewares';
import { createAuthenticate } from '../middlewares/auth.middleware';
import { TokenService } from '../services';
import { PERMISSIONS } from '../auth';
import { updateMonitorStateSchema } from '../validators';

export function createMonitorRoutes(
  monitorController: MonitorController,
  tokenService: TokenService,
): Router {
  const router = Router();
  router.get('/state', monitorController.get);
  router.put(
    '/state',
    createAuthenticate(tokenService),
    requirePermission(PERMISSIONS.DRAW_EXECUTE),
    validate({ body: updateMonitorStateSchema.shape.body }),
    monitorController.update,
  );
  return router;
}
