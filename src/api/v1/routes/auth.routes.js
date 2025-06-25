import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authValidators } from '../../validators/auth.validator.js';
import { authGuard } from '../middlewares/auth.guard.js';

const router = Router();

// --- OTP Authentication ---

/**
 * @route   POST /api/v1/auth/otp/send
 * @desc    ارسال کد تایید (OTP) به شماره تلفن کاربر
 * @access  Public
 */
router.post(
  '/otp/send',
  validate(authValidators.sendOtp),
  authController.sendOtp
);

/**
 * @route   POST /api/v1/auth/otp/verify
 * @desc    تایید کد OTP و دریافت توکن‌ها (برای ورود و ثبت‌نام)
 * @access  Public
 */
router.post(
  '/otp/verify',
  validate(authValidators.verifyOtp),
  authController.verifyOtpAndLogin
);

// --- Password Authentication ---

/**
 * @route   POST /api/v1/auth/login
 * @desc    ورود با شماره تلفن/ایمیل و رمز عبور
 * @access  Public
 */
router.post(
    '/login',
    validate(authValidators.login), // نیازمند ساخت ولیدیتور برای لاگین
    authController.login
);


// --- Session & Token Management ---

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    دریافت Access Token جدید با استفاده از Refresh Token
 * @access  Public (اعتبارسنجی از طریق Refresh Token موجود در کوکی)
 */
router.post(
    '/refresh',
    authController.refreshAccessToken
);


/**
 * @route   POST /api/v1/auth/logout
 * @desc    خروج کاربر از سیستم (ابطال توکن جلسه فعلی)
 * @access  Private (نیازمند توکن معتبر)
 */
router.post(
    '/logout',
    authGuard,
    authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    خروج کاربر از تمام دستگاه‌ها (ابطال تمام توکن‌های تازه‌سازی)
 * @access  Private
 */
router.post(
    '/logout-all',
    authGuard,
    authController.logoutAll
);


export default router;
