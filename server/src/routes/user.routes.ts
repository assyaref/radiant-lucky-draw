/**
 * User Management Routes — /api/users
 *
 * All routes require authentication. Reading needs `user:read`, changes need
 * `user:write`, deletion needs `user:delete` (Super Admin by default).
 */

import { Router } from 'express';
import { UserController } from '../controllers';
import { validate, requirePermission } from '../middlewares';
import { createAuthenticate } from '../middlewares/auth.middleware';
import { TokenService } from '../services';
import { PERMISSIONS } from '../auth';
import {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  userIdParamSchema,
  changePasswordSchema,
} from '../validators';

export function createUserRoutes(userController: UserController, tokenService: TokenService): Router {
  const router = Router();
  router.use(createAuthenticate(tokenService));

  const read = requirePermission(PERMISSIONS.USER_READ);
  const write = requirePermission(PERMISSIONS.USER_WRITE);
  const del = requirePermission(PERMISSIONS.USER_DELETE);
  const idParam = validate({ params: userIdParamSchema.shape.params });

  // Any logged-in user may change their own password.
  router.post(
    '/me/password',
    validate({ body: changePasswordSchema.shape.body }),
    userController.changeOwnPassword,
  );

  router.get('/', read, validate({ query: listUsersSchema.shape.query }), userController.list);
  router.get('/:id', read, idParam, userController.getById);
  router.post('/', write, validate({ body: createUserSchema.shape.body }), userController.create);
  router.put('/:id', write, idParam, validate({ body: updateUserSchema.shape.body }), userController.update);
  router.post(
    '/:id/reset-password',
    write,
    idParam,
    validate({ body: resetPasswordSchema.shape.body }),
    userController.resetPassword,
  );
  router.delete('/:id', del, idParam, userController.remove);

  return router;
}
