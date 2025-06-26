import { Router } from 'express';
import matchController from '../controllers/match.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { matchValidators } from '../../validators/match.validator.js';
import { authGuard } from '../middlewares/auth.guard.js';

const router = Router();

/**
 * @route   GET /api/v1/matches
 * @desc    دریافت لیست مسابقات (مثلاً برای یک کاربر یا یک تورنومنت خاص)
 * @access  Private
 */
router.get(
    '/',
    authGuard,
    validate(matchValidators.getMatches), // اعتبارسنجی پارامترهای فیلترینگ
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


export default router;
