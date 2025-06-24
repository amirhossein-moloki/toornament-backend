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

// جدید: اسکیمای نتایج برای بازی‌های بتل رویال
const resultSchema = new mongoose.Schema({
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'results.participantModel'
    },
    participantModel: {
        type: String,
        required: true,
        enum: ['User', 'Team']
    },
    rank: {
        type: Number,
        required: true
    },
    kills: {
        type: Number,
        default: 0
    }
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
      // اعتبار سنجی تعداد شرکت کنندگان حذف شد تا برای بتل رویال نیز قابل استفاده باشد
    },
    // این فیلد برای بازی‌های رودررو (1v1, 5v5) استفاده می‌شود
    winner: {
      participantId: mongoose.Schema.Types.ObjectId,
      participantModel: String,
    },
    // جدید: این فیلد برای ثبت نتایج کامل بازی‌های بتل رویال استفاده می‌شود
    results: [resultSchema],
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
 * این تابع تضمین می‌کند که یک مسابقه تکمیل شده، یا برنده (برای بازی‌های رودررو)
 * یا لیست نتایج (برای بتل رویال) را داشته باشد.
 */
matchSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    const hasWinner = this.winner && this.winner.participantId;
    const hasResults = this.results && this.results.length > 0;

    // اگر مسابقه تکمیل شده ولی نه برنده‌ای دارد و نه لیستی از نتایج، خطا ایجاد کن
    if (!hasWinner && !hasResults) {
      const err = new Error('یک مسابقه تکمیل شده باید یا یک برنده مشخص یا لیستی از نتایج داشته باشد.');
      return next(err);
    }
  }
  next();
});


const Match = mongoose.model('Match', matchSchema);

export default Match;