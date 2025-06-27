import { body, query } from 'express-validator';

export const paymentValidators = {
  /**
   * Rules for the create wallet charge request
   * @route POST /api/v1/payments/wallet/charge
   */
  createChargeRequest: [
    body('amount')
      .notEmpty().withMessage('مبلغ الزامی است.')
      .isInt({ min: 1000 }).withMessage('مبلغ باید حداقل ۱۰۰۰ ریال باشد.'),
  ],

  /**
   * Rules for the Zarinpal callback verification
   * @route GET /api/v1/payments/verify
   */
  verifyPayment: [
    // Note: Zarinpal uses PascalCase for query parameters.
    query('Status')
      .notEmpty().withMessage('وضعیت تراکنش الزامی است.')
      .isIn(['OK', 'NOK']).withMessage('وضعیت تراکنش نامعتبر است.'),
    query('Authority')
      .notEmpty().withMessage('کد Authority الزامی است.')
      .isString().withMessage('کد Authority باید یک رشته باشد.'),
    // This is our internal ID that we pass in the callback URL query
    query('transactionId')
        .notEmpty().withMessage('شناسه تراکنش الزامی است.')
        .isMongoId().withMessage('شناسه تراکنش نامعتبر است.'),
  ],
};
