import logger from '#utils/logger.js'; // Adjust path if necessary based on your project structure

/**
 * Sets up graceful shutdown for the HTTP server and Mongoose connection.
 * @param {import('http').Server} server The HTTP server instance.
 * @param {import('mongoose').Mongoose} mongoose The Mongoose instance.
 */
export const setupGracefulShutdown = (server, mongoose) => {
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

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};