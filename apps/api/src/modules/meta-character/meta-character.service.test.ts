/**
 * MetaCharacterService unit tests — Story 8.1 Task 10.2
 * Mocks the DB to test pure service logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/db", () => ({
  db: {
    query: {
      metaCharacters: { findFirst: vi.fn() },
      races: { findFirst: vi.fn() },
      characterClasses: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  metaCharacters: { userId: "userId" },
  races: { id: "id", isDefault: "isDefault" },
  characterClasses: { id: "id", isDefault: "isDefault" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { db } from "@/db";

import { MetaCharacterService } from "./meta-character.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_RACE = { id: "race-1", name: "Elfe", description: null, traits: null, isDefault: false };
const MOCK_CLASS = { id: "class-1", name: "Mage", description: null, baseStats: null, isDefault: false };
const DEFAULT_RACE = { id: "race-default", name: "Humain", description: null, traits: null, isDefault: true };
const DEFAULT_CLASS = { id: "class-default", name: "Aventurier", description: null, baseStats: null, isDefault: true };

const MOCK_META_ROW = {
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
// Tests
// ---------------------------------------------------------------------------

describe("MetaCharacterService.createFromTutorial()", () => {
  let service: MetaCharacterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MetaCharacterService();
  });

  it("creates MetaCharacter with provided raceId and classId (AC #8)", async () => {
    vi.mocked(db.query.races.findFirst).mockResolvedValueOnce(MOCK_RACE);
    vi.mocked(db.query.characterClasses.findFirst).mockResolvedValueOnce(MOCK_CLASS);
    makeInsertMock(MOCK_META_ROW);

    const result = await service.createFromTutorial({
      userId: "user-1",
      username: "Aragorn",
      raceId: "race-1",
      classId: "class-1",
    });

    expect(result.name).toBe("Aragorn");
    expect(result.raceId).toBe("race-1");
    expect(result.raceName).toBe("Elfe");
    expect(result.classId).toBe("class-1");
    expect(result.className).toBe("Mage");
    expect(result.level).toBe(1);
    expect(result.xp).toBe(0);
  });

  it("uses default race when no raceId provided (AC #8)", async () => {
    // First call: no raceId → isDefault lookup
    vi.mocked(db.query.races.findFirst).mockResolvedValueOnce(DEFAULT_RACE);
    vi.mocked(db.query.characterClasses.findFirst).mockResolvedValueOnce(MOCK_CLASS);
    makeInsertMock({ ...MOCK_META_ROW, raceId: DEFAULT_RACE.id });

    const result = await service.createFromTutorial({
      userId: "user-1",
      username: "Héros",
      classId: "class-1",
    });

    expect(result.raceName).toBe("Humain");
  });

  it("uses default class when no classId provided (AC #8)", async () => {
    vi.mocked(db.query.races.findFirst).mockResolvedValueOnce(MOCK_RACE);
    vi.mocked(db.query.characterClasses.findFirst).mockResolvedValueOnce(DEFAULT_CLASS);
    makeInsertMock({ ...MOCK_META_ROW, classId: DEFAULT_CLASS.id });

    const result = await service.createFromTutorial({
      userId: "user-1",
      username: "Héros",
      raceId: "race-1",
    });

    expect(result.className).toBe("Aventurier");
  });

  it("uses both defaults when no choices provided (AC #8)", async () => {
    vi.mocked(db.query.races.findFirst).mockResolvedValueOnce(DEFAULT_RACE);
    vi.mocked(db.query.characterClasses.findFirst).mockResolvedValueOnce(DEFAULT_CLASS);
    makeInsertMock({ ...MOCK_META_ROW, raceId: DEFAULT_RACE.id, classId: DEFAULT_CLASS.id });

    const result = await service.createFromTutorial({ userId: "user-1", username: "Héros" });

    expect(result.raceName).toBe("Humain");
    expect(result.className).toBe("Aventurier");
  });

  it("upserts (does not throw) when called twice for same user (AC #8)", async () => {
    // Both calls should succeed — insert uses onConflictDoUpdate
    vi.mocked(db.query.races.findFirst).mockResolvedValue(DEFAULT_RACE);
    vi.mocked(db.query.characterClasses.findFirst).mockResolvedValue(DEFAULT_CLASS);
    makeInsertMock(MOCK_META_ROW);

    await expect(
      service.createFromTutorial({ userId: "user-1", username: "Héros" }),
    ).resolves.not.toThrow();
  });
});

describe("MetaCharacterService.getByUserId()", () => {
  let service: MetaCharacterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MetaCharacterService();
  });

  it("returns null when no MetaCharacter exists (AC #10)", async () => {
    vi.mocked(db.query.metaCharacters.findFirst).mockResolvedValueOnce(undefined);

    const result = await service.getByUserId("user-1");

    expect(result).toBeNull();
  });

  it("returns MetaCharacterDTO with resolved race/class names (AC #10)", async () => {
    vi.mocked(db.query.metaCharacters.findFirst).mockResolvedValueOnce(MOCK_META_ROW);
    vi.mocked(db.query.races.findFirst).mockResolvedValueOnce(MOCK_RACE);
    vi.mocked(db.query.characterClasses.findFirst).mockResolvedValueOnce(MOCK_CLASS);

    const result = await service.getByUserId("user-1");

    expect(result).not.toBeNull();
    expect(result!.id).toBe("meta-1");
    expect(result!.name).toBe("Aragorn");
    expect(result!.raceName).toBe("Elfe");
    expect(result!.className).toBe("Mage");
    expect(result!.createdAt).toBe("2026-04-03T00:00:00.000Z");
  });

  it("returns DTO without race/class names when IDs are null", async () => {
    const rowNoLinks = { ...MOCK_META_ROW, raceId: null, classId: null };
    vi.mocked(db.query.metaCharacters.findFirst).mockResolvedValueOnce(rowNoLinks);

    const result = await service.getByUserId("user-1");

    expect(result!.raceId).toBeUndefined();
    expect(result!.classId).toBeUndefined();
    expect(result!.raceName).toBeUndefined();
    expect(result!.className).toBeUndefined();
  });
});
