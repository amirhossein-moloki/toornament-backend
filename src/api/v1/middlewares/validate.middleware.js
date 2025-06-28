import { validationResult } from 'express-validator';
import { ApiError } from '#utils/ApiError.js';

/**
 * A middleware that runs validation chains and handles errors.
 * If validation fails, it throws an ApiError with a 400 status code.
 * Otherwise, it passes control to the next middleware.
 * @param {Array} validations - An array of validation chains from express-validator.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validation chains concurrently.
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Gather the validation results from the request.
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      // If there are no errors, proceed to the next middleware/controller.
      return next();
    }

    // If there are errors, format them and throw a single ApiError.
    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

    // Throw a 400 Bad Request error, which will be caught by our global error handler.
    next(new ApiError(400, 'اطلاعات ورودی نامعتبر است.', true, { errors: extractedErrors }));
  };
};

export { validate };
