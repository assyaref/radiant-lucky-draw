/**
 * Swagger Configuration
 *
 * OpenAPI 3.0 specification for the Lucky Draw API.
 * Serves Swagger UI at /api/docs.
 *
 * IMPORTANT: This module loads dotenv itself BEFORE reading any environment
 * variables. This guarantees APP_URL / NODE_ENV / PORT are populated at
 * module-evaluation time regardless of import order in the rest of the app.
 */

import dotenv from 'dotenv';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

// Load environment variables FIRST so the OpenAPI servers section is built
// from the correct values (APP_URL in production, localhost in development).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const serverUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT || 3001}`;

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
        url: serverUrl,
        description:
          process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
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
      { name: 'Events', description: 'Event management (M4.0)' },
      { name: 'Booths', description: 'Booth management (M4.0)' },
      { name: 'Booth', description: 'Booth participant flow' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
