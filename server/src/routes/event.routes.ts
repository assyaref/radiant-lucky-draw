import { Router } from 'express';
import { EventController } from '../controllers';
import { createAuthenticate } from '../middlewares';
import { TokenService } from '../services';

export function createEventRoutes(
  eventController: EventController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  router.use(authenticate);
  router.get('/', eventController.list);
  router.get('/:id', eventController.getById);
  router.post('/', eventController.create);
  router.put('/:id', eventController.update);
  router.delete('/:id', eventController.delete);

  return router;
}
