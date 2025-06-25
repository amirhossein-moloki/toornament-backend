import { body, query, param } from 'express-validator';

const TOURNAMENT_STATUSES = ['draft', 'registration_open', 'registration_closed', 'active', 'completed', 'canceled'];
const TOURNAMENT_STRUCTURES = ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'battle_royale'];
const PRIZE_TYPES = ['wallet_credit', 'virtual_item', 'physical_item', 'other'];

export const tournamentValidators = {
  /**
   * قوانین برای مسیر دریافت لیست تورنومنت‌ها (صفحه‌بندی)
   */
  getAll: [
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
    param('id').isMongoId().withMessage('شناسه تورنومنت نامعتبر است.'),
  ],

  /**
   * قوانین برای مسیر ایجاد یک تورنومنت جدید
   */
  createTournament: [
    body('name').trim().notEmpty().withMessage('نام تورنومنت الزامی است.').isLength({ max: 100 }),
    body('game').isMongoId().withMessage('شناسه بازی نامعتبر است.'),
    body('structure').isIn(TOURNAMENT_STRUCTURES).withMessage('ساختار تورنومنت نامعتبر است.'),
    body('teamSize').isInt({ min: 1 }).withMessage('اندازه تیم باید حداقل ۱ باشد.'),
    body('maxParticipants').isInt({ min: 2 }).withMessage('ظرفیت تورنومنت باید حداقل ۲ باشد.'),
    body('rules').trim().notEmpty().withMessage('قوانین تورنومنت الزامی است.'),
    
    // اصلاحیه نهایی طبق حکم دادگاه: اعتبارسنجی یکپارچگی زمانی
    body('registrationStartDate').isISO8601().toDate().withMessage('فرمت تاریخ شروع ثبت‌نام نامعتبر است.'),
    body('registrationEndDate').isISO8601().toDate().withMessage('فرمت تاریخ پایان ثبت‌نام نامعتبر است.')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.registrationStartDate)) {
          throw new Error('تاریخ پایان ثبت‌نام باید بعد از تاریخ شروع آن باشد.');
        }
        return true;
      }),
    body('checkInStartDate').isISO8601().toDate().withMessage('فرمت تاریخ شروع اعلام حضور نامعتبر است.')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.registrationEndDate)) {
            throw new Error('تاریخ شروع اعلام حضور باید بعد از پایان ثبت‌نام باشد.');
        }
        return true;
      }),
    body('tournamentStartDate').isISO8601().toDate().withMessage('فرمت تاریخ شروع تورنومنت نامعتبر است.')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.checkInStartDate)) {
            throw new Error('تاریخ شروع تورنومنت باید بعد از شروع اعلام حضور باشد.');
        }
        return true;
      }),

    body('prizeStructure').optional().isArray().withMessage('ساختار جایزه باید یک آرایه باشد.'),
    body('prizeStructure.*.rank').notEmpty().isInt({ min: 1 }).withMessage('رتبه جایزه باید یک عدد صحیح و مثبت باشد.'),
    body('prizeStructure.*.prizes').notEmpty().isArray({ min: 1 }).withMessage('هر رتبه باید حداقل یک جایزه داشته باشد.'),
    body('prizeStructure.*.prizes.*.type').isIn(PRIZE_TYPES).withMessage('نوع جایزه نامعتبر است.'),
    body('prizeStructure.*.prizes.*.description').trim().notEmpty().withMessage('توضیحات جایزه الزامی است.'),
    body('prizeStructure.*.prizes.*.amount').if(body('prizeStructure.*.prizes.*.type').equals('wallet_credit')).isInt({ min: 0 }).withMessage('مقدار جایزه نقدی باید یک عدد صحیح باشد.'),
    body('prizeStructure.*.prizes.*.itemName').if(body('prizeStructure.*.prizes.*.type').isIn(['virtual_item', 'physical_item'])).trim().notEmpty().withMessage('نام آیتم جایزه الزامی است.'),
  ],

  /**
   * قوانین برای مسیر به‌روزرسانی یک تورنومنت
   */
  updateTournament: [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('game').optional().isMongoId(),
    body('status').optional().isIn(TOURNAMENT_STATUSES),
    // ... سایر فیلدهای اختیاری ...
  ],
  
  /**
   * قوانین برای مسیر ثبت نام در تورنومنت
   */
  registerForTournament: [
    body('teamId').optional().isMongoId().withMessage('شناسه تیم نامعتبر است.'),
  ]
};
