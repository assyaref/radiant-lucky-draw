/**
 * Authentication Routes
 *
 * login, refresh, logout, me, sessions, revoke, register
 */

import { Router } from 'express';
import { AuthController } from '../controllers';
import { validate } from '../middlewares';
import { createAuthenticate } from '../middlewares/auth.middleware';
import { TokenService } from '../services';
import { loginSchema, registerSchema, revokeSessionSchema } from '../validators';

export function createAuthRoutes(
  authController: AuthController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: Login user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username: { type: string }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  router.post('/login', validate({ body: loginSchema.shape.body }), authController.login);

  /**
   * @openapi
   * /api/auth/refresh:
   *   post:
   *     tags: [Authentication]
   *     summary: Refresh access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken: { type: string }
   *     responses:
   *       200:
   *         description: New access token issued
   *       401:
   *         description: Invalid refresh token
   */
  router.post('/refresh', authController.refresh);

  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: Logout user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken: { type: string }
   *     responses:
   *       200:
   *         description: Logged out
   */
  router.post('/logout', authController.logout);

  /**
   * @openapi
   * /api/auth/me:
   *   get:
   *     tags: [Authentication]
   *     summary: Get current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user
   *       401:
   *         description: Unauthorized
   */
  router.get('/me', authenticate, authController.me);

  /**
   * @openapi
   * /api/auth/sessions:
   *   get:
   *     tags: [Authentication]
   *     summary: List current user sessions
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of sessions
   */
  router.get('/sessions', authenticate, authController.listSessions);

  /**
   * @openapi
   * /api/auth/sessions/{sessionId}:
   *   delete:
   *     tags: [Authentication]
   *     summary: Revoke a session
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Session revoked
   */
  router.delete(
    '/sessions/:sessionId',
    authenticate,
    validate({ params: revokeSessionSchema.shape.params }),
    authController.revokeSession,
  );

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: Register new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username: { type: string }
   *               email: { type: string }
   *               password: { type: string }
   *               role: { type: string }
   *     responses:
   *       201:
   *         description: User registered
   *       409:
   *         description: Conflict
   */
  router.post('/register', validate({ body: registerSchema.shape.body }), authController.register);

  return router;
}
