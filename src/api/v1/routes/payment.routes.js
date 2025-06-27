import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { paymentValidators } from '../../validators/payment.validator.js';
import { authGuard } from '../middlewares/auth.guard.js';

const router = Router();

/**
 * @route   POST /api/v1/payments/wallet/charge
 * @desc    ایجاد یک درخواست پرداخت برای شارژ کیف پول کاربر
 * @access  Private
 */
router.post(
  '/wallet/charge',
  authGuard,
  validate(paymentValidators.createChargeRequest),
  paymentController.createWalletChargeRequest
);

/**
 * @route   GET /api/v1/payments/verify
 * @desc    نقطه بازگشت (Callback) از درگاه پرداخت برای تایید نهایی تراکنش
 * @access  Public
 */
router.get(
  '/verify',
  // اصلاحیه نهایی: افزودن میان‌افزار اعتبارسنجی به مسیر عمومی
  validate(paymentValidators.verifyPayment),
  paymentController.verifyPayment
);


export default router;
