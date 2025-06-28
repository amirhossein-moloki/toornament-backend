import { Router } from 'express';
import tournamentController from '@/controllers/tournament.controller.js';
import registrationController from '@/controllers/registration.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { tournamentValidators } from '@/validators/tournament.validator.js';
import { authGuard } from '@/middlewares/auth.guard.js';
import { rbacGuard } from '@/middlewares/rbac.guard.js';

const router = Router();

// ===================================
// Public Tournament Routes
// ===================================

router.get(
    '/', 
    validate(tournamentValidators.getAll),
    tournamentController.getAllTournaments
);

router.get(
    '/:id', 
    validate(tournamentValidators.getById),
    tournamentController.getTournamentById
);

// ===================================
// User Interaction Routes
// ===================================

router.post(
    '/:id/register',
    authGuard,
    validate([
        ...tournamentValidators.getById,
        ...tournamentValidators.registerForTournament
    ]),
    registrationController.registerForTournament
);
  
// ===================================
// Admin/Manager Routes
// ===================================

/**
 * @route   POST /api/v1/tournaments/:id/start
 * @desc    شروع یک تورنومنت و ساخت براکت‌ها و مسابقات اولیه
 * @access  Private (Admin, Tournament Manager)
 */
router.post(
    '/:id/start',
    authGuard,
    rbacGuard('admin', 'tournament_manager'),
    validate(tournamentValidators.getById), // فقط اعتبارسنجی شناسه تورنومنت
    tournamentController.startTournament
);

router.post(
  '/',
  authGuard,
  rbacGuard('admin', 'tournament_manager'),
  validate(tournamentValidators.createTournament),
  tournamentController.createTournament
);

router.patch(
  '/:id',
  authGuard,
  rbacGuard('admin', 'tournament_manager'),
  validate([
      ...tournamentValidators.getById,
      ...tournamentValidators.updateTournament
  ]),
  tournamentController.updateTournament
);

router.delete(
  '/:id',
  authGuard,
  rbacGuard('admin'),
  validate(tournamentValidators.getById),
  tournamentController.deleteTournament
);

export default router;
