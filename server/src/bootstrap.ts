/**
 * Bootstrap / Auto-Seed
 *
 * Idempotent startup helpers that ensure minimum required data exists.
 * Each function only creates records if none are found, so repeated
 * calls on every deploy are safe.
 *
 * Required admin (per RC4.18):
 *   Email:    admin@radiantgroup.com
 *   Password: Admin123!
 *   Role:     super_admin
 *
 * NOTE: Settings, Prizes, Events, and Booths are created by
 * prisma db seed during deployment, NOT on every startup.
 */

import bcrypt from 'bcryptjs';
import { UserRepository } from './repositories';
import { ROLES } from './auth';
import { logger } from './utils';

const ADMIN_EMAIL = 'admin@radiantgroup.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_ROLE = ROLES.SUPER_ADMIN;

/**
 * Ensure the production admin user exists.
 */
export async function ensureAdminUser(): Promise<void> {
  const userRepository = new UserRepository();

  try {
    const existing = await userRepository.findByEmail(ADMIN_EMAIL);
    if (existing) {
      logger.info('[Bootstrap] Admin user already exists', { email: ADMIN_EMAIL });
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

    logger.info('[Bootstrap] Admin user created', { email: ADMIN_EMAIL, role: ADMIN_ROLE });
  } catch (error) {
    logger.error('[Bootstrap] Failed to ensure admin user', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
