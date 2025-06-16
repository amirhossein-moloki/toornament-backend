import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    // ================================================
    // ۱. اطلاعات اصلی و هویتی
    // ================================================
    username: {
      type: String,
      required: [true, 'نام کاربری الزامی است.'],
      unique: true,
      trim: true,
      index: true,
      minlength: 3,
      maxlength: 20,
    },
    phoneNumber: {
      type: String,
      required: [true, 'شماره تلفن برای احراز هویت الزامی است.'],
      unique: true,
      trim: true,
      // جدید: اعتبارسنجی فرمت شماره تلفن (مثال برای ایران)
      validate: {
        validator: function(v) {
          // این regex شماره‌هایی مثل +989123456789 را تایید می‌کند
          return /^\+98\d{10}$/.test(v);
        },
        message: props => `${props.value} یک فرمت شماره تلفن معتبر برای ایران نیست!`
      }
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      // جدید: محدودیت طول برای ایمیل
      maxlength: [100, 'ایمیل نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.'],
    },
    password: {
      type: String,
      required: [true, 'رمز عبور الزامی است.'],
      select: false,
    },
    avatar: {
      type: String,
      default: '/default-avatar.png',
    },

    // ================================================
    // ۲. مدیریت نقش و وضعیت کاربر
    // ================================================
    role: {
      type: String,
      enum: ['user', 'tournament_manager', 'support', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'banned', 'pending_verification'],
      default: 'pending_verification',
    },

    // ================================================
    // ۳. اطلاعات تخصصی پلتفرم (بازی و مالی)
    // ================================================
    gameProfiles: [
      {
        game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
        gameUsername: { type: String, required: true, trim: true },
      },
    ],
    eloRating: [
      {
        game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
        rating: { type: Number, default: 1000 },
      },
    ],
    walletBalance: {
        type: Number,
        required: true,
        default: 0,
        // نکته بسیار مهم: این مقدار همیشه به عنوان یک عدد صحیح (Integer) و
        // بر حسب کوچکترین واحد پولی (ریال) ذخیره می‌شود.
        // از ذخیره مقادیر اعشاری یا تومان به صورت مستقیم جداً خودداری شود.
        // مثال: 1500 تومان به صورت 15000 ریال ذخیره می‌شود.
        validate: {
          validator: Number.isInteger,
          message: 'موجودی کیف پول باید یک عدد صحیح باشد.'
        }
      },

    // ================================================
    // ۴. اطلاعات اجتماعی (تیم‌ها)
    // ================================================
    teams: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    ],
  },
  {
    timestamps: true,
  }
);

// ================================================
// ۵. Middleware و متدها
// ================================================

// Middleware: هش کردن اتوماتیک پسورد قبل از ذخیره
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method: چک کردن صحت پسورد در زمان لاگین
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;