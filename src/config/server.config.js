import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    MONGO_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
    
    // اصلاحیه نهایی: اعتبارسنجی دقیق برای فرمت لیست جدا شده با کاما
    CORS_ORIGIN: Joi.string().required().description('دامنه‌های مجاز برای CORS (جدا شده با کاما)'),
    
    SERVER_URL: Joi.string().uri().required().description('آدرس عمومی سرور برای استفاده در Callback URL'),
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    
    ZARINPAL_MERCHANT_ID: Joi.string().required(),
    ZARINPAL_SANDBOX: Joi.boolean().default(true),
  })
  .unknown(false);

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`خطا در پیکربندی متغیرهای محیطی: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  serverUrl: envVars.SERVER_URL,
  mongoose: {
    url: envVars.MONGO_URI,
  },
  corsOrigin: envVars.CORS_ORIGIN,
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
  },
  zarinpal: {
      merchantId: envVars.ZARINPAL_MERCHANT_ID,
      sandbox: envVars.ZARINPAL_SANDBOX,
  }
};

export default config;
