/**
 * MetaCharacterController unit tests — Story 8.1 Task 10.4 (AC #10)
 * GET /api/v1/meta-character — returns MetaCharacterDTO or null.
 */
import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("./meta-character.service", () => ({
  metaCharacterService: {
    getByUserId: vi.fn(),
  },
}));

import { getMetaCharacterHandler } from "./meta-character.controller";
import { metaCharacterService } from "./meta-character.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReqRes(userId = "user-1") {
  const req = {
    user: { id: userId },
  } as unknown as Request;

  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = { json, status } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next, json, status };
}

const MOCK_DTO = {
  id: "meta-1",
  name: "Aragorn",
  level: 1,
  xp: 0,
  raceId: "race-1",
  raceName: "Elfe",
  classId: "class-1",
  className: "Mage",
  createdAt: "2026-04-03T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/v1/meta-character", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with MetaCharacterDTO when meta-character exists (AC #10)", async () => {
    vi.mocked(metaCharacterService.getByUserId).mockResolvedValueOnce(MOCK_DTO);

    const { req, res, next, json } = makeReqRes();
    await getMetaCharacterHandler(req, res, next);

    expect(json).toHaveBeenCalledWith({ success: true, data: MOCK_DTO });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 200 with data: null when no meta-character yet (AC #10)", async () => {
    vi.mocked(metaCharacterService.getByUserId).mockResolvedValueOnce(null);

    const { req, res, next, json } = makeReqRes();
    await getMetaCharacterHandler(req, res, next);

    expect(json).toHaveBeenCalledWith({ success: true, data: null });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next(err) on service error", async () => {
    const err = new Error("DB error");
    vi.mocked(metaCharacterService.getByUserId).mockRejectedValueOnce(err);

    const { req, res, next } = makeReqRes();
    await getMetaCharacterHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
