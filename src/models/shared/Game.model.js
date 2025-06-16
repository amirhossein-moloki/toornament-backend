import mongoose from 'mongoose';

/**
 * @description این مدل اطلاعات مربوط به هر بازی که پلتفرم پشتیبانی می‌کند را نگهداری می‌کند.
 * داده‌های این مدل توسط ادمین در سیستم تعریف می‌شود.
 */
const gameSchema = new mongoose.Schema(
  {
    // نام کامل و رسمی بازی
    name: {
      type: String,
      required: [true, 'نام بازی الزامی است.'],
      unique: true,
      trim: true,
    },
    // نام کوتاه یا مخفف بازی (برای URLها و مصارف فنی)
    shortName: {
      type: String,
      required: [true, 'نام کوتاه بازی الزامی است.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    // آدرس اینترنتی آیکون یا لوگوی بازی
    iconUrl: {
      type: String,
      required: [true, 'آدرس آیکون بازی الزامی است.'],
    },
    // آدرس اینترنتی بنر یا تصویر پس‌زمینه بازی
    bannerUrl: {
      type: String,
    },
    // اصلاحیه: استفاده از enum برای تضمین یکپارچگی داده‌های پلتفرم
    platforms: {
      type: [String],
      required: true,
      // محدود کردن مقادیر به یک واژگان کنترل‌شده
      enum: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'Mobile (iOS)', 'Mobile (Android)'],
    },
    // اصلاحیه: استفاده از enum برای تضمین یکپارچگی داده‌های حالت‌های بازی
    supportedModes: {
      type: [String],
      required: true,
      enum: ['1v1', '2v2', '3v3', '4v4', '5v5', 'Team Deathmatch', 'Search & Destroy', 'Battle Royale', 'Free for All'],
    },
    // آیا این بازی در پلتفرم فعال است؟
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @description یک Middleware برای تولید خودکار shortName از روی name در صورتی که وارد نشده باشد.
 * این کار یکپارچگی داده را افزایش می‌دهد.
 */
gameSchema.pre('validate', function(next) {
  if (this.name && !this.shortName) {
    this.shortName = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});


const Game = mongoose.model('Game', gameSchema);

export default Game;
