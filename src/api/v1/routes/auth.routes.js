// File: src/api/v1/routes/auth.routes.js

import { Router } from 'express';
import authController from '#controllers/auth.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authValidators } from '#validators/auth.validator.js'; // The .js extension is important
import { authGuard } from '#middlewares/auth.guard.js';

const router = Router();

// --- OTP Authentication ---
router.post(
  '/otp/send',
  validate(authValidators.sendOtp),
  authController.sendOtp
);

router.post(
  '/otp/verify',
  validate(authValidators.verifyOtp),
  authController.verifyOtpAndLogin
);

// --- Password Authentication ---
router.post(
  '/login',
  validate(authValidators.login),
  authController.login
);

// --- Session & Token Management ---
router.post(
  '/refresh',
  authController.refreshAccessToken
);

router.post(
  '/logout',
  authGuard,
  authController.logout
);

router.post(
  '/logout-all',
  authGuard,
  authController.logoutAll
);

export default router;