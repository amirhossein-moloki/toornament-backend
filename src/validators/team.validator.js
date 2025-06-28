import { body, query, param } from 'express-validator';
import Team from '@/models/team.model.js';

export const teamValidators = {
  /**
   * قوانین برای مسیر دریافت لیست تیم‌ها
   * @route GET /api/v1/teams
   */
  getTeams: [
    query('game').optional().isMongoId().withMessage('شناسه بازی نامعتبر است.'),
    query('page').optional().isInt({ min: 1 }).withMessage('شماره صفحه باید یک عدد مثبت باشد.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد آیتم‌ها در هر صفحه باید بین ۱ تا ۱۰۰ باشد.'),
  ],

  /**
   * قوانین برای مسیرهایی که شامل پارامتر ID تیم هستند
   */
  getById: [
    param('id').isMongoId().withMessage('شناسه تیم نامعتبر است.'),
  ],

  /**
   * قوانین برای مسیر ایجاد یک تیم جدید
   * @route POST /api/v1/teams
   */
  createTeam: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 30 }).withMessage('نام تیم باید بین ۳ تا ۳۰ کاراکتر باشد.')
      .custom(async (value, { req }) => {
        // اصلاحیه نهایی: بررسی یکتایی نام تیم در محدوده بازی مشخص شده
        const team = await Team.findOne({ name: value, game: req.body.game });
        if (team) {
          throw new Error('تیمی با این نام برای این بازی قبلاً ثبت شده است.');
        }
        return true;
      }),
    body('tag')
      .trim()
      .isLength({ min: 2, max: 5 }).withMessage('تگ تیم باید بین ۲ تا ۵ کاراکتر باشد.')
      .isUppercase().withMessage('تگ تیم باید با حروف بزرگ باشد.')
      .custom(async (value) => {
        const team = await Team.findOne({ tag: value });
        if (team) {
          throw new Error('این تگ قبلاً توسط تیم دیگری استفاده شده است.');
        }
        return true;
      }),
    body('game').isMongoId().withMessage('شناسه بازی نامعتبر است.'),
  ],

  /**
   * قوانین برای مسیر به‌روزرسانی اطلاعات تیم
   * @route PATCH /api/v1/teams/:id
   */
  updateTeam: [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .custom(async (value, { req }) => {
            // اصلاحیه نهایی: برای بررسی یکتایی، باید بازی تیم فعلی را پیدا کنیم
            const currentTeam = await Team.findById(req.params.id);
            if (currentTeam) {
                // بررسی می‌کنیم آیا تیم دیگری با این نام در همان بازی وجود دارد
                const conflictingTeam = await Team.findOne({ name: value, game: currentTeam.game, _id: { $ne: req.params.id } });
                if (conflictingTeam) {
                    throw new Error('تیمی با این نام برای این بازی قبلاً ثبت شده است.');
                }
            }
            return true;
        }),
    body('avatar').optional().isURL().withMessage('آدرس آواتار باید یک URL معتبر باشد.'),
  ],

  /**
   * قوانین برای مسیر افزودن عضو به تیم
   * @route POST /api/v1/teams/:id/members
   */
  manageMember: [
    body('userId').isMongoId().withMessage('شناسه کاربر برای دعوت نامعتبر است.'),
  ],

  /**
   * قوانین برای مسیر حذف عضو از تیم
   * @route DELETE /api/v1/teams/:id/members/:userId
   */
  getMemberById: [
      param('userId').isMongoId().withMessage('شناسه کاربر برای حذف نامعتبر است.'),
  ],
};
