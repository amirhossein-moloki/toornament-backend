import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import winston from 'winston';
import { ApiError } from '#utils/ApiError.js';
import mainRouterV1 from '#routes/index.js'; // Using path alias

// =================================================================
// 1. Load Environment Variables FIRST
// =================================================================
dotenv.config();

// =================================================================
// 2. Setup Logger
// =================================================================
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

// =================================================================
// 3. Connect to Database
// =================================================================
// Now, process.env.MONGO_URI is guaranteed to be available here.
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Successfully connected to MongoDB.'))
  .catch(err => {
    logger.error('Initial database connection error:', { error: err.message });
    process.exit(1);
  });

// =================================================================
// 4. Initialize Express App & Middlewares
// =================================================================
const app = express();

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


// =================================================================
// 5. Setup API Routes
// =================================================================
app.use('/api/v1', mainRouterV1);


// =================================================================
// 6. Global Error Handling Middleware
// =================================================================
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    const isOperational = err instanceof ApiError;
    const message = (process.env.NODE_ENV === 'production' && !isOperational)
        ? 'An internal server error occurred.'
        : err.message;

    logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(statusCode).json({ message });
});

export default app;
