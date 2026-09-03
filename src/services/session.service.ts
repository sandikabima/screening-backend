import { and, eq, gt, lte, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db";
import { userTokens } from "@/db/schema";
import { GetSessionInput, SessionResponse } from "@/types/session.types";
import { NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class SessionService {
  static async getSessions(query: GetSessionInput) {
    const page: number = normalizePositiveNumber(query?.page, 1);
    const limit: number = normalizePositiveNumber(query?.limit, 10);
    const offset: number = (page - 1) * limit;
    const now: Date = new Date();

    const conditions: SQL[] = [];

    if (query?.status === "active") {
      conditions.push(
        and(eq(userTokens.isRevoked, false), gt(userTokens.expiredAt, now))!,
      );
    } else if (query?.status === "inactive") {
      conditions.push(
        or(eq(userTokens.isRevoked, true), lte(userTokens.expiredAt, now))!,
      );
    }

    const whereClause: SQL | undefined =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [sessionsRaw, totalResult] = await Promise.all([
      db.query.userTokens.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (tokensTable, { desc }) => [desc(tokensTable.createdAt)],
        with: {
          user: true, // Join ke tabel users bawaan schema
        },
      }),
      db
        .select({ count: sql<number>`count(${userTokens.id})` })
        .from(userTokens)
        .where(whereClause),
    ]);

    const total: number = Number(totalResult[0]?.count || 0);
    const totalPages: number = Math.ceil(total / limit) || 1;

    const formattedSessions: SessionResponse[] = sessionsRaw.map((session) =>
      this.mapSession(session),
    );

    return {
      sessions: formattedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getSessionById(id: string): Promise<SessionResponse> {
    const session = await db.query.userTokens.findFirst({
      where: eq(userTokens.id, id),
      with: {
        user: true,
      },
    });

    if (!session) {
      throw new NotFoundError(`Sesi dengan ID ${id} tidak ditemukan`);
    }

    return this.mapSession(session);
  }

  static async revokeSession(id: string): Promise<void> {
    const existingSession = await db.query.userTokens.findFirst({
      where: eq(userTokens.id, id),
    });

    if (!existingSession) {
      throw new NotFoundError(`Sesi dengan ID ${id} tidak ditemukan`);
    }

    await db
      .update(userTokens)
      .set({ isRevoked: true })
      .where(eq(userTokens.id, id));
  }

  static async revokeOtherSessions(
    currentUserId: string,
    currentRefreshToken?: string,
  ): Promise<void> {
    const activeSessions = await db.query.userTokens.findMany({
      where: and(
        eq(userTokens.userId, currentUserId),
        eq(userTokens.isRevoked, false),
        gt(userTokens.expiredAt, new Date()),
      ),
    });

    const sessionIdsToRevoke: string[] = activeSessions
      .filter((session) =>
        currentRefreshToken
          ? session.refreshToken !== currentRefreshToken
          : true,
      )
      .map((session) => session.id);

    if (sessionIdsToRevoke.length === 0) return;

    await Promise.all(
      sessionIdsToRevoke.map((id: string) =>
        db
          .update(userTokens)
          .set({ isRevoked: true })
          .where(eq(userTokens.id, id)),
      ),
    );
  }

  private static mapSession(
    session: typeof userTokens.$inferSelect & {
      user?: { name: string | null; email: string } | null;
    },
  ): SessionResponse {
    const now: Date = new Date();
    const expiredAtDate: Date = new Date(session.expiredAt);
    const isActive: boolean = !session.isRevoked && expiredAtDate > now;

    return {
      id: session.id,
      userId: session.userId,
      userName: session.user?.name || "Tanpa Nama",
      userEmail: session.user?.email || "-",
      deviceInfo: session.deviceInfo || "Perangkat Tidak Dikenal",
      isRevoked: session.isRevoked,
      isActive,
      expiredAt: expiredAtDate.toISOString(),
      createdAt: new Date(session.createdAt).toISOString(),
    };
  }
}
