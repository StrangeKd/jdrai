/**
 * MetaCharacterService unit tests — Story 8.1 Task 10.2
 * Mocks reference.repository and meta-character.repository to test pure service logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/modules/reference/reference.repository", () => ({
  getRaceById: vi.fn(),
  findDefaultRace: vi.fn(),
  getClassById: vi.fn(),
  findDefaultClass: vi.fn(),
}));

vi.mock("./meta-character.repository", () => ({
  getMetaCharacterByUserId: vi.fn(),
  createOrUpdateMetaCharacter: vi.fn(),
}));

import {
  findDefaultClass,
  findDefaultRace,
  getClassById,
  getRaceById,
} from "@/modules/reference/reference.repository";

import {
  createOrUpdateMetaCharacter,
  getMetaCharacterByUserId,
} from "./meta-character.repository";
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
    vi.mocked(getRaceById).mockResolvedValueOnce(MOCK_RACE);
    vi.mocked(getClassById).mockResolvedValueOnce(MOCK_CLASS);
    vi.mocked(createOrUpdateMetaCharacter).mockResolvedValueOnce(MOCK_META_ROW);

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
    vi.mocked(findDefaultRace).mockResolvedValueOnce(DEFAULT_RACE);
    vi.mocked(getClassById).mockResolvedValueOnce(MOCK_CLASS);
    vi.mocked(createOrUpdateMetaCharacter).mockResolvedValueOnce({
      ...MOCK_META_ROW,
      raceId: DEFAULT_RACE.id,
    });

    const result = await service.createFromTutorial({
      userId: "user-1",
      username: "Héros",
      classId: "class-1",
    });

    expect(result.raceName).toBe("Humain");
  });

  it("uses default class when no classId provided (AC #8)", async () => {
    vi.mocked(getRaceById).mockResolvedValueOnce(MOCK_RACE);
    vi.mocked(findDefaultClass).mockResolvedValueOnce(DEFAULT_CLASS);
    vi.mocked(createOrUpdateMetaCharacter).mockResolvedValueOnce({
      ...MOCK_META_ROW,
      classId: DEFAULT_CLASS.id,
    });

    const result = await service.createFromTutorial({
      userId: "user-1",
      username: "Héros",
      raceId: "race-1",
    });

    expect(result.className).toBe("Aventurier");
  });

  it("uses both defaults when no choices provided (AC #8)", async () => {
    vi.mocked(findDefaultRace).mockResolvedValueOnce(DEFAULT_RACE);
    vi.mocked(findDefaultClass).mockResolvedValueOnce(DEFAULT_CLASS);
    vi.mocked(createOrUpdateMetaCharacter).mockResolvedValueOnce({
      ...MOCK_META_ROW,
      raceId: DEFAULT_RACE.id,
      classId: DEFAULT_CLASS.id,
    });

    const result = await service.createFromTutorial({ userId: "user-1", username: "Héros" });

    expect(result.raceName).toBe("Humain");
    expect(result.className).toBe("Aventurier");
  });

  it("upserts (does not throw) when called twice for same user (AC #8)", async () => {
    vi.mocked(findDefaultRace).mockResolvedValue(DEFAULT_RACE);
    vi.mocked(findDefaultClass).mockResolvedValue(DEFAULT_CLASS);
    vi.mocked(createOrUpdateMetaCharacter).mockResolvedValue(MOCK_META_ROW);

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
    vi.mocked(getMetaCharacterByUserId).mockResolvedValueOnce(null);

    const result = await service.getByUserId("user-1");

    expect(result).toBeNull();
  });

  it("returns MetaCharacterDTO with resolved race/class names (AC #10)", async () => {
    vi.mocked(getMetaCharacterByUserId).mockResolvedValueOnce(MOCK_META_ROW);
    vi.mocked(getRaceById).mockResolvedValueOnce(MOCK_RACE);
    vi.mocked(getClassById).mockResolvedValueOnce(MOCK_CLASS);

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
    vi.mocked(getMetaCharacterByUserId).mockResolvedValueOnce(rowNoLinks);

    const result = await service.getByUserId("user-1");

    expect(result!.raceId).toBeUndefined();
    expect(result!.classId).toBeUndefined();
    expect(result!.raceName).toBeUndefined();
    expect(result!.className).toBeUndefined();
  });
});
