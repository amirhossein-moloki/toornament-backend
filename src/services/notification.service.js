import User from '../models/user/User.model.js';
import Notification from '../models/shared/Notification.model.js';
import logger from '../utils/logger.js';
// import { queueNotificationForDispatch } from '../jobs/notification.queue.js'; // Ideal implementation

/**
 * @private
 * @desc Creates a notification record in the database. This is the source of truth.
 * @param {object} notificationData - Data for the notification document.
 * @param {object} session - Mongoose session for transactions.
 * @returns {Promise<Document>}
 */
async function _createNotification(notificationData, session) {
    // The model expects templateKey and params, not a rendered message.
    const notification = new Notification({
        recipient: notificationData.recipient,
        templateKey: notificationData.templateKey,
        params: notificationData.params,
        entityId: notificationData.entityId,
        entityModel: notificationData.entityModel,
    });
    await notification.save({ session });
    return notification;
}

/**
 * @private
 * @desc Attempts to dispatch a persisted notification to all its channels.
 * In a real production system, this would be handled by a durable job queue processor.
 * @param {string} notificationId - The ID of the notification document to send.
 */
async function _dispatch(notificationId) {
    const notification = await Notification.findById(notificationId).lean();
    const user = await User.findById(notification.recipient).select('phoneNumber email').lean();

    if (!user) {
        logger.error(`User not found for notification dispatch`, { notificationId });
        return;
    }

    // This is where you would render the template on the server ONLY for non-app channels like email/SMS
    // For now, we simulate sending the params directly.
    const payload = { templateKey: notification.templateKey, params: notification.params };

    // --- Channel 1: SMS ---
    if (user.phoneNumber) {
        try {
            // await smsService.send(user.phoneNumber, payload);
            logger.info(`SMS for notification ${notificationId} queued for dispatch to ${user.phoneNumber}`);
        } catch (error) {
            logger.error(`Failed to queue SMS for notification ${notificationId}`, { error });
        }
    }
    
    // --- Channel 2: Email ---
    if (user.email) {
        try {
            // await emailService.send(user.email, payload);
            logger.info(`Email for notification ${notificationId} queued for dispatch to ${user.email}`);
        } catch (error) {
            logger.error(`Failed to queue email for notification ${notificationId}`, { error });
        }
    }
    
    // --- Channel 3: In-App/Push Notification (handled by client fetching notifications) ---
}


/**
 * @desc The main entry point for creating and triggering a notification.
 * It first persists the notification to the database to guarantee it's not lost,
 * then triggers a background dispatch process.
 * @param {string} recipientId - The ID of the user receiving the notification.
 * @param {string} templateKey - The key identifying the notification template.
 * @param {object} params - Data to be stored and used for rendering on the client.
 * @param {object} [options={}] - Options, including entity info and session.
 */
async function send(recipientId, templateKey, params, options = {}) {
    const notificationData = {
        recipient: recipientId,
        templateKey,
        params,
        entityId: options.entityId,
        entityModel: options.entityModel,
    };

    // 1. Persist the notification to the database. This is a critical, synchronous step.
    const notification = await _createNotification(notificationData, options.session);
    
    // 2. Trigger the dispatch process asynchronously.
    // In a real system, this would add a job to a persistent queue (e.g., RabbitMQ, Redis).
    // The `_dispatch` function would be a "worker" processing that queue.
    // We simulate this by calling it without await.
    _dispatch(notification._id).catch(err => {
        logger.error('Error during the dispatch process trigger', { error: err });
    });

    return notification;
}

export default {
    send
};
