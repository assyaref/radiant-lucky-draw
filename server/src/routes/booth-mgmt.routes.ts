import { Router } from 'express';
import { BoothMgmtController } from '../controllers';
import { createAuthenticate } from '../middlewares';
import { TokenService } from '../services';

export function createBoothMgmtRoutes(
  boothController: BoothMgmtController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  router.use(authenticate);
  router.get('/', boothController.listByEvent);
  router.get('/:id', boothController.getById);
  router.post('/', boothController.create);
  router.put('/:id', boothController.update);
  router.delete('/:id', boothController.delete);

  return router;
}
