import cron from 'node-cron';
import Tournament from '../models/tournament/Tournament.model.js';
import logger from '../utils/logger.js';

// A simple in-memory lock to prevent concurrent job execution.
let isJobRunning = false;

/**
 * @private
 * @desc    A generic job execution wrapper with locking and error handling.
 * @param {string} jobName - The name of the job for logging.
 * @param {Function} jobFunction - The asynchronous function to execute.
 */
async function executeJob(jobName, jobFunction) {
  if (isJobRunning) {
    logger.warn(`Scheduler: Skipping ${jobName} because a job is already in progress.`);
    return;
  }

  isJobRunning = true;
  logger.debug(`Scheduler: Starting ${jobName}...`);

  try {
    await jobFunction();
  } catch (error) {
    logger.error(`Scheduler: Error during ${jobName}.`, { error: error.message, stack: error.stack });
  } finally {
    logger.debug(`Scheduler: Finished ${jobName}.`);
    isJobRunning = false;
  }
}

/**
 * @desc    Finds tournaments whose registration period should start and updates their status efficiently.
 */
const handleOpenRegistrations = async () => {
  const now = new Date();
  const filter = {
    status: 'draft',
    registrationStartDate: { $lte: now },
  };
  const update = { $set: { status: 'registration_open' } };

  const result = await Tournament.updateMany(filter, update);

  if (result.modifiedCount > 0) {
    logger.info(`Scheduler: Opened registration for ${result.modifiedCount} tournament(s).`);
  }
};

/**
 * @desc    Finds tournaments whose registration period has ended and updates their status efficiently.
 */
const handleCloseRegistrations = async () => {
  const now = new Date();
  const filter = {
    status: 'registration_open',
    registrationEndDate: { $lte: now },
  };
  const update = { $set: { status: 'registration_closed' } };

  const result = await Tournament.updateMany(filter, update);

  if (result.modifiedCount > 0) {
    logger.info(`Scheduler: Closed registration for ${result.modifiedCount} tournament(s).`);
  }
};

/**
 * @desc    Initializes and starts all the cron jobs for the tournament lifecycle.
 */
const initializeTournamentScheduler = () => {
  logger.info('Tournament scheduler initialized. Will run every minute.');

  // Schedule a single master task to run every minute.
  cron.schedule('* * * * *', () => {
    // The executeJob wrapper ensures that the tasks inside don't overlap if they take more than a minute.
    executeJob('tournament status update cycle', async () => {
      await handleOpenRegistrations();
      await handleCloseRegistrations();
    });
  });
};

export default initializeTournamentScheduler;
