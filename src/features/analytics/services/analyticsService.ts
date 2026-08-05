// ============================================================
// Analytics Service
// ============================================================

import { mockAnalyticsRepository } from '../repository/mockAnalyticsRepository';
import type {
  AnalyticsSummary,
  HourlyDataPoint,
  DailyDataPoint,
  WeeklyDataPoint,
  MonthlyDataPoint,
  PrizeDistribution,
  WinningProbability,
  QueuePerformance,
  AverageWaitTime,
  MostPopularPrize,
  AnalyticsReport,
  ExportOptions,
} from '../types';

class AnalyticsService {
  private repository = mockAnalyticsRepository;

  async getSummary(): Promise<AnalyticsSummary> {
    return this.repository.getSummary();
  }

  async getHourlyData(): Promise<HourlyDataPoint[]> {
    return this.repository.getHourlyData();
  }

  async getDailyData(daysCount?: number): Promise<DailyDataPoint[]> {
    return this.repository.getDailyData(daysCount);
  }

  async getWeeklyData(weeksCount?: number): Promise<WeeklyDataPoint[]> {
    return this.repository.getWeeklyData(weeksCount);
  }

  async getMonthlyData(monthsCount?: number): Promise<MonthlyDataPoint[]> {
    return this.repository.getMonthlyData(monthsCount);
  }

  async getPrizeDistribution(): Promise<PrizeDistribution[]> {
    return this.repository.getPrizeDistribution();
  }

  async getWinningProbabilities(): Promise<WinningProbability[]> {
    return this.repository.getWinningProbabilities();
  }

  async getQueuePerformance(): Promise<QueuePerformance[]> {
    return this.repository.getQueuePerformance();
  }

  async getAverageWaitTimes(): Promise<AverageWaitTime[]> {
    return this.repository.getAverageWaitTimes();
  }

  async getMostPopularPrizes(): Promise<MostPopularPrize[]> {
    return this.repository.getMostPopularPrizes();
  }

  async getFullReport(type: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AnalyticsReport> {
    return this.repository.getFullReport(type);
  }

  async exportData(options: ExportOptions): Promise<Blob> {
    const report = await this.getFullReport('daily');
    const { format } = options;

    switch (format) {
      case 'csv':
        return this.generateCSV(report);
      case 'excel':
        return this.generateExcel(report);
      case 'pdf':
        return this.generatePDF(report);
      default:
        return this.generateCSV(report);
    }
  }

  private generateCSV(report: AnalyticsReport): Blob {
    const rows: string[] = ['Section,Label,Value'];

    // Summary
    rows.push('Summary,Total Visitors,' + report.summary.totalVisitors);
    rows.push('Summary,Registered Participants,' + report.summary.registeredParticipants);
    rows.push('Summary,Completed Draws,' + report.summary.completedDraws);
    rows.push('Summary,Remaining Stock,' + report.summary.remainingPrizeStock);
    rows.push('Summary,Conversion Rate,' + report.summary.conversionRate + '%');
    rows.push('Summary,Peak Hour,' + report.summary.peakHour);
    rows.push('Summary,System Uptime,' + report.summary.systemUptime + '%');

    rows.push('');
    rows.push('Hourly Data,Hour,Participants,Draws');
    report.hourlyData.forEach((d) => rows.push(`Hourly,${d.hour},${d.participants},${d.draws}`));

    rows.push('');
    rows.push('Prize Distribution,Prize,Count');
    report.prizeDistribution.forEach((p) => rows.push(`Prize,${p.name},${p.value}`));

    rows.push('');
    rows.push('Queue Performance,Time,Wait Time (min),Queue Length');
    report.queuePerformance.forEach((q) =>
      rows.push(`Queue,${q.time},${q.waitTime},${q.queueLength}`),
    );

    return new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  }

  private generateExcel(report: AnalyticsReport): Blob {
    // For now, generate CSV with .xls extension as a simple approach
    // In production, use a library like exceljs or xlsx
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Analytics</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table>
          <tr><th colspan="2">${report.title}</th></tr>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Visitors</td><td>${report.summary.totalVisitors}</td></tr>
          <tr><td>Registered Participants</td><td>${report.summary.registeredParticipants}</td></tr>
          <tr><td>Completed Draws</td><td>${report.summary.completedDraws}</td></tr>
          <tr><td>Remaining Stock</td><td>${report.summary.remainingPrizeStock}</td></tr>
          <tr><td>Conversion Rate</td><td>${report.summary.conversionRate}%</td></tr>
          <tr><td>Peak Hour</td><td>${report.summary.peakHour}</td></tr>
          <tr><td>System Uptime</td><td>${report.summary.systemUptime}%</td></tr>
        </table>
        <br/>
        <table>
          <tr><th>Hour</th><th>Participants</th><th>Draws</th></tr>
          ${report.hourlyData.map((d) => `<tr><td>${d.hour}</td><td>${d.participants}</td><td>${d.draws}</td></tr>`).join('')}
        </table>
      </body></html>
    `;
    return new Blob([html], { type: 'application/vnd.ms-excel' });
  }

  private generatePDF(report: AnalyticsReport): Blob {
    // Simple text-based PDF-like output
    // In production, use a library like jspdf or pdfmake
    const lines: string[] = [
      '='.repeat(60),
      report.title,
      '='.repeat(60),
      '',
      'SUMMARY',
      '-'.repeat(40),
      `Total Visitors:        ${report.summary.totalVisitors}`,
      `Registered Participants: ${report.summary.registeredParticipants}`,
      `Completed Draws:       ${report.summary.completedDraws}`,
      `Remaining Stock:       ${report.summary.remainingPrizeStock}`,
      `Conversion Rate:       ${report.summary.conversionRate}%`,
      `Peak Hour:             ${report.summary.peakHour}`,
      `System Uptime:         ${report.summary.systemUptime}%`,
      '',
      'HOURLY PARTICIPANTS',
      '-'.repeat(40),
      ...report.hourlyData.map(
        (d) =>
          `${d.hour}  |  ${String(d.participants).padStart(4)} participants  |  ${d.draws} draws`,
      ),
      '',
      'PRIZE DISTRIBUTION',
      '-'.repeat(40),
      ...report.prizeDistribution.map((p) => `${p.name.padEnd(25)} ${p.value}`),
      '',
      'Generated: ${new Date(report.generatedAt).toLocaleString()}',
    ];
    return new Blob([lines.join('\n')], { type: 'text/plain' });
  }
}

export const analyticsService = new AnalyticsService();
