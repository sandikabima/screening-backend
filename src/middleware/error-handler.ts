import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/errors";
import { errorResponse } from "@/utils/response";
import logger from "@/utils/logger";
import { config } from "@/config/env";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    logger.warn("Application error", {
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
      url: req.url,
      method: req.method,
    });

    return errorResponse(res, err.message, err.statusCode);
  }

  const message = err instanceof Error ? err.message : "Internal server error";

  logger.error("Unhandled error", {
    message,
    stack: err instanceof Error ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  return errorResponse(
    res,
    config.server.isProduction ? "Internal server error" : message,
    500,
  );
};
