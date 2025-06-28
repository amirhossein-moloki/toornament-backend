// src/middlewares/auth.middleware.js

import { ApiError } from '@/utils/ApiError.js'; // Adjust the import path as necessary
import { asyncHandler } from '@/utils/asyncHandler.js'; // Assuming asyncHandler exists

/**
 * @desc Middleware to verify JWT token and attach user data to req.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const verifyJWT = asyncHandler(async (req, res, next) => {
    // In a real application, this would involve:
    // 1. Getting the token from req.headers.authorization
    // 2. Verifying the token using a secret key
    // 3. Decoding the user payload
    // 4. Finding the user in the database to ensure they are active

    // For demonstration, we'll mock req.user based on a simple header for testing
    // You can modify this to simulate different roles (e.g., 'admin', 'participant')
    const mockRole = req.headers['x-mock-user-role'] || 'participant';
    const mockUserId = req.headers['x-mock-user-id'] || 'mockUserId123';

    if (!mockUserId) {
        throw new ApiError(401, 'Unauthorized: Mock User ID not provided.');
    }

    req.user = {
        _id: mockUserId,
        username: `mockUser_${mockUserId}`,
        role: mockRole
    };

    next();
});

export { verifyJWT };
