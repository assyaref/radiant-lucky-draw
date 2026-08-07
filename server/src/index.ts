/**
 * Server Entry Point
 *
 * Bootstraps the Express application and starts listening.
 * Includes graceful shutdown and uncaught error handling.
 */

import { createApp } from './app';
import { env } from './config';
import { logger } from './utils';
import { ensureAdminUser, ensureDefaultSettings, ensureDefaultPrizes } from './bootstrap';

// ─── Uncaught Error Handlers ───────────────────────────────

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', {
    error: String(reason),
  });
});

// ─── Server Startup ────────────────────────────────────────

async function main() {
  const { app, realtimeService } = createApp();

  const baseUrl = process.env.APP_URL ?? `http://localhost:${env.PORT}`;

  // Ensure the production admin user exists (idempotent auto-seed).
  await ensureAdminUser();

  // Ensure default settings and prizes exist for Public Booth.
  await ensureDefaultSettings();
  await ensureDefaultPrizes();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server started on port ${env.PORT}`, {
      environment: env.NODE_ENV,
      apiDocs: `${baseUrl}/api/docs`,
      healthCheck: `${baseUrl}/api/health`,
    });
  });

  // Attach Socket.IO realtime layer to the HTTP server
  realtimeService.attach(server);

  // ─── Graceful Shutdown ─────────────────────────────────

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('Failed to start server', { error: String(error) });
  process.exit(1);
});
