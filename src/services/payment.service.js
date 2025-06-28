// src/services/payment.service.js

import axios from 'axios';
import mongoose from 'mongoose';
import config from '@/config/server.config.js';
import { ApiError } from '@/utils/ApiError.js';
import User from '@/models/user/User.model.js';
import Transaction from '@/models/shared/Transaction.model.js';
import logger from '@/utils/logger.js';

// تمام ثابت‌های مربوط به زرین‌پال به اینجا منتقل می‌شوند
const ZARINPAL_API_BASE = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/v4/payment'
  : 'https://api.zarinpal.com/pg/v4/payment';

const ZARINPAL_REDIRECT_URL = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/StartPay'
  : 'https://www.zarinpal.com/pg/StartPay';

const MERCHANT_ID = config.zarinpal.merchantId;

/**
 * @desc یک درخواست پرداخت برای شارژ کیف پول کاربر ایجاد می‌کند.
 * @param {string} userId - شناسه کاربری که کیف پولش شارژ می‌شود.
 * @param {number} amount - مبلغ به ریال.
 * @returns {Promise<string>} آدرس URL درگاه پرداخت برای redirect کردن کاربر.
 */
async function createWalletChargeRequest(userId, amount) {
  if (!MERCHANT_ID) {
    throw new ApiError(500, 'PAYMENT_GATEWAY_NOT_CONFIGURED');
  }

  const user = await User.findById(userId).select('phoneNumber email').lean();
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND');
  }

  // ۱. ایجاد سند تراکنش اولیه با وضعیت 'pending'
  const transaction = new Transaction({
    user: userId,
    amount,
    description: `Wallet charge for user ${user.phoneNumber || user.email}`,
    type: 'wallet_charge',
    status: 'pending',
  });

  const callbackUrl = `${config.serverUrl}/api/v1/payments/verify?transactionId=${transaction._id}`;

  const requestBody = {
    merchant_id: MERCHANT_ID,
    amount,
    description: transaction.description,
    callback_url: callbackUrl,
    metadata: { mobile: user.phoneNumber, email: user.email },
  };

  // ۲. ارسال درخواست به زرین‌پال
  try {
    const response = await axios.post(`${ZARINPAL_API_BASE}/request.json`, requestBody);

    if (response.data?.data?.code === 100) {
      // ۳. ذخیره کد Authority در تراکنش و بازگرداندن لینک پرداخت
      transaction.authority = response.data.data.authority;
      await transaction.save();
      return `${ZARINPAL_REDIRECT_URL}/${response.data.data.authority}`;
    } else {
      const errorMessage = response.data?.errors?.message || 'Unknown error from payment gateway';
      throw new ApiError(500, `Error creating payment request: ${errorMessage}`);
    }
  } catch (error) {
    logger.error('Zarinpal request failed', { error: error.message, data: error.response?.data });
    throw new ApiError(502, 'PAYMENT_GATEWAY_CONNECTION_ERROR');
  }
}

/**
 * @desc تایید پرداخت پس از بازگشت کاربر از درگاه و شارژ کیف پول در یک تراکنش اتمیک.
 * @param {string} authority - کد Authority از کوئری پارامتر.
 * @param {string} status - وضعیت بازگشتی از درگاه ('OK' یا 'NOK').
 * @param {string} transactionId - شناسه تراکنش داخلی ما.
 * @returns {Promise<{refId: string}>} شناسه پیگیری پرداخت موفق.
 */
async function verifyWalletCharge(authority, status, transactionId) {
    if (status !== 'OK') {
        // اگر کاربر تراکنش را لغو کند، وضعیت آن را در دیتابیس به‌روز می‌کنیم
        const transaction = await Transaction.findById(transactionId);
        if (transaction) {
            transaction.status = 'canceled';
            await transaction.save();
        }
        throw new ApiError(400, 'TRANSACTION_CANCELED_BY_USER');
    }

    const transaction = await Transaction.findOne({ _id: transactionId, authority });
    if (!transaction) throw new ApiError(404, 'TRANSACTION_NOT_FOUND_OR_INVALID');
    if (transaction.status !== 'pending') throw new ApiError(400, 'TRANSACTION_ALREADY_PROCESSED');

    const verificationBody = {
        merchant_id: MERCHANT_ID,
        authority,
        amount: transaction.amount,
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const response = await axios.post(`${ZARINPAL_API_BASE}/verify.json`, verificationBody);

        if ([100, 101].includes(response.data?.data?.code)) {
            if (response.data.data.code === 101) {
                logger.warn(`Payment for transaction ${transactionId} was already verified.`);
                await session.abortTransaction();
                return { refId: transaction.refId };
            }

            // ۴. اتمام تراکنش دیتابیس: آپدیت کاربر و سند تراکنش
            transaction.status = 'completed';
            transaction.refId = response.data.data.ref_id;

            await User.findByIdAndUpdate(
                transaction.user,
                { $inc: { walletBalance: transaction.amount } },
                { session }
            );

            await transaction.save({ session });
            await session.commitTransaction();

            return { refId: transaction.refId };

        } else {
            const errorMessage = response.data?.errors?.message || 'Unknown error';
            throw new ApiError(400, `Payment verification failed: ${errorMessage}`);
        }

    } catch (error) {
        await session.abortTransaction();
        logger.error('Zarinpal verification failed and transaction was aborted', { error: error.message, authority, transactionId });

        if (error instanceof ApiError) throw error;
        throw new ApiError(502, 'PAYMENT_VERIFICATION_ERROR');
    } finally {
        session.endSession();
    }
}

export default {
    createWalletChargeRequest,
    verifyWalletCharge,
};