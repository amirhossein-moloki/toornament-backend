import { Router } from 'express';
import tournamentController from '../controllers/tournament.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { tournamentValidators } from '../../validators/tournament.validator.js';
import { authGuard } from '../middlewares/auth.guard.js';
import { rbacGuard } from '../middlewares/rbac.guard.js';

const router = Router();

// --- Public Routes ---

/**
 * @route   GET /api/v1/tournaments
 * @desc    دریافت لیست تمام تورنومنت‌ها (با صفحه‌بندی)
 * @access  Public
 */
router.get(
    '/', 
    validate(tournamentValidators.getAll), // اعتبارسنجی پارامترهای صفحه‌بندی
    tournamentController.getAllTournaments
);

/**
 * @route   GET /api/v1/tournaments/:id
 * @desc    دریافت جزئیات یک تورنومنت خاص
 * @access  Public
 */
router.get(
    '/:id', 
    validate(tournamentValidators.getById), // اعتبارسنجی پارامتر ID
    tournamentController.getTournamentById
);


// --- Admin/Manager Routes ---

/**
 * @route   POST /api/v1/tournaments
 * @desc    ایجاد یک تورنومنت جدید
 * @access  Private (Admin, Tournament Manager)
 */
router.post(
  '/',
  authGuard,
  rbacGuard('admin', 'tournament_manager'),
  validate(tournamentValidators.createTournament),
  tournamentController.createTournament
);

/**
 * @route   PATCH /api/v1/tournaments/:id
 * @desc    به‌روزرسانی یک تورنومنت موجود
 * @access  Private (Admin, Tournament Manager)
 */
router.patch(
  '/:id',
  authGuard,
  rbacGuard('admin', 'tournament_manager'),
  // ترکیب اعتبارسنجی پارامتر ID و بدنه درخواست
  validate([
      ...tournamentValidators.getById,
      ...tournamentValidators.updateTournament
  ]),
  tournamentController.updateTournament
);

/**
 * @route   DELETE /api/v1/tournaments/:id
 * @desc    حذف یک تورنومنت
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authGuard,
  rbacGuard('admin'),
  validate(tournamentValidators.getById), // اعتبارسنجی ID
  tournamentController.deleteTournament
);

export default router;
