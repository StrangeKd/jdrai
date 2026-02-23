import { NextFunction, Request, Response } from "express";

import { AppError } from "@/utils/errors";
import { toRecordStringHeaders } from "@/utils/http";

import { mapDbUserToDTO } from "./users.dto";
import { usersRepository } from "./users.repository";
import { updateUserSchema } from "./users.schema";
import { usersService } from "./users.service";

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Query DB directly to bypass Better Auth's cookieCache (maxAge: 5 min),
    // which serves stale session data after a username update.
    const user = await usersRepository.findById(req.user!.id);
    if (!user) return next(new AppError(404, "NOT_FOUND", "User not found"));
    res.json({ success: true, data: mapDbUserToDTO(user) });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = updateUserSchema.parse(req.body);
    const headers = toRecordStringHeaders(req.headers);

    const { user, setCookie } = await usersService.updateMe(req.user!.id, headers, input);

    // Forward the refreshed session cookie so the browser updates its cookieCache.
    // Without this, the client keeps the old cookie (with username: null) for up to 5 min.
    if (setCookie) res.setHeader("set-cookie", setCookie);

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
