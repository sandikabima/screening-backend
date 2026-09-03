import { NextFunction, Request, Response } from "express";
import { extractTokenFromHeader, verifyAccessToken } from "@/utils/jwt";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";

export interface AuthenticatedRequest<
  P = any,
  ResB = any,
  ReqB = any,
  ReqQ = any,
> extends Request<P, ResB, ReqB, ReqQ> {
  user?: { userId: string; email: string; role: string; permissions: string[] };
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return next(new UnauthorizedError("Access token is required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return next(new UnauthorizedError(message));
  }
};

export const authorizePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication is required"));
    }

    const hasPermission = req.user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          "You do not have permission to access this resource",
        ),
      );
    }

    return next();
  };
};

export type AuthReqWithParams<P> = AuthenticatedRequest<P, any, any, any>;
