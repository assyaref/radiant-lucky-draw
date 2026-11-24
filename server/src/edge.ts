/**
 * Supabase Edge Function entry point
 *
 * Runs the same Express application as the Node server inside the Supabase
 * Edge Runtime (Deno). Bundled by scripts/build-edge.ts into
 * supabase/functions/api/app.bundle.js and deployed as the `api` function.
 *
 * Requests reach the function as  /api/<path>  (the function name is the
 * first path segment), which matches the app's existing `/api/...` routes.
 * Supabase injects SUPABASE_URL, SUPABASE_DB_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import express from 'express';
import { createApp } from './app';
import { logger } from './utils';
import { flushPendingBroadcasts } from './realtime';
import { ensureAdminUser, ensureDefaultSettings } from './bootstrap';

const { app } = createApp();

// Idempotent seed (admin user, default settings, default prizes) once per isolate.
let bootstrap: Promise<void> | null = null;
function ensureBootstrapped(): Promise<void> {
  if (!bootstrap) {
    bootstrap = (async () => {
      await ensureAdminUser();
      await ensureDefaultSettings();
    })().catch((error) => {
      logger.error('[Edge] Bootstrap failed', { error: String(error) });
      bootstrap = null; // retry on next request
    });
  }
  return bootstrap ?? Promise.resolve();
}

const server = express();
server.disable('x-powered-by');
server.use(async (_req, res, next) => {
  await ensureBootstrapped();
  // Deliver realtime broadcasts triggered by this request before responding:
  // the edge isolate may be suspended as soon as the response is sent.
  const send = res.send.bind(res);
  res.send = ((body?: unknown) => {
    flushPendingBroadcasts().finally(() => send(body as any));
    return res;
  }) as typeof res.send;
  next();
});
server.use(app);

server.listen(8000, () => logger.info('[Edge] Radiant Lucky Draw API ready'));
