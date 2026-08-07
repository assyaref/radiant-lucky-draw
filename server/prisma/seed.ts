// ============================================================
// RADIANT LUCKY DRAW — Idempotent Production Seed
// ============================================================
// SAFE for repeated execution on production.
// Only creates default rows when the corresponding table is empty.
// NEVER DELETES existing data.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (idempotent — skip if data exists)...');

  // ==========================================================
  // USERS
  // ==========================================================
  const userCount = await prisma.user.count({ where: { deletedAt: null } });
  if (userCount === 0) {
    const adminPassword = await bcrypt.hash('admin123', 12);
    const operatorPassword = await bcrypt.hash('operator123', 12);
    const productionAdminPassword = await bcrypt.hash('Admin123!', 12);

    await prisma.user.createMany({
      data: [
        {
          username: 'admin',
          email: 'admin@radiantluckydraw.com',
          password: adminPassword,
          role: 'admin',
          isActive: true,
        },
        {
          username: 'superadmin',
          email: 'admin@radiantgroup.com',
          password: productionAdminPassword,
          role: 'super_admin',
          isActive: true,
        },
        {
          username: 'operator1',
          email: 'operator1@radiantluckydraw.com',
          password: operatorPassword,
          role: 'operator',
          isActive: true,
        },
        {
          username: 'operator2',
          email: 'operator2@radiantluckydraw.com',
          password: operatorPassword,
          role: 'operator',
          isActive: true,
        },
      ],
    });
    console.log('  ✅ Users created (4)');
  } else {
    console.log(`  ⏭  Users skipped (${userCount} exist)`);
  }

  // ==========================================================
  // SETTINGS
  // ==========================================================
  const settingsCount = await prisma.settings.count({ where: { deletedAt: null } });
  if (settingsCount === 0) {
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
    console.log('  ✅ Settings created');
  } else {
    console.log('  ⏭  Settings skipped (exists)');
  }

  // ==========================================================
  // PRIZES
  // ==========================================================
  const prizeCount = await prisma.prize.count({ where: { deletedAt: null } });
  if (prizeCount === 0) {
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
    for (const p of prizes) {
      await prisma.prize.create({ data: { ...p, currency: 'IDR', isActive: true } });
    }
    console.log(`  ✅ Prizes created (${prizes.length})`);
  } else {
    console.log(`  ⏭  Prizes skipped (${prizeCount} exist)`);
  }

  // ==========================================================
  // SPONSORS
  // ==========================================================
  const sponsorCount = await prisma.sponsor.count({ where: { deletedAt: null } });
  if (sponsorCount === 0) {
    await prisma.sponsor.createMany({
      data: [
        { name: 'Radiant Group', website: 'https://radiantgroup.com', tier: 'platinum' },
        { name: 'Tech Partner Inc', website: 'https://techpartner.example.com', tier: 'gold' },
        { name: 'Event Organizer Co', website: 'https://eventorg.example.com', tier: 'silver' },
      ],
    });
    console.log('  ✅ Sponsors created (3)');
  } else {
    console.log(`  ⏭  Sponsors skipped (${sponsorCount} exist)`);
  }

  // ==========================================================
  // ANNOUNCEMENTS
  // ==========================================================
  const announcementCount = await prisma.announcement.count({ where: { deletedAt: null } });
  if (announcementCount === 0) {
    const admins = await prisma.user.findFirst({ where: { role: 'super_admin', deletedAt: null } });
    await prisma.announcement.createMany({
      data: [
        {
          title: 'Welcome!',
          message:
            'Welcome to the Radiant Lucky Draw event! We hope you have a fantastic experience.',
          type: 'success',
          priority: 1,
          isActive: true,
          createdBy: admins?.id,
        },
        {
          title: 'Schedule Update',
          message: 'The Grand Prize draw has been moved to 5:00 PM.',
          type: 'info',
          priority: 2,
          isActive: true,
          createdBy: admins?.id,
        },
        {
          title: 'Technical Note',
          message: 'Please ensure your QR code is ready when approaching the booth.',
          type: 'info',
          priority: 3,
          isActive: true,
          createdBy: admins?.id,
        },
      ],
    });
    console.log('  ✅ Announcements created (3)');
  } else {
    console.log(`  ⏭  Announcements skipped (${announcementCount} exist)`);
  }

  // ==========================================================
  // SUMMARY
  // ==========================================================
  console.log('🎉 Database seeding completed!');
  console.log('📋 Summary:');
  console.log(`  Users:         ${await prisma.user.count({ where: { deletedAt: null } })}`);
  console.log(`  Settings:      ${await prisma.settings.count({ where: { deletedAt: null } })}`);
  console.log(`  Prizes:        ${await prisma.prize.count({ where: { deletedAt: null } })}`);
  console.log(`  Sponsors:      ${await prisma.sponsor.count({ where: { deletedAt: null } })}`);
  console.log(
    `  Announcements: ${await prisma.announcement.count({ where: { deletedAt: null } })}`,
  );
  console.log('🔑 Credentials:');
  console.log('  Super Admin: admin@radiantgroup.com / Admin123!');
  console.log('  Admin:       admin@radiantluckydraw.com / admin123');
  console.log('  Operator:    operator1@radiantluckydraw.com / operator123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
