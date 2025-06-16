import mongoose from 'mongoose';

/**
 * @description این مدل اطلاعات مربوط به تیم‌هایی که توسط کاربران ساخته می‌شوند را نگهداری می‌کند.
 */
const teamSchema = new mongoose.Schema(
  {
    // نام کامل تیم
    name: {
      type: String,
      required: [true, 'نام تیم الزامی است.'],
      // اصلاحیه: حذف قید unique اضافی از اینجا، چون ایندکس ترکیبی آن را مدیریت می‌کند.
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    // تگ یا شناسه کوتاه تیم
    tag: {
      type: String,
      required: [true, 'تگ تیم الزامی است.'],
      unique: true, // تگ در کل سیستم باید یکتا باشد.
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 5,
    },
    // بازی که این تیم برای آن تشکیل شده است
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'هر تیم باید برای یک بازی مشخص تشکیل شود.'],
    },
    // کاپیتان یا سازنده تیم
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // لیستی از اعضای تیم
    members: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        // اصلاحیه: اعمال قانون یکپارچگی داده در سطح اسکیما
        validate: [
            function(members) {
                // `this` به سند در حال اعتبارسنجی اشاره دارد.
                // این تابع بررسی می‌کند که آیا شناسه کاپیتان در لیست اعضا وجود دارد یا خیر.
                return members.map(id => id.toString()).includes(this.captain.toString());
            },
            'کاپیتان تیم باید همیشه عضو لیست اعضا باشد.'
        ]
    },
    // آدرس اینترنتی آواتار یا لوگوی تیم
    avatar: {
      type: String,
      default: '/default-team-avatar.png',
    },
    // آمار کلی عملکرد تیم (استفاده از Denormalization)
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      tournamentsPlayed: { type: Number, default: 0 },
      rankPoints: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// ایندکس ترکیبی هوشمندانه برای تضمین یکتایی نام تیم در محدوده هر بازی
teamSchema.index({ name: 1, game: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);

export default Team;
