import { Router } from 'express';
import userController from '#controllers/user.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { userValidators } from '#validators/user.validator.js'; // Corrected filename
import { authGuard } from '#middlewares/auth.guard.js';
import { rbacGuard } from '#middlewares/rbac.guard.js';
import { USER_ROLES } from '#config/constants.js';

const router = Router();

// ===================================
// User-Facing Routes (for the authenticated user)
// ===================================

router.get(
  '/me',
  authGuard,
  userController.getMe
);

router.patch(
  '/me',
  authGuard,
  validate(userValidators.updateMe),
  userController.updateMe
);

// ===================================
// Admin-Facing Routes (for managing all users)
// ===================================

router.get(
  '/',
  authGuard,
  rbacGuard(USER_ROLES.ADMIN),
  validate(userValidators.getUsers),
  userController.getUsers
);

router.get(
  '/:id',
  authGuard,
  rbacGuard(USER_ROLES.ADMIN),
  validate(userValidators.getUserById),
  userController.getUserById
);

router.patch(
  '/:id',
  authGuard,
  rbacGuard(USER_ROLES.ADMIN),
  validate([
    ...userValidators.getUserById,
    ...userValidators.updateUser
  ]),
  userController.updateUser
);

router.delete(
  '/:id',
  authGuard,
  rbacGuard(USER_ROLES.ADMIN),
  validate(userValidators.getUserById),
  userController.deleteUser
);

export default router;
