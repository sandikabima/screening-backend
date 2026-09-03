import { Request, Response } from "express";
import { errorResponse } from "@/utils/response";
import logger from "@/utils/logger";

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  return errorResponse(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
  );
};
