import http from 'http';
import mongoose from 'mongoose';
import app from './app.js'; // The main Express app
import logger from './src/utils/logger.js';
import { setupGracefulShutdown } from './src/utils/shutdownHandler.js'; // Import the new utility

// Create the HTTP server
const server = http.createServer(app);

// Get port from environment and store in Express.
const PORT = process.env.PORT || 5000;
app.set('port', PORT);

// Listen on provided port, on all network interfaces.
server.listen(PORT);

// Event listener for HTTP server "listening" event.
server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    logger.info(`Server is listening on ${bind}`);
});

// Event listener for HTTP server "error" event.
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Setup graceful shutdown
setupGracefulShutdown(server, mongoose);