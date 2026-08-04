/**
 * Settings Routes
 */

import { Router } from 'express';
import { SettingsController } from '../controllers';
import { createAuthenticate, validate } from '../middlewares';
import { TokenService } from '../services';
import { updateSettingsSchema } from '../validators';

export function createSettingsRoutes(
  settingsController: SettingsController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  router.use(authenticate);


  router.get('/', settingsController.get);
  router.put('/', validate({ body: updateSettingsSchema.shape.body }), settingsController.update);

  return router;
}
