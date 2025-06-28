import { body, query, param } from 'express-validator';
import User from '#models/User.js';

const USER_ROLES = ['user', 'tournament_manager', 'support', 'admin'];
const USER_STATUSES = ['active', 'banned', 'pending_verification'];

export const userValidators = {
  /**
   * قوانین برای مسیر دریافت لیست کاربران توسط ادمین
   * @route GET /api/v1/users
   */
  getUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('شماره صفحه باید یک عدد مثبت باشد.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('تعداد آیتم‌ها در هر صفحه باید بین ۱ تا ۱۰۰ باشد.'),
  ],

  /**
   * قوانین برای مسیرهایی که شامل پارامتر ID کاربر هستند
   */
  getUserById: [
    param('id').isMongoId().withMessage('شناسه کاربر نامعتبر است.'),
  ],

  /**
   * قوانین برای مسیر به‌روزرسانی پروفایل توسط خود کاربر
   * @route PATCH /api/v1/users/me
   */
  updateMe: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 }).withMessage('نام کاربری باید بین ۳ تا ۲۰ کاراکتر باشد.')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user && user._id.toString() !== req.user.id) {
          throw new Error('این نام کاربری قبلاً استفاده شده است.');
        }
        return true;
      }),
    body('email')
      .optional()
      .isEmail().withMessage('فرمت ایمیل نامعتبر است.')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user && user._id.toString() !== req.user.id) {
            throw new Error('این ایمیل قبلاً استفاده شده است.');
        }
        return true;
      }),
    body('avatar').optional().isURL().withMessage('آدرس آواتار باید یک URL معتبر باشد.'),
  ],

  /**
   * قوانین برای مسیر به‌روزرسانی کاربر توسط ادمین
   * @route PATCH /api/v1/users/:id
   */
  updateUser: [
    // اصلاحیه نهایی: افزودن بررسی یکتایی برای عملیات ادمین
    body('email')
      .optional()
      .isEmail().withMessage('فرمت ایمیل نامعتبر است.')
      .custom(async (value, { req }) => {
        // بررسی می‌کند که آیا ایمیل جدید توسط کاربر دیگری استفاده شده است یا خیر
        const user = await User.findOne({ email: value });
        // اگر کاربری با این ایمیل پیدا شد و شناسه او با شناسه کاربری که در حال ویرایش است متفاوت بود، خطا ایجاد کن
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('این ایمیل قبلاً توسط کاربر دیگری استفاده شده است.');
        }
        return true;
      }),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('این نام کاربری قبلاً توسط کاربر دیگری استفاده شده است.');
        }
        return true;
      }),
    body('role')
      .optional()
      .isIn(USER_ROLES).withMessage('نقش کاربر نامعتبر است.'),
    body('status')
      .optional()
      .isIn(USER_STATUSES).withMessage('وضعیت کاربر نامعتبر است.'),
    body('walletBalance')
      .optional()
      .isInt({ min: 0 }).withMessage('موجودی کیف پول باید یک عدد صحیح و غیرمنفی باشد.'),
  ],
};
