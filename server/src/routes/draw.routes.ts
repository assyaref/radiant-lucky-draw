/**
 * Draw Routes
 */

import { Router } from 'express';
import { DrawController } from '../controllers';
import { createAuthenticate, validate } from '../middlewares';
import { TokenService } from '../services';
import { createDrawSchema, updateDrawStatusSchema } from '../validators';

export function createDrawRoutes(
  drawController: DrawController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  router.use(authenticate);


  router.get('/recent', drawController.findRecent);
  router.get('/', drawController.findAll);
  router.get('/:id', drawController.findById);
  router.post('/', validate({ body: createDrawSchema.shape.body }), drawController.create);
  router.patch('/:id/status', validate({ body: updateDrawStatusSchema.shape.body }), drawController.updateStatus);
  router.delete('/:id', drawController.delete);

  return router;
}
