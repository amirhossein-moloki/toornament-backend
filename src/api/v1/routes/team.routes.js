import { Router } from 'express';
import teamController from '../controllers/team.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { teamValidators } from '../../validators/team.validator.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { isCaptainGuard } from '../middlewares/team.guard.js'; // نگهبان جدید برای بررسی کاپیتانی

const router = Router();

// ===================================
// Public Routes
// ===================================

/**
 * @route   GET /api/v1/teams
 * @desc    دریافت لیست تیم‌ها با فیلترینگ و صفحه‌بندی
 * @access  Public
 */
router.get(
    '/',
    validate(teamValidators.getTeams),
    teamController.getTeams
);

/**
 * @route   GET /api/v1/teams/:id
 * @desc    دریافت اطلاعات عمومی یک تیم خاص
 * @access  Public
 */
router.get(
    '/:id',
    validate(teamValidators.getById),
    teamController.getTeamById
);


// ===================================
// Private, User-Facing Routes
// ===================================

/**
 * @route   POST /api/v1/teams
 * @desc    ایجاد یک تیم جدید توسط کاربر لاگین‌کرده
 * @access  Private
 */
router.post(
    '/',
    authGuard,
    validate(teamValidators.createTeam),
    teamController.createTeam
);

/**
 * @route   PATCH /api/v1/teams/:id
 * @desc    به‌روزرسانی اطلاعات تیم توسط کاپیتان
 * @access  Private (Captain Only)
 */
router.patch(
    '/:id',
    authGuard,
    isCaptainGuard, // تضمین می‌کند فقط کاپیتان تیم به این مسیر دسترسی دارد
    validate([
        ...teamValidators.getById,
        ...teamValidators.updateTeam
    ]),
    teamController.updateTeam
);

/**
 * @route   DELETE /api/v1/teams/:id
 * @desc    منحل کردن تیم توسط کاپیتان
 * @access  Private (Captain Only)
 */
router.delete(
    '/:id',
    authGuard,
    isCaptainGuard, // تضمین می‌کند فقط کاپیتان تیم به این مسیر دسترسی دارد
    validate(teamValidators.getById),
    teamController.deleteTeam
);


// ===================================
// Member Management Routes
// ===================================

/**
 * @route   POST /api/v1/teams/:id/members
 * @desc    دعوت از یک کاربر جدید به تیم توسط کاپیتان
 * @access  Private (Captain Only)
 */
router.post(
    '/:id/members',
    authGuard,
    isCaptainGuard,
    validate([
        ...teamValidators.getById,
        ...teamValidators.manageMember // اعتبارسنجی جدید
    ]),
    teamController.addMember
);

/**
 * @route   DELETE /api/v1/teams/:id/members/:userId
 * @desc    حذف یک عضو از تیم توسط کاپیتان
 * @access  Private (Captain Only)
 */
router.delete(
    '/:id/members/:userId',
    authGuard,
    isCaptainGuard,
    validate([
        ...teamValidators.getById,
        ...teamValidators.getMemberById // اعتبارسنجی جدید
    ]),
    teamController.removeMember
);

/**
 * @route   POST /api/v1/teams/:id/leave
 * @desc    ترک تیم توسط یکی از اعضا
 * @access  Private (Members Only)
 */
router.post(
    '/:id/leave',
    authGuard,
    validate(teamValidators.getById),
    teamController.leaveTeam
);


export default router;
