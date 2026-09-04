import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "@/config/env";
import appRoutes from "@/routes";
import logger from "@/utils/logger";
import { errorHandler } from "@/middleware/error-handler";
import { notFoundHandler } from "@/middleware/not-found";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

app.use(compression());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-auth-token",
    ],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (config.server.isDevelopment) {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }),
  );
}

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    meta: {
      success: false,
      message: "Too many requests from this IP, please try again later",
      code: 429,
      timestamp: new Date().toISOString(),
    },
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

app.get("/welcome", (_req, res) => {
  res.json({
    status: "OK",
    message: "Welcome to Mental Health Screening",
    version: config.api.version,
    documentation: "/docs",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: config.api.version,
  });
});

app.use(`${config.api.prefix}/${config.api.version}`, appRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
