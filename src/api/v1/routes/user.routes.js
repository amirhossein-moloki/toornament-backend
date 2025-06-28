import { Router } from 'express';
import userController from '@/controllers/user.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { userValidators } from '@/validators/user.validators.js';
import { authGuard } from '@/middlewares/auth.guard.js';
import { rbacGuard } from '@/middlewares/rbac.guard.js';

const router = Router();

// ===================================
// User-Facing Routes (for the authenticated user)
// ===================================

/**
 * @route   GET /api/v1/users/me
 * @desc    Get the profile of the currently logged-in user
 * @access  Private
 */
router.get(
    '/me',
    authGuard,
    userController.getMe
);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update the profile of the currently logged-in user
 * @access  Private
 */
router.patch(
    '/me',
    authGuard,
    validate(userValidators.updateMe),
    userController.updateMe
);


// ===================================
// Admin-Facing Routes (for managing all users)
// ===================================

/**
 * @route   GET /api/v1/users
 * @desc    Get a list of all users (admin only)
 * @access  Private (Admin)
 */
router.get(
    '/',
    authGuard,
    rbacGuard('admin'),
    validate(userValidators.getUsers),
    userController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get a specific user by ID (admin only)
 * @access  Private (Admin)
 */
router.get(
    '/:id',
    authGuard,
    rbacGuard('admin'),
    validate(userValidators.getUserById),
    userController.getUserById
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update a user's details (e.g., role, status) by ID (admin only)
 * @access  Private (Admin)
 */
router.patch(
    '/:id',
    authGuard,
    rbacGuard('admin'),
    validate([
        ...userValidators.getUserById,
        ...userValidators.updateUser
    ]),
    userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user by ID (admin only)
 * @access  Private (Admin)
 */
router.delete(
    '/:id',
    authGuard,
    rbacGuard('admin'),
    validate(userValidators.getUserById),
    userController.deleteUser
);


export default router;
