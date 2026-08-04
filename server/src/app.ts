/**
 * Express Application Setup
 *
 * Configures middleware, routes, and error handling.
 * DI-ready: all dependencies are injected from the entry point.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { env } from './config';
import { swaggerSpec } from './config/swagger';
import { requestIdMiddleware } from './utils';
import { errorHandler } from './middlewares';
import {
  createAuthRoutes,
  createParticipantRoutes,
  createPrizeRoutes,
  createDrawRoutes,
  createQueueRoutes,
  createSettingsRoutes,
  createAnalyticsRoutes,
  createHealthRoutes,
} from './routes';
import {
  AuthController,
  ParticipantController,
  PrizeController,
  DrawController,
  QueueController,
  SettingsController,
  AnalyticsController,
  HealthController,
} from './controllers';
import {
  AuthService,
  TokenService,
  SessionService,
  AuditService,
  ParticipantService,
  PrizeService,
  DrawService,
  QueueService,
  SettingsService,
  AnalyticsService,
} from './services';
import {
  UserRepository,
  SessionRepository,
  AuditLogRepository,
  ParticipantRepository,
  PrizeRepository,
  DrawRepository,
  QueueRepository,
  SettingsRepository,
} from './repositories';
import { RealtimeService } from './realtime';



export interface AppInstance {
  app: express.Express;
  realtimeService: RealtimeService;
}

export function createApp(): AppInstance {
  const app = express();


  // =========================================================
  // Repositories (DI)
  // =========================================================
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();
  const auditLogRepository = new AuditLogRepository();
  const participantRepository = new ParticipantRepository();
  const prizeRepository = new PrizeRepository();
  const drawRepository = new DrawRepository();
  const queueRepository = new QueueRepository();
  const settingsRepository = new SettingsRepository();

  // =========================================================
  // Services (DI)
  // =========================================================
  const tokenService = new TokenService();
  const sessionService = new SessionService(sessionRepository, tokenService);
  const auditService = new AuditService(auditLogRepository);
  const authService = new AuthService(
    userRepository,
    tokenService,
    sessionService,
    auditService,
  );
  const participantService = new ParticipantService(
    participantRepository,
    settingsRepository,
    queueRepository,
  );


  const prizeService = new PrizeService(prizeRepository);
  const realtimeService = new RealtimeService();
  const drawService = new DrawService(
    drawRepository,
    prizeRepository,
    participantRepository,
    realtimeService,
  );
  const queueService = new QueueService(queueRepository, participantRepository, realtimeService);


  const settingsService = new SettingsService(settingsRepository);
  const analyticsService = new AnalyticsService(drawRepository, participantRepository, prizeRepository);

  // =========================================================
  // Controllers (DI)
  // =========================================================
  const authController = new AuthController(authService);
  const participantController = new ParticipantController(participantService);
  const prizeController = new PrizeController(prizeService);
  const drawController = new DrawController(drawService);
  const queueController = new QueueController(queueService);
  const settingsController = new SettingsController(settingsService);
  const analyticsController = new AnalyticsController(analyticsService);
  const healthController = new HealthController();

  // =========================================================
  // Global Middleware
  // =========================================================
  app.use(helmet({ contentSecurityPolicy: env.isProduction ? undefined : false }));
  app.use(compression());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.LOG_LEVEL));
  app.use(requestIdMiddleware);


  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
  });
  app.use('/api/', limiter);

  // ─── Registration rate limit (GO LIVE HOTFIX) ─────────────────────────
  // A single event venue shares one network (one public IP) for up to 300
  // participants. The general `/api/` limiter (default 100/15min) would
  // block legitimate registrations once the venue's shared IP exceeds it.
  // This dedicated limiter for the registration endpoint allows the full
  // 300-participant burst (plus headroom) from a single IP.
  const registrationLimiter = rateLimit({
    windowMs: env.REGISTRATION_RATE_LIMIT_WINDOW_MS,
    max: env.REGISTRATION_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT', message: 'Too many registration attempts' },
    },
  });
  app.use('/api/participants/register', registrationLimiter);
  app.use('/api/participants', registrationLimiter);

  // =========================================================
  // Swagger Docs
  // =========================================================
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Radiant Lucky Draw API Docs',
  }));

  // =========================================================
  // API Routes
  // =========================================================
  app.use('/api/health', createHealthRoutes(healthController));
  app.use('/api/auth', createAuthRoutes(authController, tokenService));

  app.use('/api/participants', createParticipantRoutes(participantController, tokenService));
  app.use('/api/prizes', createPrizeRoutes(prizeController, tokenService));
  app.use('/api/draws', createDrawRoutes(drawController, tokenService));
  app.use('/api/queue', createQueueRoutes(queueController, tokenService));
  app.use('/api/settings', createSettingsRoutes(settingsController, tokenService));
  app.use('/api/analytics', createAnalyticsRoutes(analyticsController, tokenService));


  // =========================================================
  // Static Files (Production)
  // =========================================================
  if (env.isProduction) {
    const publicPath = path.resolve(__dirname, '../public');
    app.use(express.static(publicPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  // =========================================================
  // Error Handler (must be last)
  // =========================================================
  app.use(errorHandler);

  return { app, realtimeService };
}


