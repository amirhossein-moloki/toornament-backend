// src/jobs/tournament.scheduler.js

import cron from 'node-cron';
import Tournament from '#models/tournament/Tournament.model.js';
import logger from '#utils/logger.js';
import { executeJob } from '#utils/jobRunner.js'; // Import the new jobRunner utility

// Define a reasonable lock timeout for this job (e.g., 5 minutes)
const TOURNAMENT_STATUS_JOB_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * @desc    Finds tournaments whose registration period should start and updates their status efficiently.
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
 * @desc    Finds tournaments whose registration period has ended and updates their status efficiently.
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
 * @desc    Initializes and starts all the cron jobs for the tournament lifecycle.
 */
const initializeTournamentScheduler = () => {
    logger.info('Tournament scheduler initialized. Will run every minute.');

    // Schedule a single master task to run every minute using the generic executeJob wrapper.
    cron.schedule('* * * * *', () => {
        executeJob('tournamentStatusUpdateCycle', async () => {
            await handleOpenRegistrations();
            await handleCloseRegistrations();
        }, TOURNAMENT_STATUS_JOB_LOCK_TIMEOUT_MS);
    });
};

export default initializeTournamentScheduler;
