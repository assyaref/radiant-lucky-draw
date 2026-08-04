/**
 * Queue Routes
 *
 * - GET /api/queue/state  (public)  - initial queue state for TV/registration sync
 * - GET /api/queue        (auth)    - full queue state for operator
 * - POST /api/queue/add   (auth)    - add participant to queue
 * - POST /api/queue/call-next (auth) - call next participant
 * - POST /api/queue/complete (auth) - complete current participant
 * - POST /api/queue/skip  (auth)    - skip a waiting participant
 * - POST /api/queue/cancel (auth)   - cancel a waiting participant
 */

import { Router } from 'express';
import { QueueController } from '../controllers';
import { createAuthenticate } from '../middlewares';
import { TokenService } from '../services';

export function createQueueRoutes(
  queueController: QueueController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  // Public endpoint for initial state sync (Queue TV, registration, booth)
  router.get('/state', queueController.getState);

  // Authenticated operator endpoints
  router.use(authenticate);

  router.get('/', queueController.getState);
  router.post('/add', queueController.addToQueue);
  router.post('/call-next', queueController.callNext);
  router.post('/complete', queueController.completeCurrent);
  router.post('/skip', queueController.skip);
  router.post('/cancel', queueController.cancel);

  return router;
}
