import { Router } from 'express';
import matchController from '../controllers/match.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { matchValidators } from '../../validators/match.validator.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { rbacGuard } from '../middlewares/rbac.guard.js';

const router = Router();

// ===================================
// Public/Participant Routes
// ===================================

/**
 * @route   GET /api/v1/matches
 * @desc    دریافت لیست مسابقات (برای یک کاربر یا یک تورنومنت خاص)
 * @access  Private
 */
router.get(
    '/',
    authGuard,
    validate(matchValidators.getMatches),
    matchController.getMatches
);

/**
 * @route   GET /api/v1/matches/:id
 * @desc    دریافت جزئیات یک مسابقه خاص
 * @access  Private
 */
router.get(
    '/:id',
    authGuard,
    validate(matchValidators.getById),
    matchController.getMatchById
);

/**
 * @route   POST /api/v1/matches/:id/report-result
 * @desc    ثبت نتیجه یک مسابقه توسط یکی از شرکت‌کنندگان
 * @access  Private
 */
router.post(
  '/:id/report-result',
  authGuard,
  validate([
      ...matchValidators.getById,
      ...matchValidators.reportResult
  ]),
  matchController.reportMatchResult
);

// ===================================
// Admin/Manager Routes
// ===================================

/**
 * @route   PATCH /api/v1/matches/:id/lobby
 * @desc    تنظیم یا به‌روزرسانی اطلاعات لابی مسابقه توسط مدیر
 * @access  Private (Admin, Tournament Manager)
 */
router.patch(
    '/:id/lobby',
    authGuard,
    rbacGuard('admin', 'tournament_manager'),
    validate([
        ...matchValidators.getById,
        ...matchValidators.updateLobby // اعتبارسنجی جدید برای بدنه درخواست
    ]),
    matchController.updateLobbyDetails
);

export default router;
