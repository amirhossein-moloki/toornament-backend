import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import winston from 'winston';
import { ApiError } from './src/utils/ApiError.js'; // فرض بر وجود یک کلاس خطای سفارشی

// --- راه‌اندازی لاگر (Logger) ---
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// در محیط تولید، لاگ‌ها در فایل نیز ذخیره می‌شوند
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

// بارگذاری متغیرهای محیطی از فایل .env
dotenv.config();

const app = express();

// --- اتصال به پایگاه داده ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Successfully connected to MongoDB.'))
  .catch(err => {
    logger.error('Initial database connection error:', { error: err.message });
    process.exit(1);
  });

// --- میان‌افزارهای اصلی ---

// پیکربندی CORS از متغیرهای محیطی
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// --- وارد کردن و استفاده از مسیرها ---
import authRoutes from './src/api/v1/routes/auth.routes.js';
app.use('/api/v1/auth', authRoutes);

// --- میان‌افزار مدیریت خطای عمومی ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // در محیط تولید، پیام‌های خطای غیرعملیاتی را پنهان می‌کنیم
    const isOperational = err instanceof ApiError;
    const message = (process.env.NODE_ENV === 'production' && !isOperational)
        ? 'خطایی در سرور رخ داده است.'
        : err.message;

    // لاگ کردن خطای کامل در سرور
    logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(statusCode).json({ message });
});

// --- راه‌اندازی سرور ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// --- مدیریت خاموشی ایمن (Graceful Shutdown) ---
const gracefulShutdown = (signal) => {
  logger.warn(`${signal} received. Closing http server.`);
  server.close(() => {
    logger.info('Http server closed.');
    mongoose.connection.close(false, () => {
      logger.info('MongoDb connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
