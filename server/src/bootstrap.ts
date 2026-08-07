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

/**
 * Ensure a default Settings row exists.
 * The Public Booth config endpoint requires at least one row
 * in the settings table for real data (otherwise fallback defaults are used).
 */
export async function ensureDefaultSettings(): Promise<void> {
  try {
    const existing = await prisma.settings.findFirst({ where: { deletedAt: null } });
    if (existing) {
      logger.info('[Bootstrap] Settings row already exists', { eventName: (existing as any).eventName });
      return;
    }

    await prisma.settings.create({
      data: {
        eventName: 'Radiant Lucky Draw 2026',
        eventDate: new Date('2026-07-30'),
        eventLocation: 'Jakarta Convention Center',
        eventStatus: 'active',
        eventDescription: 'Grand Lucky Draw Event powered by Radiant',
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

    logger.info('[Bootstrap] Default Settings row created');
  } catch (error) {
    logger.error('[Bootstrap] Failed to ensure default settings', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Ensure default Prize rows exist.
 * The weighted lucky draw requires at least one active prize
 * with remaining stock for spins to succeed.
 */
export async function ensureDefaultPrizes(): Promise<void> {
  try {
    const count = await prisma.prize.count({ where: { deletedAt: null } });
    if (count > 0) {
      logger.info('[Bootstrap] Prizes already exist', { count });
      return;
    }

    const defaultPrizes = [
      { name: 'Door Prize', description: 'Hadiah hiburan untuk semua peserta', value: 50000, tier: 'doorprize', probability: 0.60, quantity: 50, remaining: 50 },
      { name: 'Bronze Prize', description: 'Hadiah perunggu - Voucher Belanja Rp 250.000', value: 250000, tier: 'bronze', probability: 0.25, quantity: 20, remaining: 20 },
      { name: 'Silver Prize', description: 'Hadiah perak - Smartwatch Premium', value: 1500000, tier: 'silver', probability: 0.10, quantity: 10, remaining: 10 },
      { name: 'Gold Prize', description: 'Hadiah emas - Smartphone Flagship', value: 8000000, tier: 'gold', probability: 0.04, quantity: 3, remaining: 3 },
      { name: 'Grand Prize', description: 'Grand Prize - Umrah Package', value: 30000000, tier: 'grand', probability: 0.01, quantity: 1, remaining: 1 },
    ];

    for (const p of defaultPrizes) {
      await prisma.prize.create({
        data: {
          name: p.name,
          description: p.description,
          value: p.value,
          currency: 'IDR',
          quantity: p.quantity,
          remaining: p.remaining,
          tier: p.tier,
          probability: p.probability,
          isActive: true,
        },
      });
    }

    logger.info('[Bootstrap] Default Prizes created', { count: defaultPrizes.length });
  } catch (error) {
    logger.error('[Bootstrap] Failed to ensure default prizes', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
