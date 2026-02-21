import { NextFunction, Request, Response } from "express";

import { auth } from "../lib/auth";
import { AppError } from "../utils/errors";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    });
    if (!session?.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }
    req.user = {
      id: session.user.id,
      email: session.user.email,
      username: (session.user as Record<string, unknown>).username as string | null ?? null,
      role: ((session.user as Record<string, unknown>).role as "user" | "admin") ?? "user",
      onboardingCompleted:
        ((session.user as Record<string, unknown>).onboardingCompleted as boolean) ?? false,
      createdAt: session.user.createdAt.toISOString(),
    };
    next();
  } catch {
    next(new AppError(401, "UNAUTHORIZED", "Invalid session"));
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    });
    if (session?.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        username: (session.user as Record<string, unknown>).username as string | null ?? null,
        role: ((session.user as Record<string, unknown>).role as "user" | "admin") ?? "user",
        onboardingCompleted:
          ((session.user as Record<string, unknown>).onboardingCompleted as boolean) ?? false,
        createdAt: session.user.createdAt.toISOString(),
      };
    }
  } catch {
    /* continue without user */
  }
  next();
};
