// src/utils/jobRunner.js

import logger from '#utils/logger.js'; // Adjust path if necessary based on your project structure
import { acquireLock, releaseLock } from './lockManager.js'; // Import the new lockManager utility

// Default lock timeout for jobs (e.g., 5 minutes)
const DEFAULT_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * @desc    A generic job execution wrapper with distributed locking and robust error handling.
 *          Ensures that a specific job doesn't run concurrently across multiple instances.
 * @param {string} jobName - The unique name of the job for logging and locking purposes.
 * @param {Function} jobFunction - The asynchronous function to execute, containing the core job logic.
 * @param {number} [lockTimeoutInMs=DEFAULT_LOCK_TIMEOUT_MS] - The time in milliseconds after which the lock automatically expires.
 * @returns {Promise<void>}
 */
async function executeJob(jobName, jobFunction, lockTimeoutInMs = DEFAULT_LOCK_TIMEOUT_MS) {
    const lockAcquired = await acquireLock(jobName, lockTimeoutInMs);

    if (!lockAcquired) {
        logger.warn(`Scheduler: Skipping ${jobName} because another instance holds the lock.`);
        return;
    }

    logger.debug(`Scheduler: Starting ${jobName}...`);

    try {
        await jobFunction();
    } catch (error) {
        logger.error(`Scheduler: Error during ${jobName}.`, { error: error.message, stack: error.stack });
    } finally {
        // Crucially, ensure the lock is always released.
        await releaseLock(jobName);
        logger.debug(`Scheduler: Finished ${jobName}.`);
    }
}

export { executeJob };
