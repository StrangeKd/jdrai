import { NextFunction, Request, Response } from "express";

import { toRecordStringHeaders } from "@/utils/http";

import { updateUserSchema } from "./users.schema";
import { usersService } from "./users.service";

export const getMe = (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = updateUserSchema.parse(req.body);
    const headers = toRecordStringHeaders(req.headers);

    const updated = await usersService.updateMe(req.user!.id, headers, input);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
