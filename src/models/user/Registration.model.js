import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    // ================================================
    // ۱. اتصالات اصلی (Links)
    // ================================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },

    // ================================================
    // ۲. وضعیت و نتایج کاربر در تورنمنت
    // ================================================
    status: {
      type: String,
      enum: [
        'registered',
        'checked_in',
        'playing',
        'eliminated',
        'completed',
        'disqualified',
      ],
      default: 'registered',
    },
    rank: {
      type: Number,
    },
    // اصلاحیه نهایی: مدل‌سازی ساختاریافته جوایز
    prizesWon: [
      {
        // نوع جایزه برای پردازش ماشینی
        type: {
          type: String,
          required: true,
          enum: ['wallet_credit', 'virtual_item', 'physical_item', 'other'],
        },
        // مقدار عددی جایزه (برای اعتبار کیف پول) - به صورت عدد صحیح و به ریال
        amount: {
          type: Number,
        },
        // نام یا شناسه آیتم (برای جوایز مجازی یا فیزیکی)
        itemName: {
          type: String,
        },
        // توضیحات تکمیلی برای نمایش به کاربر
        description: {
            type: String,
            required: true,
        }
      }
    ],
    checkInTime: {
        type: Date,
    }
  },
  {
    timestamps: true, // زمان دقیق ثبت‌نام (`createdAt`) را ذخیره می‌کند
  }
);

// ================================================
// ۳. ایندکس ترکیبی برای جلوگیری از تکرار
// ================================================
// تضمین می‌کند که یک کاربر نتواند بیش از یک بار در یک تورنمنت ثبت‌نام کند.
registrationSchema.index({ user: 1, tournament: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;