import authService from '#services/auth.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js'; // فرض می‌شود این ابزار کمکی برای مدیریت خطا وجود دارد
import { ApiError } from '#utils/ApiError.js'; // فرض می‌شود این ابزار برای مدیریت خطاها وجود دارد

/**
 * @desc    ارسال کد تایید (OTP) به شماره تلفن کاربر
 */
const sendOtp = asyncWrapper(async (req, res) => {
  const { phoneNumber } = req.body;
  await authService.sendOtp(phoneNumber);
  res.status(200).json({ message: 'کد تایید با موفقیت ارسال شد.' });
});

/**
 * @desc    تایید کد OTP و ورود/ثبت‌نام کاربر
 */
const verifyOtpAndLogin = asyncWrapper(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const { accessToken, refreshToken } = await authService.verifyOtpAndIssueTokens(phoneNumber, otp);

  // ذخیره Refresh Token در یک کوکی امن HttpOnly
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 روز
    path: '/api/v1/auth', // محدود کردن کوکی به مسیرهای احراز هویت
  });

  res.status(200).json({ accessToken });
});

/**
 * @desc    ورود با شماره تلفن/ایمیل و رمز عبور
 */
const login = asyncWrapper(async (req, res) => {
    const { loginIdentifier, password } = req.body;
    const { accessToken, refreshToken } = await authService.loginWithPassword(loginIdentifier, password);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
    });
    
    res.status(200).json({ accessToken });
});

/**
 * @desc    تازه‌سازی توکن دسترسی با استفاده از توکن تازه‌سازی
 */
const refreshAccessToken = asyncWrapper(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    // اصلاحیه نهایی: استفاده از ApiError برای حفظ یکپارچگی معماری خطا
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'توکن تازه‌سازی یافت نشد.');
    }
    const { accessToken, newRefreshToken } = await authService.refreshTokens(incomingRefreshToken);

    // به‌روزرسانی کوکی با توکن تازه‌سازی جدید (در صورت چرخش توکن)
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
    });

    res.status(200).json({ accessToken });
});

/**
 * @desc    خروج کاربر از جلسه فعلی
 */
const logout = asyncWrapper(async (req, res) => {
    const { refreshToken } = req.cookies;
    // req.user توسط authGuard به درخواست اضافه شده است
    await authService.logout(req.user.id, refreshToken);
    
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ message: 'خروج با موفقیت انجام شد.' });
});

/**
 * @desc    خروج کاربر از تمام دستگاه‌ها
 */
const logoutAll = asyncWrapper(async (req, res) => {
    await authService.logoutAll(req.user.id);
    
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ message: 'خروج از تمام دستگاه‌ها با موفقیت انجام شد.' });
});

export default {
  sendOtp,
  verifyOtpAndLogin,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
};
