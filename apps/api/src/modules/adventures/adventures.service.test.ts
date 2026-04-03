/**
 * Adventures service tests — business logic unit tests (Story 5.1 Task 6)
 * Mocks the repository layer and DB to test pure business logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/utils/errors";

// Mock repository
vi.mock("./adventures.repository", () => ({
  countActiveAdventures: vi.fn(),
  createAdventure: vi.fn(),
  createAdventureCharacter: vi.fn(),
  findAdventuresByUser: vi.fn(),
  findAdventureById: vi.fn(),
  updateAdventureStatus: vi.fn(),
}));

// Mock DB for characterClasses/races queries
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    query: {
      users: {
        findFirst: vi.fn(),
      },
      metaCharacters: {
        findFirst: vi.fn().mockResolvedValue(null), // no meta-character by default
      },
    },
  },
}));

import { db } from "@/db";

import {
  countActiveAdventures,
  createAdventure,
  createAdventureCharacter,
  findAdventureById,
  findAdventuresByUser,
  updateAdventureStatus,
} from "./adventures.repository";
import {
  createAdventureForUser,
  getAdventureById,
  getAdventuresForUser,
  updateAdventureForUser,
} from "./adventures.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "user-1";

// Full DB user row shape (Better Auth schema)
const MOCK_DB_USER = {
  id: USER_ID,
  name: "Ryan",
  email: "ryan@example.com",
  emailVerified: true,
  image: null as string | null,
  createdAt: new Date("2026-02-26"),
  updatedAt: new Date("2026-02-26"),
  username: "ryan" as string | null,
  role: "user" as const,
  onboardingCompleted: false,
};

const MOCK_DEFAULT_CLASS = { id: "class-default", name: "Aventurier", isDefault: true };
const MOCK_DEFAULT_RACE = { id: "race-default", name: "Humain", isDefault: true };

const MOCK_ADVENTURE_ROW = {
  id: "adv-1",
  userId: USER_ID,
  title: "Aventure sans nom",
  status: "active" as const,
  difficulty: "normal" as const,
  estimatedDuration: "medium" as const,
  tone: null,
  settings: {},
  state: {},
  startedAt: new Date("2026-02-26"),
  lastPlayedAt: new Date("2026-02-26"),
  completedAt: null,
  narrativeSummary: null,
  isGameOver: false,
  isTutorial: false,
  createdAt: new Date("2026-02-26"),
  updatedAt: new Date("2026-02-26"),
  templateId: null,
};

const MOCK_CHARACTER_ROW = {
  id: "char-1",
  adventureId: "adv-1",
  classId: "class-default",
  raceId: "race-default",
  name: "Aventurier",
  background: null,
  stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
  inventory: [],
  currentHp: 20,
  maxHp: 20,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createAdventureForUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates adventure with auto-created character using defaults (AC-3)", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(0);
    vi.mocked(createAdventure).mockResolvedValueOnce(MOCK_ADVENTURE_ROW);
    // Username fallback when no meta-character (P1)
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(MOCK_DB_USER);

    // First call: characterClasses query
    const limit1 = vi.fn().mockResolvedValue([MOCK_DEFAULT_CLASS]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    // Second call: races query
    const limit2 = vi.fn().mockResolvedValue([MOCK_DEFAULT_RACE]);
    const where2 = vi.fn().mockReturnValue({ limit: limit2 });
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: from1 } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({ from: from2 } as unknown as ReturnType<typeof db.select>);

    vi.mocked(createAdventureCharacter).mockResolvedValueOnce(MOCK_CHARACTER_ROW);

    const result = await createAdventureForUser(USER_ID, {
      difficulty: "normal",
      estimatedDuration: "medium",
    });

    expect(result.id).toBe("adv-1");
    expect(result.status).toBe("active");
    expect(result.character.className).toBe("Aventurier");
    expect(result.character.raceName).toBe("Humain");
    expect(result.character.currentHp).toBe(20);
    expect(result.character.maxHp).toBe(20);
    expect(createAdventure).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, title: "Aventure sans nom", difficulty: "normal" }),
    );
  });

  it("throws INTERNAL_ERROR when default class is missing", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(0);
    vi.mocked(createAdventure).mockResolvedValueOnce(MOCK_ADVENTURE_ROW);

    const limit1 = vi.fn().mockResolvedValue([]); // no default class
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    vi.mocked(db.select).mockReturnValueOnce({ from: from1 } as unknown as ReturnType<typeof db.select>);

    await expect(
      createAdventureForUser(USER_ID, { difficulty: "normal", estimatedDuration: "medium" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 500, code: "INTERNAL_ERROR" }));
  });

  it("throws INTERNAL_ERROR when default race is missing", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(0);
    vi.mocked(createAdventure).mockResolvedValueOnce(MOCK_ADVENTURE_ROW);

    const limit1 = vi.fn().mockResolvedValue([MOCK_DEFAULT_CLASS]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    const limit2 = vi.fn().mockResolvedValue([]); // no default race
    const where2 = vi.fn().mockReturnValue({ limit: limit2 });
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: from1 } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({ from: from2 } as unknown as ReturnType<typeof db.select>);

    await expect(
      createAdventureForUser(USER_ID, { difficulty: "normal", estimatedDuration: "medium" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 500, code: "INTERNAL_ERROR" }));
  });

  it("uses provided title when given (AC-3)", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(2);
    vi.mocked(createAdventure).mockResolvedValueOnce({
      ...MOCK_ADVENTURE_ROW,
      title: "Ma quête épique",
    });
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(MOCK_DB_USER);

    const limit1 = vi.fn().mockResolvedValue([MOCK_DEFAULT_CLASS]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });
    const limit2 = vi.fn().mockResolvedValue([MOCK_DEFAULT_RACE]);
    const where2 = vi.fn().mockReturnValue({ limit: limit2 });
    const from2 = vi.fn().mockReturnValue({ where: where2 });
    vi.mocked(db.select)
      .mockReturnValueOnce({ from: from1 } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({ from: from2 } as unknown as ReturnType<typeof db.select>);
    vi.mocked(createAdventureCharacter).mockResolvedValueOnce(MOCK_CHARACTER_ROW);

    await createAdventureForUser(USER_ID, {
      title: "Ma quête épique",
      difficulty: "hard",
      estimatedDuration: "long",
    });

    expect(createAdventure).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Ma quête épique" }),
    );
  });

  it("throws 409 MAX_ACTIVE_ADVENTURES when limit reached (AC-3)", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(5);

    await expect(
      createAdventureForUser(USER_ID, { difficulty: "normal", estimatedDuration: "medium" }),
    ).rejects.toThrow(
      expect.objectContaining({ statusCode: 409, code: "MAX_ACTIVE_ADVENTURES" }),
    );

    expect(createAdventure).not.toHaveBeenCalled();
  });

  it("title defaults to 'Aventure sans nom' when absent or blank (AC-3)", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(0);
    vi.mocked(createAdventure).mockResolvedValueOnce(MOCK_ADVENTURE_ROW);
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(MOCK_DB_USER);

    const limit1 = vi.fn().mockResolvedValue([MOCK_DEFAULT_CLASS]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });
    const limit2 = vi.fn().mockResolvedValue([MOCK_DEFAULT_RACE]);
    const where2 = vi.fn().mockReturnValue({ limit: limit2 });
    const from2 = vi.fn().mockReturnValue({ where: where2 });
    vi.mocked(db.select)
      .mockReturnValueOnce({ from: from1 } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({ from: from2 } as unknown as ReturnType<typeof db.select>);
    vi.mocked(createAdventureCharacter).mockResolvedValueOnce(MOCK_CHARACTER_ROW);

    await createAdventureForUser(USER_ID, { difficulty: "easy", estimatedDuration: "short" });

    expect(createAdventure).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Aventure sans nom" }),
    );
  });
});

describe("getAdventuresForUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mapped DTOs from repository rows (AC-4)", async () => {
    vi.mocked(findAdventuresByUser).mockResolvedValueOnce([
      {
        adventure: MOCK_ADVENTURE_ROW,
        character: MOCK_CHARACTER_ROW,
        className: "Aventurier",
        raceName: "Humain",
        currentMilestoneName: "L'Entrée",
      },
    ]);

    const result = await getAdventuresForUser(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0]!.currentMilestone).toBe("L'Entrée");
    expect(result[0]!.character.className).toBe("Aventurier");
    expect(findAdventuresByUser).toHaveBeenCalledWith(USER_ID, undefined);
  });

  it("passes valid status filter to repository (AC-4)", async () => {
    vi.mocked(findAdventuresByUser).mockResolvedValueOnce([]);

    await getAdventuresForUser(USER_ID, "active");
    expect(findAdventuresByUser).toHaveBeenCalledWith(USER_ID, "active");
  });

  it("ignores invalid status filter (AC-4)", async () => {
    vi.mocked(findAdventuresByUser).mockResolvedValueOnce([]);

    await getAdventuresForUser(USER_ID, "invalid_status");
    expect(findAdventuresByUser).toHaveBeenCalledWith(USER_ID, undefined);
  });
});

describe("getAdventureById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns DTO when adventure found (AC-5)", async () => {
    vi.mocked(findAdventureById).mockResolvedValueOnce({
      adventure: MOCK_ADVENTURE_ROW,
      character: MOCK_CHARACTER_ROW,
      className: "Aventurier",
      raceName: "Humain",
      currentMilestoneName: "Chapitre 1",
    });

    const result = await getAdventureById("adv-1", USER_ID);

    expect(result.id).toBe("adv-1");
    expect(result.currentMilestone).toBe("Chapitre 1");
  });

  it("throws 404 NOT_FOUND when adventure not found or belongs to another user (AC-5)", async () => {
    vi.mocked(findAdventureById).mockResolvedValueOnce(null);

    await expect(getAdventureById("adv-other", USER_ID)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404, code: "NOT_FOUND" }),
    );
  });
});

describe("currentMilestone derivation", () => {
  it("sets currentMilestone to null when no active milestone (AC-4, AC-5)", async () => {
    vi.mocked(findAdventuresByUser).mockResolvedValueOnce([
      {
        adventure: MOCK_ADVENTURE_ROW,
        character: MOCK_CHARACTER_ROW,
        className: "Aventurier",
        raceName: "Humain",
        currentMilestoneName: null, // no active milestone yet
      },
    ]);

    const result = await getAdventuresForUser(USER_ID);
    expect(result[0]!.currentMilestone).toBeNull();
  });
});

describe("updateAdventureForUser (Story 5.2 AC-6)", () => {
  beforeEach(() => vi.clearAllMocks());

  const ACTIVE_FULL_ROW = {
    adventure: MOCK_ADVENTURE_ROW,
    character: MOCK_CHARACTER_ROW,
    className: "Aventurier",
    raceName: "Humain",
    currentMilestoneName: null,
  };

  const ABANDONED_ROW = { ...MOCK_ADVENTURE_ROW, status: "abandoned" as const };
  const ABANDONED_FULL_ROW = {
    adventure: ABANDONED_ROW,
    character: MOCK_CHARACTER_ROW,
    className: "Aventurier",
    raceName: "Humain",
    currentMilestoneName: null,
  };

  it("marks adventure as abandoned and returns updated DTO", async () => {
    // findAdventureById called twice: pre-check then re-fetch after update
    vi.mocked(findAdventureById)
      .mockResolvedValueOnce(ACTIVE_FULL_ROW) // pre-check (isTutorial: false → no delete)
      .mockResolvedValueOnce(ABANDONED_FULL_ROW); // re-fetch after updateAdventureStatus
    vi.mocked(updateAdventureStatus).mockResolvedValueOnce(ABANDONED_ROW);

    const result = await updateAdventureForUser(USER_ID, "adv-1", "abandoned");

    expect(result!.status).toBe("abandoned");
    expect(updateAdventureStatus).toHaveBeenCalledWith("adv-1", USER_ID, "abandoned");
    expect(findAdventureById).toHaveBeenCalledWith("adv-1", USER_ID);
  });

  it("throws 404 NOT_FOUND when adventure does not exist or belongs to another user", async () => {
    // Pre-check returns null → 404 thrown before updateAdventureStatus is called
    vi.mocked(findAdventureById).mockResolvedValueOnce(null);

    await expect(updateAdventureForUser(USER_ID, "adv-other", "abandoned")).rejects.toThrow(
      expect.objectContaining({ statusCode: 404, code: "NOT_FOUND" }),
    );

    expect(updateAdventureStatus).not.toHaveBeenCalled();
  });
});

describe("AppError type", () => {
  it("MAX_ACTIVE_ADVENTURES is an AppError instance", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(5);

    await expect(
      createAdventureForUser(USER_ID, { difficulty: "easy", estimatedDuration: "short" }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
