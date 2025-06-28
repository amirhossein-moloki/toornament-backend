// src/api/v1/routes/payment.routes.js

import { Router } from 'express';
import paymentController from '#controllers/payment.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { paymentValidators } from '##validators/payment.validator.js';
import { authGuard } from '#middlewares/auth.guard.js';

const router = Router();

router.post(
  '/wallet/charge',
  authGuard,
  validate(paymentValidators.createChargeRequest),
  paymentController.createWalletChargeRequestController // نام تابع اصلاح شد
);

router.get(
  '/verify',
  validate(paymentValidators.verifyPayment),
  paymentController.verifyPaymentController // نام تابع اصلاح شد
);

export default router;