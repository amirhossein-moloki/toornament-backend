import { body, query, param } from 'express-validator';

export const matchValidators = {
  /**
   * قوانین برای مسیر دریافت لیست مسابقات
   * @route GET /api/v1/matches
   */
  getMatches: [
    query('tournamentId')
      .optional()
      .isMongoId().withMessage('شناسه تورنومنت نامعتبر است.'),
    query('userId')
      .optional()
      .isMongoId().withMessage('شناسه کاربر نامعتبر است.'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('شماره صفحه باید یک عدد مثبت باشد.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('تعداد آیتم‌ها در هر صفحه باید بین ۱ تا ۱۰۰ باشد.'),
  ],

  /**
   * قوانین برای مسیرهایی که شامل پارامتر ID هستند
   */
  getById: [
    param('id').isMongoId().withMessage('شناسه مسابقه نامعتبر است.'),
  ],

  /**
   * قوانین برای مسیر ثبت نتیجه یک مسابقه
   * @route POST /api/v1/matches/:id/report-result
   */
  reportResult: [
    // اصلاحیه نهایی: اعتبارسنجی شرطی بر اساس نوع نتیجه ارسالی

    // ۱. اطمینان از اینکه دقیقاً یکی از فیلدهای 'scores' یا 'results' وجود دارد
    body().custom((value, { req }) => {
      const hasScores = req.body.scores !== undefined;
      const hasResults = req.body.results !== undefined;
      if (hasScores && hasResults) {
        throw new Error('تنها یکی از فیلدهای "scores" یا "results" باید ارسال شود.');
      }
      if (!hasScores && !hasResults) {
        throw new Error('یکی از فیلدهای "scores" یا "results" برای ثبت نتیجه الزامی است.');
      }
      return true;
    }),

    // ۲. قوانین اعتبارسنجی برای فرمت 'scores' (مسابقات استاندارد)
    body('scores')
      .if(body('scores').exists())
      .isArray({ min: 2, max: 2 }).withMessage('برای یک مسابقه استاندارد، نتیجه باید دقیقاً برای دو شرکت‌کننده ثبت شود.')
      .custom((scores = []) => {
        const participantIds = scores.map(s => s.participantId);
        const uniqueParticipantIds = new Set(participantIds);
        if (uniqueParticipantIds.size !== participantIds.length) {
          throw new Error('شناسه شرکت‌کنندگان در نتایج باید یکتا باشد.');
        }
        return true;
      }),
    body('scores.*.participantId')
      .if(body('scores').exists())
      .isMongoId().withMessage('شناسه شرکت‌کننده در نتایج نامعتبر است.'),
    body('scores.*.score')
      .if(body('scores').exists())
      .isInt({ min: 0 }).withMessage('امتیاز باید یک عدد صحیح و غیرمنفی باشد.'),

    // ۳. قوانین اعتبارسنجی برای فرمت 'results' (مسابقات بتل رویال)
    body('results')
      .if(body('results').exists())
      .isArray({ min: 1 }).withMessage('نتایج بتل رویال باید در قالب یک آرایه ارسال شوند.'),
    body('results.*.participantId')
      .if(body('results').exists())
      .isMongoId().withMessage('شناسه شرکت‌کننده در نتایج بتل رویال نامعتبر است.'),
    body('results.*.rank')
      .if(body('results').exists())
      .isInt({ min: 1 }).withMessage('رتبه باید یک عدد صحیح و مثبت باشد.'),
    body('results.*.kills')
      .if(body('results').exists())
      .isInt({ min: 0 }).withMessage('تعداد کیل‌ها باید یک عدد صحیح و غیرمنفی باشد.'),
  ],
};
