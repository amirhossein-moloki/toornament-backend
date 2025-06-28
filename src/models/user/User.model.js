// src/models/user/User.model.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator'; // Import the validator library

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
      validate: {
        validator: function(v) {
          return /^\+98\d{10}$/.test(v);
        },
        message: props => `${props.value} یک فرمت شماره تلفن معتبر برای ایران نیست!`
      }
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to be unique
      trim: true,
      lowercase: true,
      maxlength: [100, 'ایمیل نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.'],
    },
    password: {
      type: String,
      required: [true, 'رمز عبور الزامی است.'],
      select: false, // Ensures password is not returned by default queries
      validate: {
        validator: function(v) {
          // Using validator.isStrongPassword with default options that match requirements:
          // minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
          return validator.isStrongPassword(v, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        message: 'رمز عبور باید حداقل ۸ کاراکتر شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر ویژه (!@#$%^&*) باشد.',
      },
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

    // ================================================
    // ۵. فیلدهای مدیریت احراز هویت
    // ================================================
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ================================================
// متدهای Middleware و Instance
// ================================================

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

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ================================================
// متدهای استاتیک (برای استفاده در سرویس‌ها)
// ================================================

/**
 * @param {string} email - The email to check.
 * @param {ObjectId} [excludeUserId] - An optional user id to exclude from the search.
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const query = { email };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

/**
 * @param {string} username - The username to check.
 * @param {ObjectId} [excludeUserId] - An optional user id to exclude from the search.
 * @returns {Promise<boolean>}
 */
userSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const query = { username };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

const User = mongoose.model('User', userSchema);

export default User;
