// File: src/validators/auth.validator.js

import { body } from 'express-validator';

/**
 * @description Contains all validation chains for authentication-related routes.
 */
export const authValidators = {
  /**
   * Validation rules for the send-otp endpoint.
   */
  sendOtp: [
    body('phoneNumber')
      .trim()
      .notEmpty().withMessage('PHONE_NUMBER_IS_REQUIRED')
      .isMobilePhone('fa-IR').withMessage('INVALID_IRAN_PHONE_NUMBER_FORMAT'),
  ],

  /**
   * Validation rules for the verify-otp endpoint.
   */
  verifyOtp: [
    body('phoneNumber')
      .trim()
      .notEmpty().withMessage('PHONE_NUMBER_IS_REQUIRED')
      .isMobilePhone('fa-IR').withMessage('INVALID_IRAN_PHONE_NUMBER_FORMAT'),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP_IS_REQUIRED')
      .isLength({ min: 6, max: 6 }).withMessage('OTP_MUST_BE_6_DIGITS')
      .isNumeric().withMessage('OTP_MUST_BE_NUMERIC'),
  ],

  /**
   * Validation rules for the login endpoint.
   */
  login: [
    body('loginIdentifier')
      .trim()
      .notEmpty().withMessage('LOGIN_IDENTIFIER_IS_REQUIRED'),
    body('password')
      .notEmpty().withMessage('PASSWORD_IS_REQUIRED'),
  ],
};