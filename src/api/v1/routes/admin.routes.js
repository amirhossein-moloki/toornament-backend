import { Router } from 'express';
import adminController from '#controllers/admin.controller.js';
import { authGuard } from '#middlewares/auth.guard.js';
import { rbacGuard } from '#middlewares/rbac.guard.js';

const router = Router();

// Apply security middlewares to all routes defined in this file.
// This is an efficient way to protect a group of related administrative endpoints.
router.use(authGuard, rbacGuard('admin'));

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get dashboard statistics for the admin panel.
 * @access  Private (Admin Only)
 */
router.get(
    '/stats',
    adminController.getDashboardStats
);

// Future administrative routes can be added here.
// For example:
// router.post('/maintenance-mode', adminController.toggleMaintenanceMode);
// router.get('/system-logs', adminController.getSystemLogs);

export default router;
