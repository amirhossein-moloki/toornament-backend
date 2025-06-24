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
    // جدید: فیلد برای پیگیری وضعیت پرداخت ورودی
    paymentStatus: {
      type: String,
      enum: ['paid', 'refunded', 'not_applicable'], // not_applicable برای تورنمنت‌های رایگان
      default: 'not_applicable',
    },
    rank: {
      type: Number,
    },
    prizesWon: [
      {
        type: {
          type: String,
          required: true,
          enum: ['wallet_credit', 'virtual_item', 'physical_item', 'other'],
        },
        amount: {
          type: Number,
        },
        itemName: {
          type: String,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    checkInTime: {
      type: Date,
    },
    // جدید: فیلد برای ذخیره لینک ویدیوی آپلود شده توسط کاربر
    postTournamentVideoUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // زمان دقیق ثبت‌نام (`createdAt`) را ذخیره می‌کند
  }
);

// ================================================
// ۳. ایندکس ترکیبی برای جلوگیری از تکرار
// ================================================
// تضمین می‌کند که یک کاربر نتواند بیش از یک بار در یک تورنومنت ثبت‌نام کند.
registrationSchema.index({ user: 1, tournament: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;