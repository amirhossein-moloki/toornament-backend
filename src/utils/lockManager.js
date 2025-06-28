// src/utils/lockManager.js

import redisClient from '#config/redisClient.js'; // Import the Redis client
import logger from '#utils/logger'; // Assuming you have a logger utility

const LOCK_PREFIX = 'job_lock:'; // Prefix for Redis lock keys

/**
 * @desc    Attempts to acquire a distributed lock using Redis.
 * @param {string} lockKey - The unique key for the lock (e.g., job name).
 * @param {number} timeoutInMs - The lock expiry time in milliseconds.
 * @returns {Promise<boolean>} - True if the lock was acquired, false otherwise.
 */
async function acquireLock(lockKey, timeoutInMs) {
    const fullLockKey = `${LOCK_PREFIX}${lockKey}`;
    try {
        // SET key value NX PX milliseconds
        // NX: Only set the key if it does not already exist.
        // PX: Set the specified expire time, in milliseconds.
        const result = await redisClient.set(fullLockKey, 'locked', 'PX', timeoutInMs, 'NX');
        if (result === 'OK') {
            logger.debug(`Lock acquired for: ${lockKey}`);
            return true;
        }
        logger.warn(`Failed to acquire lock for: ${lockKey} (already held or connection issue)`);
        return false;
    } catch (error) {
        logger.error(`Error acquiring lock for ${lockKey}:`, { error: error.message, stack: error.stack });
        return false;
    }
}

/**
 * @desc    Releases a distributed lock from Redis.
 * @param {string} lockKey - The unique key for the lock.
 * @returns {Promise<void>}
 */
async function releaseLock(lockKey) {
    const fullLockKey = `${LOCK_PREFIX}${lockKey}`;
    try {
        await redisClient.del(fullLockKey);
        logger.debug(`Lock released for: ${lockKey}`);
    } catch (error) {
        logger.error(`Error releasing lock for ${lockKey}:`, { error: error.message, stack: error.stack });
    }
}

export { acquireLock, releaseLock };
