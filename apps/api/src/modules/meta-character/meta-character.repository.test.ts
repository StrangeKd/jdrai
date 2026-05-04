/**
 * meta-character.repository unit tests — mocks db to test query delegation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    query: {
      metaCharacters: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  metaCharacters: { userId: "userId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { db } from "@/db";

import {
  createOrUpdateMetaCharacter,
  getMetaCharacterByUserId,
} from "./meta-character.repository";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_ROW = {
  id: "meta-1",
  userId: "user-1",
  name: "Aragorn",
  avatarUrl: null,
  background: null,
  level: 1,
  xp: 0,
  cosmetics: {},
  raceId: "race-1",
  classId: "class-1",
  createdAt: new Date("2026-04-03"),
};

function makeInsertMock(returning: unknown) {
  const returningFn = vi.fn().mockResolvedValue([returning]);
  const onConflictFn = vi.fn().mockReturnValue({ returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictFn });
  vi.mocked(db.insert).mockReturnValue({ values: valuesFn } as unknown as ReturnType<typeof db.insert>);
  return { returningFn, onConflictFn, valuesFn };
}

// ---------------------------------------------------------------------------
// getMetaCharacterByUserId
// ---------------------------------------------------------------------------

describe("getMetaCharacterByUserId()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the row when found", async () => {
    vi.mocked(db.query.metaCharacters.findFirst).mockResolvedValueOnce(MOCK_ROW);
    const result = await getMetaCharacterByUserId("user-1");
    expect(result).toEqual(MOCK_ROW);
  });

  it("returns null when no row found", async () => {
    vi.mocked(db.query.metaCharacters.findFirst).mockResolvedValueOnce(undefined);
    const result = await getMetaCharacterByUserId("user-1");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createOrUpdateMetaCharacter
// ---------------------------------------------------------------------------

describe("createOrUpdateMetaCharacter()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the inserted row", async () => {
    makeInsertMock(MOCK_ROW);

    const result = await createOrUpdateMetaCharacter({
      userId: "user-1",
      name: "Aragorn",
      raceId: "race-1",
      classId: "class-1",
    });

    expect(result).toEqual(MOCK_ROW);
  });

  it("passes default level/xp/cosmetics when not provided", async () => {
    const { valuesFn } = makeInsertMock(MOCK_ROW);

    await createOrUpdateMetaCharacter({
      userId: "user-1",
      name: "Héros",
      raceId: null,
      classId: null,
    });

    const insertedValues = valuesFn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertedValues.level).toBe(1);
    expect(insertedValues.xp).toBe(0);
    expect(insertedValues.cosmetics).toEqual({});
  });

  it("passes provided level/xp/cosmetics when supplied", async () => {
    const { valuesFn } = makeInsertMock({ ...MOCK_ROW, level: 5, xp: 100 });

    await createOrUpdateMetaCharacter({
      userId: "user-1",
      name: "Veteran",
      raceId: null,
      classId: null,
      level: 5,
      xp: 100,
      cosmetics: { hat: "crown" },
    });

    const insertedValues = valuesFn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertedValues.level).toBe(5);
    expect(insertedValues.xp).toBe(100);
    expect(insertedValues.cosmetics).toEqual({ hat: "crown" });
  });
});
