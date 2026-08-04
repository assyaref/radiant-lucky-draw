/**
 * Swagger Configuration
 *
 * OpenAPI 3.0 specification for the Lucky Draw API.
 * Serves Swagger UI at /api/docs.
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Radiant Lucky Draw API',
      version: '1.0.0',
      description: 'Enterprise backend API for the Radiant Lucky Draw system',
      contact: {
        name: 'Radiant Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'Auth endpoints' },
      { name: 'Participants', description: 'Participant management' },
      { name: 'Prizes', description: 'Prize management' },
      { name: 'Draws', description: 'Draw management' },
      { name: 'Queue', description: 'Queue management' },
      { name: 'Settings', description: 'Application settings' },
      { name: 'Analytics', description: 'Analytics and statistics' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
