import mongoose from 'mongoose';

/**
 * @description این مدل ساختار کلی یک براکت (جدول مسابقات) را در یک تورنمنت تعریف می‌کند.
 */
const bracketSchema = new mongoose.Schema(
  {
    // تورنمنتی که این براکت به آن تعلق دارد
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    // نام یا نوع براکت
    name: {
      type: String,
      required: true,
      // مثال: "Winners Bracket", "Losers Bracket", "Group A"
    },
    // آیا این براکت تکمیل شده است؟
    isCompleted: {
      type: Boolean,
      default: false,
    },
    // توجه: فیلد `structure` به صورت عمدی حذف شده است.
    // منبع حقیقت (Source of Truth) برای ساختار تورنمنت، مدل والد یعنی `Tournament` است
    // و برای دسترسی به آن باید از طریق `populate('tournament')` اقدام کرد.
    // این کار از افزونگی داده و ریسک عدم یکپارچگی جلوگیری می‌کند.
  },
  {
    timestamps: true,
  }
);

const Bracket = mongoose.model('Bracket', bracketSchema);

export default Bracket;
