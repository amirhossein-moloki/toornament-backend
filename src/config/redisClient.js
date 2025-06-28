// src/config/redisClient.js
import Redis from 'ioredis';
import logger from '@/utils/logger.js'; // Assuming you have a logger utility

// Configure your Redis connection here.
// In a real application, these details would come from environment variables.
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined, // If your Redis requires authentication
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0, // Redis database number
    // Other options like `tls` for production with Redis Cloud or similar services
    // tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
    logger.info('Redis client connected successfully.');
});

redis.on('error', (err) => {
    logger.error('Redis client connection error:', err);
    // You might want to implement a more robust retry/reconnect strategy here
});

export default redis;
