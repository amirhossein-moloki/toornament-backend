import { ApiError } from '#utils/ApiError.js';

/**
 * Middleware for Role-Based Access Control (RBAC).
 * Checks if the authenticated user's role is included in the list of allowed roles.
 * @param {...string} allowedRoles - A list of roles that are allowed to access the route.
 * @returns {function} An Express middleware function.
 */
const rbacGuard = (...allowedRoles) => {
  return (req, res, next) => {
    // This guard must run after the authGuard, so req.user is expected to exist.
    const userRole = req.user?.role;

    if (!userRole) {
      // This case should theoretically not be reached if authGuard is properly implemented.
      return next(new ApiError(403, 'اطلاعات نقش کاربر یافت نشد.'));
    }

    // Check if the user's role is in the list of roles allowed for this route.
    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(403, 'شما اجازه دسترسی به این منبع را ندارید.'));
    }

    // If the role is valid, proceed to the next middleware or controller.
    next();
  };
};

export { rbacGuard };
