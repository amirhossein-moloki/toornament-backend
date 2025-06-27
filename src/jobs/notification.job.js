import cron from 'node-cron';
import Match from '../models/tournament/Match.model.js';
import Notification from '../models/shared/Notification.model.js';
import notificationService from '../services/notification.service.js';
import logger from '../utils/logger.js';

// A simple in-memory lock to prevent concurrent job execution.
// NOTE: For a multi-instance production environment, a distributed lock (e.g., using Redis) is required.
let isReminderJobRunning = false;

/**
 * @private
 * @desc    Finds upcoming matches and sends reminder notifications efficiently.
 */
const handleMatchReminders = async () => {
  if (isReminderJobRunning) {
    logger.warn('Scheduler: Skipping match reminder job because it is already running.');
    return;
  }
  isReminderJobRunning = true;
  logger.debug('Scheduler: Starting match reminder job...');

  try {
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 15 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 16 * 60 * 1000);

    // 1. Fetch all upcoming matches in the window efficiently.
    const upcomingMatches = await Match.find({
      status: 'pending',
      scheduledTime: { $gte: reminderWindowStart, $lt: reminderWindowEnd },
    }).select('_id participants tournament').populate('tournament', 'name').lean();

    if (upcomingMatches.length === 0) {
      // Exit early if there's no work to do.
      // The finally block will still run to release the lock.
      return;
    }

    logger.info(`Scheduler: Found ${upcomingMatches.length} upcoming match(es) to check for reminders.`);

    // 2. Collect all potential recipients and match IDs to check for existing reminders.
    const matchIds = upcomingMatches.map(m => m._id);
    const participantIds = upcomingMatches.flatMap(m => m.participants.map(p => p.participantId));
    
    // 3. Perform a single bulk query to find all reminders that have already been sent.
    const existingReminders = await Notification.find({
      recipient: { $in: participantIds },
      entityId: { $in: matchIds },
      templateKey: 'MATCH_REMINDER',
    }).select('recipient entityId').lean();

    // 4. Create a fast lookup Set for efficient checking. This is the core of the optimization.
    const sentRemindersSet = new Set(
      existingReminders.map(r => `${r.recipient.toString()}-${r.entityId.toString()}`)
    );

    // 5. Iterate and send notifications only for those that haven't received one.
    for (const match of upcomingMatches) {
      for (const participant of match.participants) {
        const reminderIdentifier = `${participant.participantId.toString()}-${match._id.toString()}`;
        
        if (!sentRemindersSet.has(reminderIdentifier)) {
          // This notification has not been sent yet.
          await notificationService.send(
            participant.participantId,
            'MATCH_REMINDER', // A new template key for reminders
            { tournamentName: match.tournament.name },
            { entityId: match._id, entityModel: 'Match' }
          );
          logger.info(`  - Sent match reminder for match ${match._id} to participant ${participant.participantId}`);
        }
      }
    }
  } catch (error) {
    logger.error('Scheduler: Error during match reminder job.', { error: error.message, stack: error.stack });
  } finally {
    // Crucially, ensure the lock is always released.
    isReminderJobRunning = false;
    logger.debug('Scheduler: Finished match reminder job.');
  }
};


/**
 * @desc    Initializes and starts all the cron jobs for notifications.
 */
const initializeNotificationScheduler = () => {
  logger.info('Notification scheduler initialized. Will run every minute.');

  // Schedule the match reminder job to run every minute.
  cron.schedule('* * * * *', handleMatchReminders);
};

export default initializeNotificationScheduler;
