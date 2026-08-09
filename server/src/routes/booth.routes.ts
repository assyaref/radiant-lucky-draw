/**
 * Booth Routes
 *
 * Public Booth endpoints (no auth):
 * - GET  /api/booth/config          -> booth configuration + active prizes
 * - POST /api/booth/participants    -> register a new participant
 * - POST /api/booth/participants/photo -> upload participant face photo
 * - POST /api/booth/luckydraw/spin  -> perform a lucky draw spin
 *
 * Admin endpoints (auth required):
 * - GET  /api/booth/winners         -> list winners
 * - PUT  /api/booth/winners/:id/claim -> update claim status
 */

import { Router } from 'express';
import { BoothController } from '../controllers';
import { createAuthenticate, validate } from '../middlewares';
import { TokenService } from '../services';
import {
  createBoothParticipantSchema,
  uploadPhotoSchema,
  spinSchema,
  updateClaimStatusSchema,
} from '../validators';

export function createBoothRoutes(
  boothController: BoothController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  // ─── Public endpoints (no auth) ────────────────────────────────────────

  /**
   * @openapi
   * /api/booth/config:
   *   get:
   *     tags: [Booth]
   *     summary: Get public booth configuration
   *     description: Returns event config and active prizes for the Public Booth page.
   *     responses:
   *       200:
   *         description: Booth configuration
   */
  router.get('/config', boothController.getConfig);

  /**
   * @openapi
   * /api/booth/participants:
   *   post:
   *     tags: [Booth]
   *     summary: Register a booth participant
   *     description: Registers a participant with name, company, and optional whatsapp.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, company]
   *             properties:
   *               name: { type: string }
   *               company: { type: string }
   *               whatsapp: { type: string }
   *     responses:
   *       201:
   *         description: Participant registered
   */
  router.post(
    '/participants',
    validate({ body: createBoothParticipantSchema.shape.body }),
    boothController.register,
  );

  /**
   * @openapi
   * /api/booth/participants/photo:
   *   post:
   *     tags: [Booth]
   *     summary: Upload participant face photo
   *     description: Stores a base64 data URL photo for a participant.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [participantId, photo]
   *             properties:
   *               participantId: { type: string }
   *               photo: { type: string }
   *     responses:
   *       200:
   *         description: Photo uploaded
   */
  router.post(
    '/participants/photo',
    validate({ body: uploadPhotoSchema.shape.body }),
    boothController.uploadPhoto,
  );

  /**
   * @openapi
   * /api/booth/luckydraw/spin:
   *   post:
   *     tags: [Booth]
   *     summary: Perform a lucky draw spin
   *     description: Selects a weighted random prize for a participant.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [participantId]
   *             properties:
   *               participantId: { type: string }
   *     responses:
   *       200:
   *         description: Spin result with won prize
   */
  router.post('/luckydraw/spin', validate({ body: spinSchema.shape.body }), boothController.spin);

  /** @openapi /api/booth/draw-state: get */
  router.get('/draw-state', boothController.getDrawState);

  // ─── Admin endpoints (auth required) ───────────────────────────────────

  router.use(authenticate);

  /**
   * @openapi
   * /api/booth/winners:
   *   get:
   *     tags: [Booth]
   *     summary: List winners
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer }
   *       - in: query
   *         name: limit
   *         schema: { type: integer }
   *       - in: query
   *         name: claimStatus
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: List of winners
   */
  router.get('/winners', boothController.listWinners);

  /**
   * @openapi
   * /api/booth/winners/{id}/claim:
   *   put:
   *     tags: [Booth]
   *     summary: Update winner claim status
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [claimStatus]
   *             properties:
   *               claimStatus: { type: string, enum: [unclaimed, claimed] }
   *     responses:
   *       200:
   *         description: Claim status updated
   */
  router.put(
    '/winners/:id/claim',
    validate({ body: updateClaimStatusSchema.shape.body }),
    boothController.updateClaimStatus,
  );

  return router;
}
