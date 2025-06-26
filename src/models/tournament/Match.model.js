import mongoose from 'mongoose';

// اسکیمای داخلی برای اطلاعات لابی بازی
const lobbySchema = new mongoose.Schema({
    code: { 
        type: String, 
        trim: true 
    },
    password: { 
        type: String, 
        trim: true 
    },
    isPublished: { 
        type: Boolean, 
        default: false 
    },
}, { _id: false });


// اسکیمای شرکت‌کننده با وضعیت‌های دقیق‌تر
const participantSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'participants.participantModel'
  },
  participantModel: {
    type: String,
    required: true,
    enum: ['User', 'Team'],
  },
  status: {
    type: String,
    enum: ['pending', 'ready', 'in_game'],
    default: 'pending'
  }
}, { _id: false });

// جدید: اسکیمای داخلی برای نتایج مسابقات استاندارد (Versus)
const scoreSchema = new mongoose.Schema({
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'scores.participantModel'
    },
    participantModel: {
      type: String,
      required: true,
      enum: ['User', 'Team'],
    },
    score: {
      type: Number,
      required: true,
      min: 0
    }
}, { _id: false });


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
    participants: [participantSchema],
    
    // اصلاحیه نهایی: بازگرداندن ساختار 'scores' برای مسابقات استاندارد
    scores: [scoreSchema],
    
    // ساختار 'results' برای مسابقات بتل رویال حفظ شده است
    results: [{
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
        rank: { type: Number, required: true },
        kills: { type: Number, default: 0 }
    }],
    
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
    lobbyDetails: lobbySchema,
  },
  {
    timestamps: true,
  }
);

// اصلاحیه نهایی: اعتبارسنجی کامل برای تمام انواع نتایج
matchSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    const hasWinner = this.winner && this.winner.participantId;
    const hasScores = this.scores && this.scores.length > 0;
    const hasResults = this.results && this.results.length > 0;

    // یک مسابقه تکمیل‌شده باید یا برنده مشخص، یا نتایج امتیازی، یا نتایج رتبه‌بندی داشته باشد
    if (!hasWinner && !hasScores && !hasResults) {
      const err = new Error('A completed match must have a winner, scores, or results.');
      return next(err);
    }
  }
  next();
});

const Match = mongoose.model('Match', matchSchema);

export default Match;
