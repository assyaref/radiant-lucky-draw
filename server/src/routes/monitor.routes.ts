/**
 * Monitor Routes — /api/monitor
 * GET  /state  public (Monitor screens)
 * PUT  /state  login + draw:execute (switch mode, update wheel / theme)
 * POST /assets login + draw:execute (upload logo or sound → public URL)
 */

import { Router } from 'express';
import { MonitorController } from '../controllers';
import { validate, requirePermission } from '../middlewares';
import { createAuthenticate } from '../middlewares/auth.middleware';
import { TokenService } from '../services';
import { PERMISSIONS } from '../auth';
import { updateMonitorStateSchema, uploadMonitorAssetSchema } from '../validators';
import { AssetStorageService } from '../services/AssetStorageService';
import { sendSuccess } from '../utils';

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

  const storage = new AssetStorageService();
  router.post(
    '/assets',
    createAuthenticate(tokenService),
    requirePermission(PERMISSIONS.DRAW_EXECUTE),
    validate({ body: uploadMonitorAssetSchema.shape.body }),
    (req, res, next) => {
      storage
        .upload(req.body.kind, req.body.dataUrl)
        .then((r) => sendSuccess(res, r, undefined, 201))
        .catch(next);
    },
  );
  return router;
}
