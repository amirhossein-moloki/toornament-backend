import { Router } from 'express';
import matchController from '#controllers/match.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { matchValidators } from '#validators/match.validator.js';
import { authGuard } from '#middlewares/auth.guard.js';
import { rbacGuard } from '#middlewares/rbac.guard.js';
import { USER_ROLES } from '#config/constants.js';

const router = Router();

// ===================================
// Public/Participant Routes
// ===================================
router.get(
    '/',
    authGuard,
    validate(matchValidators.getMatches),
    matchController.getMatches
);

router.get(
    '/:id',
    authGuard,
    validate(matchValidators.getById),
    matchController.getMatchById
);

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
router.patch(
    '/:id/lobby',
    authGuard,
    rbacGuard(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
    validate([
        ...matchValidators.getById,
        ...matchValidators.updateLobby
    ]),
    matchController.updateLobbyDetails
);

export default router;
