/**
 * reference.repository unit tests — mocks db to test query delegation.
 *
 * Integration tests (real DB) would follow the pattern in game.repository.integration.test.ts
 * but are out of scope for this story — the static seed data is covered by E2E.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    query: {
      races: { findFirst: vi.fn() },
      characterClasses: { findFirst: vi.fn() },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  races: { id: "id", name: "name", isDefault: "isDefault" },
  characterClasses: { id: "id", name: "name", isDefault: "isDefault" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { db } from "@/db";

import {
  findDefaultClass,
  findDefaultRace,
  getAllClasses,
  getAllRaces,
  getClassById,
  getRaceById,
} from "./reference.repository";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RACE_ELFE = { id: "r1", name: "Elfe", description: null, traits: null, isDefault: false };
const RACE_HUMAN = { id: "r2", name: "Humain", description: null, traits: null, isDefault: true };
const CLASS_ADV = { id: "c1", name: "Aventurier", description: null, baseStats: null, isDefault: true };
const CLASS_MAGE = { id: "c2", name: "Mage", description: null, baseStats: null, isDefault: false };

/** Helper — builds a Drizzle select chain that resolves to `result`. */
function mockSelectChain(result: unknown) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(result),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  vi.mocked(db.select).mockReturnValueOnce(chain as unknown as ReturnType<typeof db.select>);
  return chain;
}

// ---------------------------------------------------------------------------
// getAllRaces
// ---------------------------------------------------------------------------

describe("getAllRaces()", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns all races", async () => {
    mockSelectChain([RACE_ELFE, RACE_HUMAN]);
    const result = await getAllRaces();
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe("Elfe");
  });

  it("returns empty array when table is empty", async () => {
    mockSelectChain([]);
    const result = await getAllRaces();
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAllClasses
// ---------------------------------------------------------------------------

describe("getAllClasses()", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns all classes", async () => {
    mockSelectChain([CLASS_ADV, CLASS_MAGE]);
    const result = await getAllClasses();
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getRaceById
// ---------------------------------------------------------------------------

describe("getRaceById()", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the race when found", async () => {
    mockSelectChain([RACE_ELFE]);
    const result = await getRaceById("r1");
    expect(result).toEqual(RACE_ELFE);
  });

  it("returns null when not found", async () => {
    mockSelectChain([]);
    const result = await getRaceById("unknown");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getClassById
// ---------------------------------------------------------------------------

describe("getClassById()", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the class when found", async () => {
    mockSelectChain([CLASS_MAGE]);
    const result = await getClassById("c2");
    expect(result).toEqual(CLASS_MAGE);
  });

  it("returns null when not found", async () => {
    mockSelectChain([]);
    const result = await getClassById("unknown");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findDefaultRace
// ---------------------------------------------------------------------------

describe("findDefaultRace()", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the default race", async () => {
    mockSelectChain([RACE_HUMAN]);
    const result = await findDefaultRace();
    expect(result).toEqual(RACE_HUMAN);
    expect(result!.isDefault).toBe(true);
  });

  it("returns null when no default race is seeded", async () => {
    mockSelectChain([]);
    const result = await findDefaultRace();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findDefaultClass
// ---------------------------------------------------------------------------

describe("findDefaultClass()", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the default class", async () => {
    mockSelectChain([CLASS_ADV]);
    const result = await findDefaultClass();
    expect(result).toEqual(CLASS_ADV);
    expect(result!.isDefault).toBe(true);
  });

  it("returns null when no default class is seeded", async () => {
    mockSelectChain([]);
    const result = await findDefaultClass();
    expect(result).toBeNull();
  });
});
