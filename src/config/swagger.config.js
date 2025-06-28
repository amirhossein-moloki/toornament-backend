import swaggerConfig from './server.config.js';

/**
 * @description This file defines the configuration for swagger-jsdoc.
 * It sets up the basic OpenAPI specification for the project.
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Toornament Backend API',
      version: '1.0.0',
      description:
        'API documentation for the Toornament backend service, providing endpoints for managing users, teams, tournaments, matches, and payments.',
      contact: {
        name: 'Amir',
        // url: 'https://your-website.com',
        // email: 'info@your-email.com',
      },
    },
    servers: [
      {
        url: swaggerConfig.serverUrl || `http://localhost:${swaggerConfig.port}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer {token}',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs files that contain OpenAPI JSDoc comments.
  apis: ['./src/api/v1/routes/*.js'],
};

export default swaggerOptions;
