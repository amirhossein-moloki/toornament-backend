import authService from '#services/auth.service.js'; // فرض می‌شود این سرویس برای مدیریت احراز هویت وجود دارد
import { asyncWrapper } from '#utils/async.wrapper.js'; // فرض می‌شود این ابزار کمکی برای مدیریت خطا وجود دارد

// کنترلر برای ارسال OTP
const sendOtp = asyncWrapper(async (req, res) => {
  const { phoneNumber } = req.body;
  await authService.sendOtp(phoneNumber);
  res.status(200).json({ message: 'کد تایید با موفقیت ارسال شد.' });
});

// کنترلر برای تایید OTP و ورود/ثبت‌نام
const verifyOtpAndLogin = asyncWrapper(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const { accessToken, refreshToken } = await authService.verifyOtpAndIssueTokens(phoneNumber, otp);

  // بهترین روش امنیتی: Refresh Token در یک کوکی HttpOnly ذخیره می‌شود
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 روز
    path: '/api/v1/auth' // محدود کردن کوکی به مسیرهای احراز هویت
  });

  res.status(200).json({ accessToken });
});

// کنترلر برای ورود با رمز عبور
const login = asyncWrapper(async (req, res) => {
    const { loginIdentifier, password } = req.body;
    const { accessToken, refreshToken } = await authService.loginWithPassword(loginIdentifier, password);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth'
    });
    
    res.status(200).json({ accessToken });
});

// کنترلر برای تازه‌سازی توکن دسترسی
const refreshAccessToken = asyncWrapper(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        return res.status(401).json({ message: 'توکن تازه‌سازی یافت نشد.' });
    }
    const { accessToken, newRefreshToken } = await authService.refreshTokens(incomingRefreshToken);

    // به‌روزرسانی کوکی با توکن تازه‌سازی جدید (در صورت چرخش توکن)
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth'
    });

    res.status(200).json({ accessToken });
});

// کنترلر برای خروج از جلسه فعلی
const logout = asyncWrapper(async (req, res) => {
    const { refreshToken } = req.cookies;
    // req.user توسط authGuard به درخواست اضافه شده است
    await authService.logout(req.user.id, refreshToken);
    
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ message: 'خروج با موفقیت انجام شد.' });
});

// کنترلر برای خروج از تمام دستگاه‌ها
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
  logoutAll
};
