import winston from 'winston';
import 'winston-daily-rotate-file'; // Import the daily rotate file transport
import path from 'path';
import fs from 'fs';

// Ensure the logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Define log levels based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Define transports
const transports = [
  // Always log to the console, but with different formats for dev and prod.
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? fileFormat : consoleFormat,
  }),
];

// In production, add file transports with rotation.
if (process.env.NODE_ENV === 'production') {
  const dailyRotateErrorFileTransport = new winston.transports.DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // Compress old log files
    maxSize: '20m',      // Rotate if file size exceeds 20MB
    maxFiles: '14d',     // Keep logs for 14 days
  });

  const dailyRotateCombinedFileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  });
  
  transports.push(dailyRotateErrorFileTransport, dailyRotateCombinedFileTransport);
}


// Create the logger instance
const logger = winston.createLogger({
  level: level,
  format: fileFormat, // Default format for all transports
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger;
