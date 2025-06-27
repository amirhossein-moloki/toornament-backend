import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi'; // پکیج برای اعتبارسنجی متغیرهای محیطی

// این دستور، فایل .env را از ریشه پروژه می‌خواند
dotenv.config({ path: path.join(process.cwd(), '.env') });

// تعریف یک الگو (schema) برای اعتبارسنجی متغیرهای محیطی
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    MONGO_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required().description('آدرس اتصال به پایگاه داده MongoDB'),
    CORS_ORIGIN: Joi.string().required().description('دامنه‌های مجاز برای CORS'),
    
    JWT_ACCESS_SECRET: Joi.string().required().description('کلید مخفی برای Access Token'),
    JWT_REFRESH_SECRET: Joi.string().required().description('کلید مخفی برای Refresh Token'),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m').description('زمان انقضای Access Token'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d').description('زمان انقضای Refresh Token'),
  });
  // .unknown() حذف شد تا از ورود متغیرهای ناشناس جلوگیری شود

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  // اگر یکی از متغیرهای ضروری وجود نداشته باشد یا متغیر ناشناسی وجود داشته باشد، برنامه با خطا متوقف می‌شود
  throw new Error(`خطا در پیکربندی متغیرهای محیطی: ${error.message}`);
}

// ایجاد و صادر کردن یک شیء پیکربندی تمیز و ساختاریافته
const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_URI,
    options: {
      // در نسخه‌های جدید Mongoose نیازی به این گزینه‌ها نیست
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    },
  },
  corsOrigin: envVars.CORS_ORIGIN,
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiration: envVars.JWT_ACCESS_EXPIRATION,
    refreshExpiration: envVars.JWT_REFRESH_EXPIRATION,
  },
};

export default config;
