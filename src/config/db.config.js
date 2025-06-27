import mongoose from 'mongoose';
import config from './server.config.js'; // وارد کردن فایل پیکربندی اصلی
import logger from '../utils/logger.js';   // وارد کردن ابزار لاگ‌گیری

/**
 * @description به پایگاه داده MongoDB متصل می‌شود و شنونده‌های رویداد (event listeners)
 * چرخه حیات اتصال را برای اطمینان از آگاهی برنامه از وضعیت اتصال، تنظیم می‌کند.
 */
const connectDB = () => {
  // تلاش برای اتصال به پایگاه داده با استفاده از آدرس (URI) موجود در فایل پیکربندی
  mongoose.connect(config.mongoose.url)
    .catch(() => {
      // خطای اولیه اتصال توسط شنونده رویداد 'error' که در پایین تعریف شده، مدیریت می‌شود.
      // این بلوک catch خالی، از نمایش یک هشدار unhandled promise rejection جلوگیری می‌کند.
    });

  const dbConnection = mongoose.connection;

  // --- شنونده‌های رویدادهای چرخه حیات اتصال ---

  // زمانی اجرا می‌شود که اتصال با موفقیت برقرار شود.
  dbConnection.on('connected', () => {
    logger.info('اتصال به MongoDB با موفقیت برقرار شد.');
  });

  // زمانی اجرا می‌شود که خطایی در اتصال رخ دهد. این بخش برای مدیریت خطاهای زمان راه‌اندازی حیاتی است.
  dbConnection.on('error', (err) => {
    logger.error('خطا در اتصال به پایگاه داده:', err);
    // اگر در زمان راه‌اندازی خطای اتصال رخ دهد، برنامه نمی‌تواند به درستی کار کند.
    // این یک خطای حیاتی است، بنابراین فرآیند (process) را خاتمه می‌دهیم.
    process.exit(1);
  });

  // زمانی اجرا می‌شود که اتصال پس از برقراری موفقیت‌آمیز اولیه، قطع شود.
  dbConnection.on('disconnected', () => {
    logger.warn('اتصال MongoDB قطع شد. درایور برای اتصال مجدد تلاش خواهد کرد.');
  });

  // زمانی اجرا می‌شود که درایور با موفقیت دوباره متصل شود.
  dbConnection.on('reconnected', () => {
      logger.info('اتصال MongoDB دوباره برقرار شد.');
  });

  // زمانی اجرا می‌شود که فرآیند Node.js در حال خاتمه یافتن باشد (مثلاً با Ctrl+C).
  process.on('SIGINT', async () => {
    await dbConnection.close();
    logger.info('اتصال به پایگاه داده قبل از خروج از برنامه بسته شد.');
    process.exit(0);``
  });
};

export default connectDB;
