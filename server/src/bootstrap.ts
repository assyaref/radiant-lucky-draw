/**
 * Bootstrap / Auto-Seed
 *
 * Idempotent startup helpers that ensure minimum required data exists
 * for the application to be fully operational.  Each function only
 * creates records when the corresponding table is empty, so repeated
 * calls on every container restart are safe.
 *
 * Required admin (per RC4.18):
 *   Email:    admin@radiantgroup.com
 *   Password: Admin123!
 *   Role:     super_admin
 */

import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { UserRepository } from './repositories';
import { ROLES } from './auth';
import { logger } from './utils';

const ADMIN_EMAIL = 'admin@radiantgroup.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_ROLE = ROLES.SUPER_ADMIN;

export async function ensureAdminUser(): Promise<void> {
  const userRepository = new UserRepository();
  try {
    const existing = await userRepository.findByEmail(ADMIN_EMAIL);
    if (existing) {
      logger.info('[Bootstrap] Admin user already exists');
      return;
    }
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await userRepository.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: ADMIN_ROLE,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info('[Bootstrap] Admin user created');
  } catch (e) {
    logger.error('[Bootstrap] Admin user FAILED', { error: String(e) });
  }
}

export async function ensureDefaultSettings(): Promise<void> {
  try {
    const c = await prisma.settings.count({ where: { deletedAt: null } });
    if (c > 0) {
      logger.info('[Bootstrap] Settings exist', { count: c });
      return;
    }
    await prisma.settings.create({
      data: {
        eventName: 'Radiant Lucky Draw',
        eventDate: null,
        eventLocation: '',
        eventStatus: 'upcoming',
        eventDescription: '',
        maxParticipants: 1000,
        drawInterval: 30,
        celebrationLevel: 'high',
        theme: 'luxury',
        soundEnabled: true,
        autoAdvance: false,
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
      },
    });
    logger.info('[Bootstrap] Default Settings created');
  } catch (e) {
    logger.error('[Bootstrap] Settings FAILED', { error: String(e) });
  }
}
