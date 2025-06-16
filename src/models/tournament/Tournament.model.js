import mongoose from 'mongoose';

/**
 * @description این مدل، اطلاعات کامل و جامع یک تورنمنت را نگهداری می‌کند.
 */
const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام تورنمنت الزامی است.'],
      trim: true,
      maxlength: 100,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'registration_open',
        'registration_closed',
        'active',
        'completed',
        'canceled',
      ],
      default: 'draft',
    },
    // ... سایر فیلدها
    structure: {
      type: String,
      enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
      required: [true, 'ساختار تورنمنت الزامی است.'],
    },
    teamSize: {
      type: Number,
      required: true,
      min: 1,
    },
    maxParticipants: {
      type: Number,
      required: [true, 'حداکثر ظرفیت شرکت‌کنندگان الزامی است.'],
    },
    rules: {
      type: String, // قوانین به صورت متن Markdown
      required: [true, 'قوانین تورنمنت الزامی است.'],
    },
    // ... زمان‌بندی
    registrationStartDate: { type: Date, required: true },
    registrationEndDate: { type: Date, required: true },
    checkInStartDate: { type: Date, required: true },
    tournamentStartDate: { type: Date, required: true },

    // ================================================
    // اطلاعات مالی و جوایز
    // ================================================
    entryFee: {
      type: Number, // به ریال و به صورت عدد صحیح
      default: 0,
      // توضیح شفاف: این هزینه برای هر واحد ثبت‌نام (یک فرد یا یک تیم) است.
      // اگر مقدار آن 0 باشد، تورنمنت رایگان محسوب می‌شود.
      validate: {
        validator: Number.isInteger,
        message: 'مبلغ ورودی باید یک عدد صحیح باشد.',
      },
    },
    prizeStructure: [
      {
        // توضیح شفاف: تعداد اعضای این آرایه، تعداد رتبه‌هایی که جایزه می‌گیرند را مشخص می‌کند.
        rank: {
          type: Number, // رتبه‌ای که این جایزه به آن تعلق می‌گیرد
          required: true,
        },
        prizes: [{
          type: {
            type: String,
            required: true,
            enum: ['wallet_credit', 'virtual_item', 'physical_item', 'other'],
          },
          amount: { type: Number }, // برای اعتبار کیف پول (عدد صحیح، به ریال)
          itemName: { type: String }, // برای آیتم‌های مجازی یا فیزیکی
          description: { type: String, required: true }, // توضیحات نمایشی
        }]
      }
    ],

    // ... سایر فیلدها
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brackets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bracket',
    }],
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
