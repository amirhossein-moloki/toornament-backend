// src/controllers/payment.controller.js

import paymentService from '#services/payment.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import { ApiResponse } from '#utils/ApiResponse.js';

/**
 * @desc کنترلر برای ایجاد درخواست شارژ کیف پول.
 */
const createWalletChargeRequestController = asyncWrapper(async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id; // from authGuard

  const paymentUrl = await paymentService.createWalletChargeRequest(userId, amount);

  res.status(200).json(new ApiResponse(200, { paymentUrl }, 'Payment URL created successfully.'));
});

/**
 * @desc کنترلر برای تایید پرداخت پس از بازگشت از درگاه.
 */
const verifyPaymentController = asyncWrapper(async (req, res) => {
  const { Authority, Status, transactionId } = req.query;

  const result = await paymentService.verifyWalletCharge(Authority, Status, transactionId);

  // پس از تایید موفق، کاربر را به یک صفحه مشخص در فرانت‌اند هدایت می‌کنیم
  const frontendRedirectUrl = `${process.env.FRONTEND_URL}/payment/success?refId=${result.refId}`;
  res.redirect(frontendRedirectUrl);
});

export default {
  createWalletChargeRequestController,
  verifyPaymentController,
};