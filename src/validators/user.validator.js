import { body, query, param } from 'express-validator';
import User from '#models/user/User.model.js'; // Corrected path alias if necessary
import { USER_ROLES, USER_STATUSES } from '#config/constants.js'; // Using centralized constants

export const userValidators = {
  /**
   * Validation rules for the GET /users route (admin).
   */
  getUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('PAGE_MUST_BE_POSITIVE_INTEGER'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('LIMIT_MUST_BE_BETWEEN_1_AND_100'),
  ],

  /**
   * Validation rules for routes with a user ID in params.
   */
  getUserById: [
    param('id').isMongoId().withMessage('INVALID_USER_ID'),
  ],

  /**
   * Validation rules for the PATCH /users/me route.
   */
  updateMe: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 }).withMessage('USERNAME_MUST_BE_3_TO_20_CHARS')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user && user._id.toString() !== req.user.id) {
          throw new Error('USERNAME_ALREADY_TAKEN');
        }
        return true;
      }),
    body('email')
      .optional()
      .isEmail().withMessage('INVALID_EMAIL_FORMAT')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user && user._id.toString() !== req.user.id) {
          throw new Error('EMAIL_ALREADY_TAKEN');
        }
        return true;
      }),
    body('avatar').optional().isURL().withMessage('INVALID_AVATAR_URL'),
  ],

  /**
   * Validation rules for the PATCH /users/:id route (admin).
   */
  updateUser: [
    body('email')
      .optional()
      .isEmail().withMessage('INVALID_EMAIL_FORMAT')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('EMAIL_ALREADY_TAKEN');
        }
        return true;
      }),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 }).withMessage('USERNAME_MUST_BE_3_TO_20_CHARS')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('USERNAME_ALREADY_TAKEN');
        }
        return true;
      }),
    body('role')
      .optional()
      .isIn(Object.values(USER_ROLES)).withMessage('INVALID_USER_ROLE'),
    body('status')
      .optional()
      .isIn(Object.values(USER_STATUSES)).withMessage('INVALID_USER_STATUS'),
    body('walletBalance')
      .optional()
      .isInt({ min: 0 }).withMessage('WALLET_BALANCE_MUST_BE_NON_NEGATIVE'),
  ],
};
