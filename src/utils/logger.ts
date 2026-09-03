import winston from "winston";
import { config } from "@/config/env";

// Format Utama for file
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? `\n${stack}` : ""}`;
  }),
);

// Format Khusus for Console
const consoleLogFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ""}`;
  }),
);

// Create Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileLogFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleLogFormat,
    }),

    //File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    }),

    // File transport for logs global
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

// Add debug tranport in development
if (config.server.isDevelopment) {
  logger.add(
    new winston.transports.File({
      filename: "logs/debug.log",
      level: "debug",
    }),
  );
}

export default logger;
