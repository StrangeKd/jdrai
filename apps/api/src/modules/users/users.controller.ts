import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";

import { db } from "../../db";
import { users } from "../../db/schema";
import { auth } from "../../lib/auth";
import { AppError } from "../../utils/errors";
import { updateUserSchema } from "./users.schema";

export const getMe = (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = updateUserSchema.parse(req.body);
    const headers = req.headers as Record<string, string>;

    const result = await auth.api.updateUser({ body, headers });

    if (!result?.status) {
      return next(new AppError(500, "INTERNAL_ERROR", "Failed to update user"));
    }

    // Fetch fresh user from DB (bypasses session cookie cache TTL)
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
    });
    if (!updatedUser) {
      return next(new AppError(404, "NOT_FOUND", "User not found"));
    }

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username ?? null,
        role: (updatedUser.role ?? "user") as "user" | "admin",
        onboardingCompleted: updatedUser.onboardingCompleted ?? false,
        createdAt: updatedUser.createdAt.toISOString(),
      },
    });
  } catch (err) {
    // Handle unique constraint violation (username already taken) — PostgreSQL code 23505
    // DrizzleQueryError wraps the postgres error in `.cause`
    const pgErr = err as Record<string, unknown>;
    const cause = pgErr?.cause as Record<string, unknown> | undefined;
    const isUniqueViolation =
      pgErr?.code === "23505" ||
      cause?.code === "23505";
    const isUsernameField =
      String(pgErr?.detail ?? "").includes("username") ||
      String(cause?.detail ?? "").includes("username");
    if (isUniqueViolation && isUsernameField) {
      return next(
        new AppError(409, "USERNAME_TAKEN", "Username is already taken"),
      );
    }
    next(err);
  }
};
