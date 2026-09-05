import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("localhost"),

  DATABASE_URL: z.string().default("sqlite://./dev.db"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT-SECRET-KEY-CHANGE-THIS-IN-PRODUCTION-MINUMUM-32-CHARAKTER"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT-REFRESH-KEY-CHANGE-THIS-IN-PRODUCTION-MINUMUM-32-CHARAKTER"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUEST: z.coerce.number().default(100),

  LOG_LEVEL: z.string().default("info"),
  LOG_FILE_MAX_SIZE: z.coerce.number().default(5242880),
  LOG_FILE_MAX_FILES: z.coerce.number().default(10),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET-KEY-CHANGE-THIS-IN-PRODUCTION"),

  API_VERSION: z.string().default("v1"),
  API_PREFIX: z.string().default("/api"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("ERROR KONFIGURASI .ENV");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

const _env = parsedEnv.data;

const isDev = _env.NODE_ENV === "development";
const isProd = _env.NODE_ENV === "production";
const isTest = _env.NODE_ENV === "test";

export const config = {
  server: {
    env: _env.NODE_ENV,
    port: _env.PORT,
    host: _env.HOST,
    isDevelopment: isDev,
    isProduction: isProd,
    isTest: isTest,
  },
  database: {
    url: _env.DATABASE_URL,
  },
  jwt: {
    secret: _env.JWT_SECRET,
    expiresIn: _env.JWT_EXPIRES_IN,
    refreshSecret: _env.JWT_REFRESH_SECRET,
    refreshExpiresIn: _env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: _env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  },
  rateLimit: {
    windowMs: _env.RATE_LIMIT_WINDOW_MS,
    max: _env.RATE_LIMIT_MAX_REQUEST,
  },
  logging: {
    level: _env.LOG_LEVEL,
    fileMaxSize: _env.LOG_FILE_MAX_SIZE,
    fileMaxFiles: _env.LOG_FILE_MAX_FILES,
  },
  security: {
    bcryptSaltRounds: _env.BCRYPT_SALT_ROUNDS,
    sessionSecret: _env.SESSION_SECRET,
  },
  api: {
    version: _env.API_VERSION,
    prefix: _env.API_PREFIX,
  },
};
