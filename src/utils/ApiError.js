/**
 * @class ApiError
 * @extends Error
 * @description A custom error class for handling operational, predictable errors in the API.
 * It allows specifying an HTTP status code and an operational flag.
 */
class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   * @param {number} statusCode - The HTTP status code for the error (e.g., 400, 404, 500).
   * @param {string} message - The error message that will be sent to the client.
   * @param {boolean} [isOperational=true] - A flag to distinguish between operational errors (expected) and programmer errors (bugs).
   * @param {string} [stack=''] - Optional stack trace. If not provided, it will be captured.
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
