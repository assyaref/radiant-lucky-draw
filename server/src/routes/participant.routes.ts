/**
 * Participant Routes
 */

import { Router } from 'express';
import { ParticipantController } from '../controllers';
import { createAuthenticate, validate } from '../middlewares';
import { TokenService } from '../services';
import { createParticipantSchema, updateParticipantSchema } from '../validators';

export function createParticipantRoutes(
  participantController: ParticipantController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  /**
   * @openapi
   * /api/participants/register:
   *   post:
   *     tags: [Participants]
   *     summary: Public registration for visitors
   *     description: Registers a new participant without authentication. Validates required fields, duplicate phone, event status, and queue capacity.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, phone, company]
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *               phone:
   *                 type: string
   *                 minLength: 8
   *                 maxLength: 15
   *               company:
   *                 type: string
   *                 minLength: 1
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       201:
   *         description: Participant registered successfully
   *       400:
   *         description: Validation error or registration closed
   *       409:
   *         description: Phone number already registered
   */
  router.post(
    '/register',
    validate({ body: createParticipantSchema.shape.body }),
    participantController.register,
  );

  router.use(authenticate);

  /**
   * @openapi
   * /api/participants:
   *   get:

   *     tags: [Participants]
   *     summary: List all participants
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer }
   *       - in: query
   *         name: limit
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: List of participants
   */
  router.get('/', participantController.findAll);

  /**
   * @openapi
   * /api/participants/{id}:
   *   get:
   *     tags: [Participants]
   *     summary: Get participant by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Participant details
   */
  router.get('/:id', participantController.findById);

  /**
   * @openapi
   * /api/participants:
   *   post:
   *     tags: [Participants]
   *     summary: Create participant
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201:
   *         description: Participant created
   */
  router.post(
    '/',
    validate({ body: createParticipantSchema.shape.body }),
    participantController.create,
  );

  /**
   * @openapi
   * /api/participants/{id}:
   *   put:
   *     tags: [Participants]
   *     summary: Update participant
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Participant updated
   */
  router.put(
    '/:id',
    validate({ body: updateParticipantSchema.shape.body }),
    participantController.update,
  );

  /**
   * @openapi
   * /api/participants/{id}:
   *   delete:
   *     tags: [Participants]
   *     summary: Delete participant
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Participant deleted
   */
  router.delete('/:id', participantController.delete);

  return router;
}
