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
    logger.info('[Bootstrap] Default Settings created');
  } catch (e) {
    logger.error('[Bootstrap] Settings FAILED', { error: String(e) });
  }
}

export async function ensureDefaultPrizes(): Promise<void> {
  try {
    const c = await prisma.prize.count({ where: { deletedAt: null } });
    if (c > 0) {
      logger.info('[Bootstrap] Prizes exist', { count: c });
      return;
    }
    const prizes = [
      {
        name: 'Door Prize',
        description: 'Hadiah hiburan untuk semua peserta',
        value: 50000,
        tier: 'doorprize',
        probability: 0.6,
        quantity: 50,
        remaining: 50,
      },
      {
        name: 'Bronze Prize',
        description: 'Hadiah perunggu - Voucher Belanja Rp 250.000',
        value: 250000,
        tier: 'bronze',
        probability: 0.25,
        quantity: 20,
        remaining: 20,
      },
      {
        name: 'Silver Prize',
        description: 'Hadiah perak - Smartwatch Premium',
        value: 1500000,
        tier: 'silver',
        probability: 0.1,
        quantity: 10,
        remaining: 10,
      },
      {
        name: 'Gold Prize',
        description: 'Hadiah emas - Smartphone Flagship',
        value: 8000000,
        tier: 'gold',
        probability: 0.04,
        quantity: 3,
        remaining: 3,
      },
      {
        name: 'Grand Prize',
        description: 'Grand Prize - Umrah Package',
        value: 30000000,
        tier: 'grand',
        probability: 0.01,
        quantity: 1,
        remaining: 1,
      },
    ];
    for (const p of prizes)
      await prisma.prize.create({ data: { ...p, currency: 'IDR', isActive: true } });
    logger.info('[Bootstrap] Default Prizes created', { count: prizes.length });
  } catch (e) {
    logger.error('[Bootstrap] Prizes FAILED', { error: String(e) });
  }
}
