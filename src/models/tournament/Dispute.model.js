import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// جدید: زیر-اسکیمای ساختاریافته برای مدارک
const evidenceSchema = new mongoose.Schema({
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true }, // URL به فایل آپلود شده (اسکرین‌شات یا ویدیو)
    description: { type: String, maxlength: 200 },
    uploadedAt: { type: Date, default: Date.now }
});

/**
 * @description این مدل فرآیند مدیریت یک اختلاف (Dispute) بین بازیکنان در یک مسابقه را مدیریت می‌کند.
 */
const disputeSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      unique: true, // هر مسابقه فقط می‌تواند یک اختلاف فعال داشته باشد
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'canceled'],
      default: 'open',
    },
    reason: {
      type: String,
      required: [true, 'دلیل اختلاف باید مشخص شود.'],
      maxlength: 500,
    },
    // جدید: سیستم مدیریت مدارک
    evidence: [evidenceSchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    comments: [commentSchema],
    // اصلاحیه: مدل‌سازی ساختاریافته نتیجه نهایی
    resolution: {
      // تصمیم نهایی قابل پردازش توسط ماشین
      decision: {
        type: String,
        enum: [
          'award_win_to_reporter',      // پیروزی برای گزارش‌دهنده
          'award_win_to_opponent',      // پیروزی برای حریف
          'cancel_match',               // لغو مسابقه
          'reset_match',                // برگزاری مجدد مسابقه
          'issue_warning_to_reporter',  // اخطار برای گزارش‌دهنده
          'issue_warning_to_opponent',  // اخطار برای حریف
          'no_action',                  // بدون اقدام
        ],
      },
      // یادداشت نهایی ادمین برای نمایش عمومی
      finalComment: {
        type: String,
        maxlength: 1000,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
