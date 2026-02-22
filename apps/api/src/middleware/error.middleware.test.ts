import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AppError } from "@/utils/errors";

import { errorHandler } from "./error.middleware";

vi.mock("@/utils/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

interface ErrorBody {
  success: boolean;
  error: { code: string; message?: string; timestamp: string };
}

function makeRes() {
  const capturedBody: { value?: ErrorBody } = {};
  const json = vi.fn((body: ErrorBody) => {
    capturedBody.value = body;
  });
  const status = vi.fn().mockReturnValue({ json });
  // Cast via unknown to avoid objectLiteralTypeAssertions rule
  const mockRes: unknown = { status, json };
  return { res: mockRes as Response, capturedBody };
}

function makeReq(): Request {
  const req: unknown = {};
  return req as Request;
}

const next = vi.fn() as unknown as NextFunction;

describe("errorHandler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handles ZodError → 400 VALIDATION_ERROR", () => {
    const { res, capturedBody } = makeRes();
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error("Expected ZodError");

    errorHandler(result.error, makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(capturedBody.value?.success).toBe(false);
    expect(capturedBody.value?.error.code).toBe("VALIDATION_ERROR");
    expect(capturedBody.value?.error.timestamp).toBeDefined();
  });

  it("handles AppError → correct status and code", () => {
    const { res, capturedBody } = makeRes();
    const err = new AppError(404, "NOT_FOUND", "Resource not found");

    errorHandler(err, makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(capturedBody.value?.success).toBe(false);
    expect(capturedBody.value?.error.code).toBe("NOT_FOUND");
    expect(capturedBody.value?.error.message).toBe("Resource not found");
    expect(capturedBody.value?.error.timestamp).toBeDefined();
  });

  it("handles unknown Error → 500 INTERNAL_ERROR", () => {
    const { res, capturedBody } = makeRes();
    const err = new Error("Unexpected crash");

    errorHandler(err, makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(capturedBody.value?.success).toBe(false);
    expect(capturedBody.value?.error.code).toBe("INTERNAL_ERROR");
    expect(capturedBody.value?.error.timestamp).toBeDefined();
  });
});
