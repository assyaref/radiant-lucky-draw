/**
 * Prize Routes
 */

import { Router } from 'express';
import { PrizeController } from '../controllers';
import { createAuthenticate, validate } from '../middlewares';
import { TokenService } from '../services';
import { createPrizeSchema, updatePrizeSchema } from '../validators';

export function createPrizeRoutes(
  prizeController: PrizeController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  router.use(authenticate);

  router.get('/active', prizeController.findActive);
  router.get('/', prizeController.findAll);
  router.get('/:id', prizeController.findById);
  router.post('/', validate({ body: createPrizeSchema.shape.body }), prizeController.create);
  router.put('/:id', validate({ body: updatePrizeSchema.shape.body }), prizeController.update);
  router.delete('/:id', prizeController.delete);

  return router;
}
