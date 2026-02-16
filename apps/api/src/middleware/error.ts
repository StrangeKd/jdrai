import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status: number;
  code: string;
}

export function createError(message: string, status: number, code: string): AppError {
  const err = new Error(message) as AppError;
  err.status = status;
  err.code = code;
  return err;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
  });
}
