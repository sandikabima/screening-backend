import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { screeningResults, followUps } from "@/db/schema";
import { DashboardOverviewResponse } from "@/types/dashboard.types";

export class DashboardService {
  static async getOverviewStats(): Promise<DashboardOverviewResponse> {
    const [
      totalScreeningRaw,
      priorityDistributionRaw,
      followUpStatusRaw,
      recentCriticalsRaw,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(${screeningResults.id})` })
        .from(screeningResults),

      db
        .select({
          priority: screeningResults.priorityResult,
          count: sql<number>`count(${screeningResults.id})`,
        })
        .from(screeningResults)
        .groupBy(screeningResults.priorityResult),

      db
        .select({
          status: followUps.status,
          count: sql<number>`count(${followUps.id})`,
        })
        .from(followUps)
        .groupBy(followUps.status),

      db.query.screeningResults.findMany({
        where: eq(screeningResults.priorityResult, "P1"),
        with: {
          student: {
            with: {
              user: {
                columns: { name: true, email: true },
              },
              studyProgram: {
                columns: { name: true, code: true },
              },
            },
          },
        },
        limit: 5,
        orderBy: (table, { desc }) => [desc(table.calculatedAt)],
      }),
    ]);

    const totalScreening = Number(totalScreeningRaw[0]?.count || 0);

    const priorityCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    priorityDistributionRaw.forEach((item) => {
      if (item.priority in priorityCounts) {
        priorityCounts[item.priority as keyof typeof priorityCounts] = Number(
          item.count,
        );
      }
    });

    const followUpCounts = { Belum: 0, Dijadwalkan: 0, Selesai: 0 };
    followUpStatusRaw.forEach((item) => {
      if (item.status in followUpCounts) {
        followUpCounts[item.status as keyof typeof followUpCounts] = Number(
          item.count,
        );
      }
    });

    return {
      overview: {
        totalScreening,
        criticalCasesP1: priorityCounts.P1,
        highRiskCasesP2: priorityCounts.P2,
        monitoringCasesP3: priorityCounts.P3,
        normalCasesP4: priorityCounts.P4,
      },
      followUpStats: {
        pending: followUpCounts.Belum,
        scheduled: followUpCounts.Dijadwalkan,
        completed: followUpCounts.Selesai,
        totalTickets:
          followUpCounts.Belum +
          followUpCounts.Dijadwalkan +
          followUpCounts.Selesai,
      },
      recentEmergencyCases: recentCriticalsRaw as any,
    };
  }
}
