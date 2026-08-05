// ============================================================
// RADIANT LUCKY DRAW - Seed Script
// Provides mock seed data for development and testing
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.winner.deleteMany();
  await prisma.drawParticipant.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.draw.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // ==========================================================
  // USERS
  // ==========================================================
  const adminPassword = await bcrypt.hash('admin123', 12);
  const operatorPassword = await bcrypt.hash('operator123', 12);

  // Production admin (RC4.18): admin@radiantgroup.com / Admin123! / super_admin
  const productionAdminPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@radiantluckydraw.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'admin@radiantgroup.com',
      password: productionAdminPassword,
      role: 'super_admin',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      username: 'operator1',
      email: 'operator1@radiantluckydraw.com',
      password: operatorPassword,
      role: 'operator',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      username: 'operator2',
      email: 'operator2@radiantluckydraw.com',
      password: operatorPassword,
      role: 'operator',
      isActive: true,
    },
  });

  logger.info('  ✅ Users created');

  // ==========================================================
  // PARTICIPANTS
  // ==========================================================
  const participantNames = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
    'Edward Norton',
    'Fiona Apple',
    'George Lucas',
    'Hannah Montana',
    'Ivan Petrov',
    'Julia Roberts',
    'Kevin Hart',
    'Laura Croft',
    'Michael Jordan',
    'Nina Simone',
    'Oscar Wilde',
    'Patricia Arquette',
    'Quincy Jones',
    'Rachel Green',
    'Steve Jobs',
    'Tina Turner',
    'Uma Thurman',
    'Victor Hugo',
    'Wendy Williams',
    'Xander Cage',
    'Yoko Ono',
    'Zack Morris',
    'Amelia Earhart',
    'Bruce Wayne',
    'Clark Kent',
    'Daisy Duke',
  ];

  const participants = await Promise.all(
    participantNames.map((name, index) =>
      prisma.participant.create({
        data: {
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: `+1-555-${String(1000 + index).padStart(4, '0')}`,
          company: ['Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Corp', 'Wayne Enterprises'][
            index % 5
          ],
          queueNumber: `Q${String(index + 1).padStart(3, '0')}`,
          status: index < 5 ? 'completed' : index < 10 ? 'called' : 'registered',
          registeredAt: new Date(Date.now() - (30 - index) * 60000),
          calledAt: index < 10 ? new Date(Date.now() - (20 - index) * 60000) : null,
          completedAt: index < 5 ? new Date(Date.now() - (10 - index) * 60000) : null,
        },
      }),
    ),
  );

  logger.info('  ✅ Participants created');

  // ==========================================================
  // PRIZES
  // ==========================================================
  const prizeData = [
    {
      name: 'Smartphone X',
      description: 'Latest flagship smartphone with AI features',
      value: 999.99,
      tier: 'gold',
      quantity: 3,
      remaining: 3,
      sponsor: 'TechCorp',
    },
    {
      name: 'Laptop Pro',
      description: 'High-performance laptop for professionals',
      value: 1999.99,
      tier: 'platinum',
      quantity: 2,
      remaining: 2,
      sponsor: 'TechCorp',
    },
    {
      name: 'Wireless Earbuds',
      description: 'Premium noise-cancelling earbuds',
      value: 199.99,
      tier: 'silver',
      quantity: 10,
      remaining: 10,
      sponsor: 'SoundWave',
    },
    {
      name: 'Smart Watch',
      description: 'Fitness tracking smartwatch',
      value: 349.99,
      tier: 'gold',
      quantity: 5,
      remaining: 5,
      sponsor: 'WearableTech',
    },
    {
      name: 'Gift Card $50',
      description: 'Universal gift card worth $50',
      value: 50.0,
      tier: 'bronze',
      quantity: 50,
      remaining: 50,
      sponsor: 'GiftWorld',
    },
    {
      name: 'Gift Card $100',
      description: 'Universal gift card worth $100',
      value: 100.0,
      tier: 'silver',
      quantity: 25,
      remaining: 25,
      sponsor: 'GiftWorld',
    },
    {
      name: 'Tablet Ultra',
      description: 'Versatile tablet for work and play',
      value: 699.99,
      tier: 'gold',
      quantity: 4,
      remaining: 4,
      sponsor: 'TechCorp',
    },
    {
      name: 'Diamond Ring',
      description: 'Exquisite diamond ring with certificate',
      value: 4999.99,
      tier: 'diamond',
      quantity: 1,
      remaining: 1,
      sponsor: 'LuxuryGems',
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable waterproof speaker',
      value: 149.99,
      tier: 'bronze',
      quantity: 15,
      remaining: 15,
      sponsor: 'SoundWave',
    },
    {
      name: 'Vacation Package',
      description: 'All-inclusive 5-day vacation for two',
      value: 2999.99,
      tier: 'platinum',
      quantity: 2,
      remaining: 2,
      sponsor: 'TravelEase',
    },
  ];

  const prizes = await Promise.all(
    prizeData.map((p) =>
      prisma.prize.create({
        data: {
          name: p.name,
          description: p.description,
          value: p.value,
          currency: 'USD',
          quantity: p.quantity,
          remaining: p.remaining,
          tier: p.tier,
          sponsor: p.sponsor,
          isActive: true,
        },
      }),
    ),
  );

  logger.info('  ✅ Prizes created');

  // ==========================================================
  // DRAWS
  // ==========================================================
  const drawData = [
    // Gift Card $50
    { name: 'Opening Draw', prize: prizes[4], status: 'completed', winner: participants[0] },
    // Bluetooth Speaker
    { name: 'Bronze Round 1', prize: prizes[8], status: 'completed', winner: participants[1] },
    // Wireless Earbuds
    { name: 'Silver Round 1', prize: prizes[2], status: 'completed', winner: participants[2] },
    // Smartphone X
    { name: 'Gold Round 1', prize: prizes[0], status: 'completed', winner: participants[3] },
    // Gift Card $50
    { name: 'Bronze Round 2', prize: prizes[4], status: 'completed', winner: participants[4] },
    // Gift Card $100
    { name: 'Silver Round 2', prize: prizes[5], status: 'countdown', winner: null },
    // Tablet Ultra
    { name: 'Gold Round 2', prize: prizes[6], status: 'pending', winner: null },
    // Laptop Pro
    { name: 'Platinum Round 1', prize: prizes[1], status: 'pending', winner: null },
    // Diamond Ring
    { name: 'Diamond Round', prize: prizes[7], status: 'pending', winner: null },
    // Vacation Package
    { name: 'Grand Finale', prize: prizes[9], status: 'pending', winner: null },
  ];

  const draws: Array<{ id: string }> = [];
  for (let i = 0; i < drawData.length; i++) {
    const d = drawData[i];
    const draw = await prisma.draw.create({
      data: {
        name: d.name,
        prizeId: d.prize.id,
        prizeName: d.prize.name,
        status: d.status,
        startedAt: d.status === 'completed' ? new Date(Date.now() - (10 - i) * 120000) : null,
        completedAt: d.status === 'completed' ? new Date(Date.now() - (10 - i) * 60000) : null,
      },
    });
    draws.push(draw);
  }

  logger.info('  ✅ Draws created');

  // ==========================================================
  // DRAW PARTICIPANTS (Join Table)
  // ==========================================================
  for (let i = 0; i < draws.length; i++) {
    const participantCount = Math.min(participants.length, 5 + i * 2);
    for (let j = 0; j < participantCount; j++) {
      await prisma.drawParticipant
        .create({
          data: {
            drawId: draws[i].id,
            participantId: participants[j].id,
          },
        })
        .catch(() => {
          // Skip duplicates silently
        });
    }
  }

  logger.info('  ✅ Draw participants linked');

  // ==========================================================
  // WINNERS
  // ==========================================================
  for (let i = 0; i < 5; i++) {
    const d = drawData[i];
    if (d.winner) {
      await prisma.winner.create({
        data: {
          drawId: draws[i].id,
          participantId: d.winner.id,
          prizeId: d.prize.id,
          prizeTier: d.prize.tier,
          prizeValue: d.prize.value,
          announcedAt: new Date(Date.now() - (10 - i) * 60000),
        },
      });

      // Update draw with winner reference
      await prisma.draw.update({
        where: { id: draws[i].id },
        data: {
          winnerId: (await prisma.winner.findFirst({ where: { drawId: draws[i].id } }))!.id,
          winnerName: d.winner.name,
        },
      });
    }
  }

  logger.info('  ✅ Winners created');

  // ==========================================================
  // QUEUE ENTRIES
  // ==========================================================
  const queueStatuses: Array<'waiting' | 'called' | 'completed' | 'cancelled'>[] = [
    ['waiting', 'waiting', 'waiting', 'waiting', 'waiting'],
    ['called', 'called'],
    ['completed', 'completed', 'completed'],
    ['cancelled'],
  ];

  for (let i = 10; i < participants.length; i++) {
    const statusIdx = Math.min(Math.floor((i - 10) / 5), queueStatuses.length - 1);
    const status =
      queueStatuses[statusIdx][(i - 10) % queueStatuses[statusIdx].length] || 'waiting';

    await prisma.queueEntry.create({
      data: {
        participantId: participants[i].id,
        participantName: participants[i].name,
        queueNumber: participants[i].queueNumber || `Q${String(i + 1).padStart(3, '0')}`,
        status,
        calledAt:
          status === 'called' || status === 'completed' ? new Date(Date.now() - 300000) : null,
        completedAt: status === 'completed' ? new Date(Date.now() - 120000) : null,
      },
    });
  }

  logger.info('  ✅ Queue entries created');

  // ==========================================================
  // SPONSORS
  // ==========================================================
  const sponsorData = [
    {
      name: 'TechCorp',
      description: 'Leading technology innovator',
      tier: 'platinum',
      sortOrder: 0,
    },
    { name: 'SoundWave', description: 'Premium audio equipment', tier: 'gold', sortOrder: 1 },
    { name: 'LuxuryGems', description: 'Exquisite jewelry and gems', tier: 'gold', sortOrder: 2 },
    { name: 'TravelEase', description: 'Your travel companion', tier: 'silver', sortOrder: 3 },
    { name: 'GiftWorld', description: 'Universal gift solutions', tier: 'silver', sortOrder: 4 },
    { name: 'WearableTech', description: 'Smart wearable devices', tier: 'standard', sortOrder: 5 },
    { name: 'AutoElite', description: 'Premium automotive brand', tier: 'platinum', sortOrder: 6 },
    {
      name: 'FashionHub',
      description: 'Trendsetting fashion brand',
      tier: 'standard',
      sortOrder: 7,
    },
  ];

  await Promise.all(
    sponsorData.map((s) =>
      prisma.sponsor.create({
        data: {
          name: s.name,
          description: s.description,
          logoUrl: `https://via.placeholder.com/200x80?text=${encodeURIComponent(s.name)}`,
          websiteUrl: `https://${s.name.toLowerCase()}.com`,
          tier: s.tier,
          isActive: true,
          sortOrder: s.sortOrder,
        },
      }),
    ),
  );

  logger.info('  ✅ Sponsors created');

  // ==========================================================
  // ANNOUNCEMENTS
  // ==========================================================
  const announcementData = [
    {
      title: 'Welcome!',
      message: 'Welcome to the Radiant Lucky Draw event! We hope you have a fantastic experience.',
      type: 'success',
      priority: 1,
    },
    {
      title: 'Schedule Update',
      message: 'The Grand Prize draw has been moved to 5:00 PM.',
      type: 'info',
      priority: 2,
    },
    {
      title: 'Technical Issue',
      message: 'We are experiencing minor delays. Thank you for your patience.',
      type: 'warning',
      priority: 3,
    },
  ];

  await Promise.all(
    announcementData.map((a) =>
      prisma.announcement.create({
        data: {
          title: a.title,
          message: a.message,
          type: a.type,
          priority: a.priority,
          isActive: true,
          createdBy: admin.id,
        },
      }),
    ),
  );

  logger.info('  ✅ Announcements created');

  // ==========================================================
  // SETTINGS
  // ==========================================================
  await prisma.settings.create({
    data: {
      eventName: 'Radiant Lucky Draw 2026',
      eventDate: new Date('2026-07-30'),
      maxParticipants: 1000,
      drawInterval: 30,
      celebrationLevel: 'high',
      theme: 'luxury',
      soundEnabled: true,
      autoAdvance: false,
    },
  });

  logger.info('  ✅ Settings created');

  // ==========================================================
  // AUDIT LOGS
  // ==========================================================
  const auditActions = [
    { action: 'login', entity: 'user', entityId: admin.id },
    { action: 'create', entity: 'participant', entityId: participants[0].id },
    { action: 'create', entity: 'prize', entityId: prizes[0].id },
    { action: 'draw_start', entity: 'draw', entityId: draws[0].id },
    { action: 'draw_complete', entity: 'draw', entityId: draws[0].id },
    { action: 'create', entity: 'winner', entityId: draws[0].id },
  ];

  await Promise.all(
    auditActions.map((a) =>
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: a.action,
          entity: a.entity,
          entityId: a.entityId,
          metadata: { timestamp: new Date().toISOString() },
          ipAddress: '127.0.0.1',
          userAgent: 'Seed Script',
        },
      }),
    ),
  );

  logger.info('  ✅ Audit logs created');

  logger.info('🎉 Database seeding completed successfully!');
  logger.info('📋 Summary:');
  logger.info(`  Users:         4`);

  logger.info(`  Participants:  ${participants.length}`);
  logger.info(`  Prizes:        ${prizes.length}`);
  logger.info(`  Draws:         ${draws.length}`);
  logger.info(`  Sponsors:      ${sponsorData.length}`);
  logger.info(`  Announcements: ${announcementData.length}`);
  logger.info('🔑 Credentials:');
  logger.info('  Super Admin: admin@radiantgroup.com / Admin123!');
  logger.info('  Admin:       admin / admin123');
  logger.info('  Operator:    operator1 / operator123');
  logger.info('  Operator:    operator2 / operator123');
}

main()
  .catch((e) => {
    logger.error('❌ Seed failed:', { error: e });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
