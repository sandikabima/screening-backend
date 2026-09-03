import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { config } from "@/config/env";

if (!config.database.url) {
  throw new Error("DATABASE_URL is missing in your environment configuration");
}

const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
});

if (!config.server.isTest) {
  pool
    .query("SELECT NOW()")
    .then(() => console.log("Database OK"))
    .catch((err) => console.error("Database Connection Failed :", err.message));
}

export const db = drizzle(pool, { schema });
