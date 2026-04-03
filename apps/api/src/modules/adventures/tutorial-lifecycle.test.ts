/**
 * Tutorial lifecycle tests — Story 8.1 Task 10.3 (AC #11)
 * Verifies that abandoning a tutorial adventure performs a hard delete.
 * Mocks repository + DB.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock repository
vi.mock("./adventures.repository", () => ({
  countActiveAdventures: vi.fn(),
  createAdventure: vi.fn(),
  createAdventureCharacter: vi.fn(),
  findAdventuresByUser: vi.fn(),
  findAdventureById: vi.fn(),
  getAdventureMilestones: vi.fn(),
  updateAdventureStatus: vi.fn(),
  updateNarrativeSummary: vi.fn(),
}));

const mockDelete = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockResolvedValue(undefined);

vi.mock("@/db", () => ({
  db: {
    delete: vi.fn(() => ({ where: mockWhere })),
    select: vi.fn(),
    query: {
      users: { findFirst: vi.fn() },
      metaCharacters: { findFirst: vi.fn().mockResolvedValue(null) },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  adventures: { id: "id" },
  adventureTemplates: { isPublic: "isPublic", seedData: "seedData" },
  characterClasses: { isDefault: "isDefault" },
  races: { isDefault: "isDefault" },
  metaCharacters: { userId: "userId" },
  milestones: {},
  users: { id: "id", username: "username" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { db } from "@/db";

import { findAdventureById, updateAdventureStatus } from "./adventures.repository";
import { updateAdventureForUser } from "./adventures.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "user-tutorial";

const BASE_ROW = {
  id: "adv-tutorial",
  userId: USER_ID,
  title: "Le Premier Pas",
  status: "active" as const,
  difficulty: "easy" as const,
  estimatedDuration: "short" as const,
  tone: null,
  settings: {},
  state: {},
  startedAt: new Date(),
  lastPlayedAt: new Date(),
  completedAt: null,
  narrativeSummary: null,
  isGameOver: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  templateId: "00000000-0000-0000-0000-000000000001",
};

const CHAR_ROW = {
  id: "char-t",
  adventureId: "adv-tutorial",
  classId: "class-default",
  raceId: "race-default",
  name: "Héros",
  background: null,
  stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
  inventory: [],
  currentHp: 20,
  maxHp: 20,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tutorial abandonment — hard delete (Story 8.1 AC #11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockClear();
    mockWhere.mockClear();
  });

  it("returns null and hard-deletes tutorial adventure on abandon", async () => {
    const tutorialRow = { ...BASE_ROW, isTutorial: true };
    vi.mocked(findAdventureById).mockResolvedValueOnce({
      adventure: tutorialRow,
      character: CHAR_ROW,
      className: "Aventurier",
      raceName: "Humain",
      currentMilestoneName: null,
    });

    const result = await updateAdventureForUser(USER_ID, "adv-tutorial", "abandoned");

    expect(result).toBeNull();
    expect(db.delete).toHaveBeenCalled();
    expect(updateAdventureStatus).not.toHaveBeenCalled();
  });

  it("does NOT hard-delete a regular (non-tutorial) adventure on abandon", async () => {
    const regularRow = { ...BASE_ROW, isTutorial: false };
    const abandonedRow = { ...regularRow, status: "abandoned" as const };

    vi.mocked(findAdventureById)
      .mockResolvedValueOnce({ // pre-check
        adventure: regularRow,
        character: CHAR_ROW,
        className: "Aventurier",
        raceName: "Humain",
        currentMilestoneName: null,
      })
      .mockResolvedValueOnce({ // re-fetch after update
        adventure: abandonedRow,
        character: CHAR_ROW,
        className: "Aventurier",
        raceName: "Humain",
        currentMilestoneName: null,
      });
    vi.mocked(updateAdventureStatus).mockResolvedValueOnce(abandonedRow);

    const result = await updateAdventureForUser(USER_ID, "adv-tutorial", "abandoned");

    expect(result).not.toBeNull();
    expect(result!.status).toBe("abandoned");
    expect(db.delete).not.toHaveBeenCalled();
    expect(updateAdventureStatus).toHaveBeenCalledWith("adv-tutorial", USER_ID, "abandoned");
  });

  it("throws 404 when tutorial adventure not found", async () => {
    vi.mocked(findAdventureById).mockResolvedValueOnce(null);

    await expect(
      updateAdventureForUser(USER_ID, "nonexistent", "abandoned"),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 404, code: "NOT_FOUND" }));
  });
});
