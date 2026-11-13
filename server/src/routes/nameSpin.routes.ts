/**
 * Name Spin Routes — /api/name-spin
 * Requires login + `draw:execute` (Super Admin, Event Manager, Operator).
 */

import { Router } from 'express';
import { NameSpinController } from '../controllers';
import { validate, requirePermission } from '../middlewares';
import { createAuthenticate } from '../middlewares/auth.middleware';
import { TokenService } from '../services';
import { PERMISSIONS } from '../auth';
import { nameSpinSchema } from '../validators';

export function createNameSpinRoutes(
  nameSpinController: NameSpinController,
  tokenService: TokenService,
): Router {
  const router = Router();
  router.use(createAuthenticate(tokenService));
  router.post(
    '/',
    requirePermission(PERMISSIONS.DRAW_EXECUTE),
    validate({ body: nameSpinSchema.shape.body }),
    nameSpinController.spin,
  );
  return router;
}
