import { NextFunction, Request, Response } from "express";

import { auth } from "@/lib/auth";
import { type BetterAuthUser, mapBetterAuthUserToDTO } from "@/modules/auth/auth.dto";
import { AppError } from "@/utils/errors";
import { toRecordStringHeaders } from "@/utils/http";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: toRecordStringHeaders(req.headers),
    });
    if (!session?.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }
    req.user = mapBetterAuthUserToDTO(session.user as BetterAuthUser);
    next();
  } catch {
    next(new AppError(401, "UNAUTHORIZED", "Invalid session"));
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: toRecordStringHeaders(req.headers),
    });
    if (session?.user) {
      req.user = mapBetterAuthUserToDTO(session.user as BetterAuthUser);
    }
  } catch {
    /* continue without user */
  }
  next();
};
