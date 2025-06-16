import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  participantModel: {
    type: String,
    required: true,
    enum: ['User', 'Team'],
  },
  ready: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
  },
});

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    bracket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bracket',
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'ready',
        'active',
        'completed',
        'disputed',
        'forfeited',
      ],
      default: 'pending',
    },
    participants: {
      type: [participantSchema],
      // اعتبارسنجی برای اطمینان از اینکه هر مسابقه دقیقا دو شرکت‌کننده دارد
      validate: [
          (val) => val.length <= 2, 
          'یک مسابقه نمی‌تواند بیش از دو شرکت‌کننده داشته باشد.'
      ]
    },
    winner: {
      participantId: mongoose.Schema.Types.ObjectId,
      participantModel: String,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    scheduledTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @description Middleware برای اعمال قوانین یکپارچگی داده قبل از ذخیره‌سازی.
 * این تابع تضمین می‌کند که یک مسابقه نمی‌تواند بدون برنده، 'completed' شود.
 */
matchSchema.pre('save', function(next) {
  // اگر وضعیت به 'completed' تغییر کرده یا در حال ساخته شدن با این وضعیت است
  if (this.isModified('status') && this.status === 'completed') {
    // چک کن که آیا فیلد winner به درستی مقداردهی شده است یا خیر
    if (!this.winner || !this.winner.participantId) {
      // اگر برنده‌ای وجود نداشت، یک خطا ایجاد کن تا از ذخیره شدن داده متناقض جلوگیری شود.
      const err = new Error('یک مسابقه نمی‌تواند بدون تعیین برنده، تکمیل (completed) شود.');
      return next(err);
    }
  }
  next(); // اگر مشکلی نبود، ادامه بده.
});


const Match = mongoose.model('Match', matchSchema);

export default Match;
