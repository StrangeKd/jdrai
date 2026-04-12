/**
 * Reference controller tests — GET /api/v1/reference/races + GET /api/v1/reference/classes
 * Story 8.2 Task 1 (AC: #5)
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorHandler } from "@/middleware/error.middleware";

// Mock the db module
vi.mock("@/db/index", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db/index";

import { getClasses,getRaces } from "./reference.controller";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get("/reference/races", getRaces);
  app.get("/reference/classes", getClasses);
  app.use(errorHandler);
  return app;
}

const MOCK_RACES = [
  { id: "r1", name: "Elfe", description: "Agile et perceptif.", isDefault: false },
  { id: "r2", name: "Humain", description: "Polyvalent.", isDefault: true },
  { id: "r3", name: "Nain", description: "Robuste.", isDefault: false },
];

const MOCK_CLASSES = [
  { id: "c1", name: "Aventurier", description: "Polyvalent.", isDefault: true },
  { id: "c2", name: "Guerrier", description: "Combattant.", isDefault: false },
  { id: "c3", name: "Mage", description: "Érudit.", isDefault: false },
  { id: "c4", name: "Voleur", description: "Discret.", isDefault: false },
];

describe("GET /reference/races", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 with races array", async () => {
    const mockChain = { from: vi.fn().mockReturnThis(), orderBy: vi.fn().mockResolvedValueOnce(MOCK_RACES) };
    vi.mocked(db.select).mockReturnValueOnce(mockChain as unknown as ReturnType<typeof db.select>);

    const app = buildApp();
    const res = await request(app).get("/reference/races");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: MOCK_RACES });
  });

  it("returns empty array when no races seeded", async () => {
    const mockChain = { from: vi.fn().mockReturnThis(), orderBy: vi.fn().mockResolvedValueOnce([]) };
    vi.mocked(db.select).mockReturnValueOnce(mockChain as unknown as ReturnType<typeof db.select>);

    const app = buildApp();
    const res = await request(app).get("/reference/races");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });
});

describe("GET /reference/classes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 with classes array", async () => {
    const mockChain = { from: vi.fn().mockReturnThis(), orderBy: vi.fn().mockResolvedValueOnce(MOCK_CLASSES) };
    vi.mocked(db.select).mockReturnValueOnce(mockChain as unknown as ReturnType<typeof db.select>);

    const app = buildApp();
    const res = await request(app).get("/reference/classes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: MOCK_CLASSES });
  });

  it("returns empty array when no classes seeded", async () => {
    const mockChain = { from: vi.fn().mockReturnThis(), orderBy: vi.fn().mockResolvedValueOnce([]) };
    vi.mocked(db.select).mockReturnValueOnce(mockChain as unknown as ReturnType<typeof db.select>);

    const app = buildApp();
    const res = await request(app).get("/reference/classes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });
});
