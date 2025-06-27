import axios from 'axios';
import mongoose from 'mongoose';
import config from '../config/server.config.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/user/User.model.js';
import Transaction from '../models/shared/Transaction.model.js';
import logger from '../utils/logger.js';

const ZARINPAL_API_BASE = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/v4/payment'
  : 'https://api.zarinpal.com/pg/v4/payment';

const ZARINPAL_REDIRECT_URL = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/StartPay'
  : 'https://www.zarinpal.com/pg/StartPay';

const MERCHANT_ID = config.zarinpal.merchantId;

/**
 * Creates a payment request to charge a user's wallet.
 * @param {string} userId - The ID of the user to charge.
 * @param {number} amount - The amount to charge in Rials.
 * @returns {Promise<string>} The payment URL to redirect the user to.
 */
async function createWalletChargeRequest(userId, amount) {
  if (!MERCHANT_ID) {
    throw new ApiError(500, 'پیکربندی درگاه پرداخت انجام نشده است.');
  }

  const user = await User.findById(userId).select('phoneNumber email').lean();
  if (!user) {
    throw new ApiError(404, 'کاربر یافت نشد.');
  }

  const transaction = new Transaction({
    user: userId,
    amount,
    description: `شارژ کیف پول برای کاربر ${user.phoneNumber || user.email}`,
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
  
  try {
    const response = await axios.post(`${ZARINPAL_API_BASE}/request.json`, requestBody);

    if (response.data?.data?.code === 100) {
      transaction.authority = response.data.data.authority;
      await transaction.save();
      return `${ZARINPAL_REDIRECT_URL}/${response.data.data.authority}`;
    } else {
      const errorMessage = response.data?.errors?.message || 'خطای نامشخص از درگاه پرداخت';
      throw new ApiError(500, `خطا در ایجاد درخواست پرداخت: ${errorMessage}`);
    }
  } catch (error) {
    logger.error('Zarinpal request failed', { error: error.message });
    throw new ApiError(502, 'خطا در ارتباط با درگاه پرداخت.');
  }
}

/**
 * Verifies a payment callback from Zarinpal and updates user's wallet.
 * @param {string} authority - The authority code from Zarinpal callback.
 * @param {string} status - The status from Zarinpal callback ('OK' or 'NOK').
 * @param {string} transactionId - Our internal transaction ID from the callback URL.
 * @returns {Promise<{refId: string}>} The payment reference ID from Zarinpal.
 */
async function verifyWalletCharge(authority, status, transactionId) {
    if (status !== 'OK') {
        const transaction = await Transaction.findById(transactionId);
        if (transaction) {
            transaction.status = 'canceled';
            await transaction.save();
        }
        throw new ApiError(400, 'تراکنش توسط کاربر لغو شد.');
    }

    const transaction = await Transaction.findOne({ _id: transactionId, authority });
    if (!transaction) throw new ApiError(404, 'تراکنش برای تایید یافت نشد یا نامعتبر است.');
    if (transaction.status !== 'pending') throw new ApiError(400, 'این تراکنش قبلاً پردازش شده است.');
    
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
            const errorMessage = response.data?.errors?.message || 'خطای نامشخص';
            throw new ApiError(400, `تایید پرداخت ناموفق بود: ${errorMessage}`);
        }

    } catch (error) {
        await session.abortTransaction();
        // اصلاحیه نهایی: هیچ عملیات نوشتن در پایگاه داده پس از لغو تراکنش انجام نمی‌شود.
        // وضعیت تراکنش 'pending' باقی می‌ماند که صحیح است و امکان بررسی مجدد را فراهم می‌کند.
        logger.error('Zarinpal verification failed and transaction was aborted', { error: error.message, authority, transactionId });
        
        if (error instanceof ApiError) throw error;
        throw new ApiError(502, 'خطا در فرآیند تایید پرداخت.');
    } finally {
        session.endSession();
    }
}

export default {
    createWalletChargeRequest,
    verifyWalletCharge,
};
