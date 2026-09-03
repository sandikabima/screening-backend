import app from "@/app";
import logger from "@/utils/logger";
import { config } from "@/config/env";

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(
    `Server running at http://${config.server.host}:${config.server.port}`,
    {
      environment: config.server.env,
      version: config.api.version,
    },
  );
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { server };
