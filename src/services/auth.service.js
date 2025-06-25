import otpGenerator from 'otp-generator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user/User.model.js';
import { ApiError } from '../utils/ApiError.js'; // فرض بر وجود یک کلاس خطای سفارشی
// import { sendSms } from './sms.service.js'; // این سرویس باید به سرویس‌دهنده پیامک شما متصل شود

/**
 * @private
 * @desc یک تابع داخلی پاک برای تولید توکن‌ها بدون ذخیره‌سازی.
 * @param {object} user - داکیومنت کاربر از مانگوس.
 * @returns {{accessToken: string, refreshToken: string}}
 */
function _generateTokens(user) {
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}

/**
 * @desc یک کد OTP تولید کرده، آن را برای کاربر ذخیره و ارسال می‌کند.
 * @param {string} phoneNumber - شماره تلفن کاربر.
 */
async function sendOtp(phoneNumber) {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const expires = new Date(Date.now() + 2 * 60 * 1000); // انقضا تا ۲ دقیقه دیگر

  await User.findOneAndUpdate(
    { phoneNumber },
    { verificationCode: otp, verificationCodeExpires: expires },
    { new: true, upsert: true }
  );

  // TODO: اتصال به سرویس پیامک واقعی
  // await sendSms(phoneNumber, `کد تایید شما: ${otp}`);
  console.log(`OTP for ${phoneNumber} is: ${otp}`); // برای تست در حین توسعه
}

/**
 * @desc کد OTP را تایید کرده و توکن‌های Access و Refresh را صادر می‌کند.
 * @param {string} phoneNumber - شماره تلفن کاربر.
 * @param {string} otp - کد تایید وارد شده.
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
async function verifyOtpAndIssueTokens(phoneNumber, otp) {
  const user = await User.findOne({ 
      phoneNumber, 
      verificationCode: otp, 
      verificationCodeExpires: { $gt: Date.now() } 
  });

  if (!user) {
    throw new ApiError(400, 'کد تایید نامعتبر است یا منقضی شده.');
  }

  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  if (user.status === 'pending_verification') {
    user.status = 'active';
  }
  
  const { accessToken, refreshToken } = _generateTokens(user);
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
}

/**
 * @desc ورود کاربر با استفاده از شناسه (ایمیل/شماره تلفن) و رمز عبور.
 * @param {string} loginIdentifier - شناسه ورود کاربر.
 * @param {string} password - رمز عبور کاربر.
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
async function loginWithPassword(loginIdentifier, password) {
    const user = await User.findOne({
        $or: [{ email: loginIdentifier }, { phoneNumber: loginIdentifier }]
    }).select('+password');

    if (!user) {
        throw new ApiError(404, 'کاربری با این مشخصات یافت نشد.');
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, 'رمز عبور نامعتبر است.');
    }

    const { accessToken, refreshToken } = _generateTokens(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
}

/**
 * @desc یک Access Token جدید با استفاده از Refresh Token معتبر صادر می‌کند (با چرخش توکن).
 * @param {string} incomingRefreshToken - توکن تازه‌سازی دریافتی از کلاینت.
 * @returns {Promise<{accessToken: string, newRefreshToken: string}>}
 */
async function refreshTokens(incomingRefreshToken) {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(incomingRefreshToken)) {
        throw new ApiError(403, 'دسترسی نامعتبر است. لطفاً دوباره وارد شوید.');
    }
    
    // ۱. تولید توکن‌های جدید
    const { accessToken, refreshToken: newRefreshToken } = _generateTokens(user);

    // ۲. چرخش توکن: حذف توکن قدیمی و افزودن توکن جدید در یک عملیات
    user.refreshTokens = user.refreshTokens.filter(token => token !== incomingRefreshToken);
    user.refreshTokens.push(newRefreshToken);

    // ۳. ذخیره تغییرات در دیتابیس
    await user.save();

    return { accessToken, newRefreshToken };
}

/**
 * @desc خروج کاربر از جلسه فعلی با باطل کردن توکن.
 * @param {string} userId - شناسه کاربر.
 * @param {string} tokenToInvalidate - توکن تازه‌سازی برای باطل کردن.
 */
async function logout(userId, tokenToInvalidate) {
    if (!tokenToInvalidate) return;
    await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: tokenToInvalidate }
    });
}

/**
 * @desc خروج کاربر از تمام دستگاه‌ها با باطل کردن تمام توکن‌ها.
 * @param {string} userId - شناسه کاربر.
 */
async function logoutAll(userId) {
    await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: [] }
    });
}

export default {
  sendOtp,
  verifyOtpAndIssueTokens,
  loginWithPassword,
  refreshTokens,
  logout,
  logoutAll,
};
