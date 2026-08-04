/**
 * Analytics Service
 *
 * Computes real dashboard and draw analytics from the database.
 * All placeholder/hardcoded statistics have been replaced with
 * values derived from actual PostgreSQL records (GO LIVE HOTFIX).
 */

import { DrawRepository, ParticipantRepository, PrizeRepository } from '../repositories';
import { prisma } from '../lib/prisma';
import type { DrawAnalytics, DashboardStats } from '../entities';

export class AnalyticsService {
  constructor(
    private drawRepository: DrawRepository,
    private participantRepository: ParticipantRepository,
    private prizeRepository: PrizeRepository,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Real participant counts by status.
    const [registered, called, completed, cancelled] = await Promise.all([
      prisma.participant.count({ where: { status: 'registered', deletedAt: null } }),
      prisma.participant.count({ where: { status: 'called', deletedAt: null } }),
      prisma.participant.count({ where: { status: 'completed', deletedAt: null } }),
      prisma.participant.count({ where: { status: 'cancelled', deletedAt: null } }),
    ]);

    // Real queue length = participants still waiting or currently called.
    const queueLength = registered + called;

    // Real draws completed today.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const drawsToday = await prisma.draw.count({
      where: { status: 'completed', completedAt: { gte: startOfDay }, deletedAt: null },
    });

    // Real prizes awarded = number of winner records.
    const prizesAwarded = await prisma.winner.count({ where: { deletedAt: null } });

    // Real active socket connections.
    const activeConnections = this.getActiveConnections();

    return {
      activeParticipants: registered + called + completed,
      queueLength,
      estimatedWait: queueLength * 2, // 2 minutes per participant
      drawsToday,
      prizesAwarded,
      systemUptime: process.uptime(),
      activeConnections,
    };
  }

  async getDrawAnalytics(): Promise<DrawAnalytics> {
    const draws = await this.drawRepository.findAll();
    const completedDraws = draws.filter((d) => d.status === 'completed');
    const prizes = await this.prizeRepository.findAll();

    // Real total prize value from winner records (sum of awarded prize values).
    const winners = await prisma.winner.findMany({ where: { deletedAt: null } });
    const totalPrizeValue = winners.reduce((sum, w) => sum + (w.prizeValue || 0), 0);

    // Real top prizes by number of awards.
    const awardCountByPrize = new Map<string, number>();
    for (const w of winners) {
      awardCountByPrize.set(w.prizeId, (awardCountByPrize.get(w.prizeId) || 0) + 1);
    }
    const topPrizes = prizes
      .map((p) => ({
        name: p.name,
        count: awardCountByPrize.get(p.id) || 0,
        value: p.value,
      }))
      .sort((a, b) => b.count - a.count || b.value - a.value)
      .slice(0, 5);

    // Real average draw time (seconds) from completed draws' startedAt -> completedAt.
    const drawTimes = completedDraws
      .filter((d) => d.startedAt && d.completedAt)
      .map((d) => {
        const start = new Date(d.startedAt as string).getTime();
        const end = new Date(d.completedAt as string).getTime();
        return Math.max(0, (end - start) / 1000);
      });
    const averageDrawTime =
      drawTimes.length > 0
        ? drawTimes.reduce((sum, t) => sum + t, 0) / drawTimes.length
        : 0;

    // Real participation by hour (registrations grouped by hour of day).
    const registrations = await prisma.participant.findMany({
      where: { deletedAt: null },
      select: { registeredAt: true },
    });
    const hourCounts = new Map<number, number>();
    for (const r of registrations) {
      const hour = new Date(r.registeredAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
    const participationByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts.get(hour) || 0,
    }));

    // Real completion rate.
    const completionRate = draws.length > 0 ? completedDraws.length / draws.length : 0;

    return {
      totalDraws: draws.length,
      totalParticipants: draws.reduce((sum, d) => sum + d.participantIds.length, 0),
      totalPrizesAwarded: completedDraws.length,
      totalPrizeValue,
      averageDrawTime,
      topPrizes,
      participationByHour,
      completionRate,
    };
  }

  /**
   * Return the number of active Socket.IO connections.
   * Falls back to 0 if the realtime layer is not attached.
   */
  private getActiveConnections(): number {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { RealtimeService } = require('../realtime');
      // The realtime service is a singleton attached to the HTTP server.
      // We read the underlying Socket.IO server's connected socket count.
      const io = (globalThis as any).__radiantRealtimeIO;
      if (io) {
        return io.engine.clientsCount || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}
