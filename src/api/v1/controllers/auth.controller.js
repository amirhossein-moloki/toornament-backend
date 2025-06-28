import authService from '#services/auth.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';

const sendOtp = asyncWrapper(async (req, res) => {
  const { phoneNumber } = req.body;
  await authService.sendOtp(phoneNumber);
  res.status(200).json(new ApiResponse(200, null, 'OTP sent successfully.'));
});

const verifyOtpAndLogin = asyncWrapper(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const { accessToken, refreshToken } = await authService.verifyOtpAndIssueTokens(phoneNumber, otp);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  });

  res.status(200).json(new ApiResponse(200, { accessToken }, 'Login successful.'));
});

const login = asyncWrapper(async (req, res) => {
    const { loginIdentifier, password } = req.body;
    const { accessToken, refreshToken } = await authService.loginWithPassword(loginIdentifier, password);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
    });
    
    res.status(200).json(new ApiResponse(200, { accessToken }, 'Login successful.'));
});

const refreshAccessToken = asyncWrapper(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token is missing.');
    }
    const { accessToken, newRefreshToken } = await authService.refreshTokens(incomingRefreshToken);

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
    });

    res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed successfully.'));
});

const logout = asyncWrapper(async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.logout(req.user.id, refreshToken);
    
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

const logoutAll = asyncWrapper(async (req, res) => {
    await authService.logoutAll(req.user.id);
    
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json(new ApiResponse(200, null, 'Logged out from all devices successfully.'));
});

export default {
  sendOtp,
  verifyOtpAndLogin,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
};
