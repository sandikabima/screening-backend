import { db } from "@/db";
import { users, userTokens } from "@/db/schema";
import {
  Auth,
  AuthResponse,
  AuthRole,
  AuthWithoutResponse,
  LoginInput,
} from "@/types/auth";
import logger from "@/utils/logger";
import { PasswordUtils } from "@/utils/password";
import { generateTokens, verifyRefreshToken } from "@/utils/jwt";
import { config } from "@/config/env";
import { and, eq } from "drizzle-orm";

const DUMMY_HASH =
  "$2b$10$e8b.v2L./f2Xo7Pz9C9Rme8N/3Xy/1N.5Ff9N5O.11F2N.4R1g/e6";

// Helper konversi string durasi env (1m, 15m, 24h, 7d) ke ms
const parseDurationToMs = (durationStr: string): number => {
  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};

export class AuthService {
  static async login(
    credentials: LoginInput,
    deviceInfo: string = "Unknown Device",
  ): Promise<AuthResponse> {
    try {
      const authRaw = await db.query.users.findFirst({
        where: eq(users.email, credentials.email),
        with: {
          role: {
            with: {
              rolePermissions: {
                with: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      const dbPassword = authRaw?.password || DUMMY_HASH;
      const isPasswordValid = await PasswordUtils.compare(
        credentials.password,
        dbPassword,
      );

      if (!authRaw || !isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      if (!authRaw.isActive) {
        throw new Error(
          "Account is deactivated. Please contact your administrator",
        );
      }

      const dynamicPermissions: string[] =
        authRaw.role?.rolePermissions.map(
          (rp) => rp.permission.permissionKey,
        ) || [];

      const auth: Auth = {
        id: authRaw.id,
        email: authRaw.email,
        displayName: authRaw.role?.displayName,
        name: authRaw.name,
        role: authRaw.role?.name as AuthRole,
        permissions: dynamicPermissions,
        avatarUrl: authRaw.avatarUrl,
        isActive: authRaw.isActive,
        createdAt: authRaw.createdAt,
        updatedAt: authRaw.updatedAt,
      };

      const tokens = generateTokens({
        userId: auth.id,
        email: auth.email,
        role: auth.role,
        permissions: auth.permissions,
      });

      //  BACA SINKRON DARI CONFIG ENV (misal: "1m", "15m", "7d")
      const refreshMs = parseDurationToMs(config.jwt.refreshExpiresIn);

      await db.insert(userTokens).values({
        userId: auth.id,
        refreshToken: tokens.refreshToken,
        deviceInfo: deviceInfo,
        isRevoked: false,
        expiredAt: new Date(Date.now() + refreshMs),
      });

      logger.info("User session initiated successfully", {
        userId: auth.id,
        email: auth.email,
      });

      return {
        auth: this.sanitizeUser(auth),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      logger.error("Login execution rejected", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new Error("Refresh token is required for logout");
    }

    const session = await db.query.userTokens.findFirst({
      where: eq(userTokens.refreshToken, refreshToken),
    });

    if (!session) {
      throw new Error("Refresh token is invalid or not found");
    }

    await db
      .update(userTokens)
      .set({ isRevoked: true })
      .where(eq(userTokens.id, session.id));
  }

  static async refresh(refreshToken?: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const payload = verifyRefreshToken(refreshToken);
    const session = await db.query.userTokens.findFirst({
      where: and(
        eq(userTokens.refreshToken, refreshToken),
        eq(userTokens.isRevoked, false),
      ),
    });

    if (!session || new Date(session.expiredAt) < new Date()) {
      throw new Error("Refresh token is invalid or expired");
    }

    const authRaw = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: { permission: true },
            },
          },
        },
      },
    });

    if (!authRaw || !authRaw.isActive) {
      throw new Error("User is not active");
    }

    const permissionsList =
      authRaw.role?.rolePermissions.map((rp) => rp.permission.permissionKey) ||
      [];

    const auth: Auth = {
      id: authRaw.id,
      email: authRaw.email,
      role: authRaw.role?.name as AuthRole,
      permissions: permissionsList,
      avatarUrl: authRaw.avatarUrl,
      isActive: authRaw.isActive,
      createdAt: authRaw.createdAt,
      updatedAt: authRaw.updatedAt,
    };

    const tokens = generateTokens({
      userId: auth.id,
      email: auth.email,
      role: auth.role,
      permissions: auth.permissions,
    });

    //  BACA SINKRON DARI CONFIG ENV SAAT REFRESH
    const refreshMs = parseDurationToMs(config.jwt.refreshExpiresIn);

    await db
      .update(userTokens)
      .set({
        refreshToken: tokens.refreshToken,
        expiredAt: new Date(Date.now() + refreshMs),
      })
      .where(eq(userTokens.id, session.id));

    return {
      auth: this.sanitizeUser(auth),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  static async getMe(userId?: string): Promise<AuthWithoutResponse> {
    if (!userId) {
      throw new Error("User id is required");
    }

    const authRaw = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: { permission: true },
            },
          },
        },
      },
    });

    if (!authRaw) {
      throw new Error("User not found");
    }

    const auth: Auth = {
      id: authRaw.id,
      email: authRaw.email,
      role: authRaw.role?.name as AuthRole,
      permissions:
        authRaw.role?.rolePermissions.map(
          (rp) => rp.permission.permissionKey,
        ) || [],
      avatarUrl: authRaw.avatarUrl,
      isActive: authRaw.isActive,
      createdAt: authRaw.createdAt,
      updatedAt: authRaw.updatedAt,
    };

    return this.sanitizeUser(auth);
  }

  private static sanitizeUser(auth: Auth): AuthWithoutResponse {
    const { password, ...userWithoutPassword } = auth;
    return userWithoutPassword;
  }
}
