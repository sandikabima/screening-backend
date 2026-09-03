import { NextFunction, Request, Response } from "express";

export type AsyncRequestHandler = (
  req: any,
  res: Response,
  next: NextFunction,
) => Promise<Response | void>;

export const asyncHandler = (handler: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as any, res, next)).catch(next);
  };
};
