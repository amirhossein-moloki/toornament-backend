import mongoose from 'mongoose';

/**
 * @description این مدل اطلاعات مربوط به یک نوتیفیکیشن را نگهداری می‌کند.
 * این طراحی برای مقیاس‌پذیری و بین‌المللی‌سازی (i18n) بهینه شده است.
 */
const notificationSchema = new mongoose.Schema(
  {
    // کاربری که این نوتیفیکیشن را دریافت می‌کند
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // اصلاحیه: جایگزینی متن‌های ثابت با یک کلید قالب
    // کلاینت مسئول ترجمه این کلید به زبان کاربر است.
    // مثال: 'match.ready', 'prize.awarded'
    templateKey: {
        type: String,
        required: true,
    },
    // اصلاحیه: پارامترهای داینامیک برای جایگذاری در قالب
    // مثال: { opponentName: 'PlayerA', amount: 50000 }
    params: {
        type: mongoose.Schema.Types.Mixed, // برای انعطاف‌پذیری در ذخیره پارامترها
        default: {}
    },
    // اصلاحیه: جایگزینی لینک متنی با یک ارجاع ساختاریافته و چندریختی
    entity: {
        // مدلی که نوتیفیکیشن به آن ارجاع می‌دهد (مثلاً 'Match', 'Tournament')
        entityModel: {
            type: String,
            required: true,
            enum: ['Match', 'Tournament', 'Dispute', 'Team', 'User'],
        },
        // شناسه سند مربوطه
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        }
    },
    // آیا کاربر این نوتیفیکیشن را خوانده است؟
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
