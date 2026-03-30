/**
 * Slot management tests — Story 7.1 AC #6
 * Verifies that abandoning an adventure frees a slot for a new one.
 * Uses mocked repository layer (unit test).
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
  getAdventureMilestones: vi.fn(),
  updateAdventureStatus: vi.fn(),
  updateNarrativeSummary: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    query: {
      users: { findFirst: vi.fn() },
    },
  },
}));

import { db } from "@/db";

import {
  countActiveAdventures,
  createAdventure,
  createAdventureCharacter,
  findAdventureById,
  updateAdventureStatus,
} from "./adventures.repository";
import { createAdventureForUser, updateAdventureForUser } from "./adventures.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "slot-test-user";

const MOCK_ADVENTURE_ROW = {
  id: "adv-1",
  userId: USER_ID,
  title: "Aventure 1",
  status: "active" as const,
  difficulty: "normal" as const,
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

const MOCK_DEFAULT_CLASS = { id: "class-default", name: "Aventurier", isDefault: true };
const MOCK_DEFAULT_RACE = { id: "race-default", name: "Humain", isDefault: true };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Slot management — 5-adventure limit (Story 7.1 AC #6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("user with 5 active adventures → POST /adventures → 409 MAX_ACTIVE_ADVENTURES", async () => {
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(5);

    await expect(
      createAdventureForUser(USER_ID, { difficulty: "normal", estimatedDuration: "short" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 409, code: "MAX_ACTIVE_ADVENTURES" }));

    expect(createAdventure).not.toHaveBeenCalled();
  });

  it("after abandoning one adventure, a new POST /adventures succeeds (AC #6)", async () => {
    // Step 1: abandon an adventure (slot freed)
    const abandonedRow = { ...MOCK_ADVENTURE_ROW, status: "abandoned" as const };
    vi.mocked(updateAdventureStatus).mockResolvedValueOnce(abandonedRow);
    vi.mocked(findAdventureById).mockResolvedValueOnce({
      adventure: abandonedRow,
      character: MOCK_CHARACTER_ROW,
      className: "Aventurier",
      raceName: "Humain",
      currentMilestoneName: null,
    });

    const abandonResult = await updateAdventureForUser(USER_ID, "adv-1", "abandoned");
    expect(abandonResult.status).toBe("abandoned");

    // Step 2: now count = 4 (one was abandoned) → POST succeeds
    vi.mocked(countActiveAdventures).mockResolvedValueOnce(4);
    vi.mocked(createAdventure).mockResolvedValueOnce(MOCK_ADVENTURE_ROW);
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
      id: USER_ID, name: "Ryan", email: "ryan@test.local", emailVerified: false,
      image: null, createdAt: new Date(), updatedAt: new Date(),
      username: "ryan", role: "user" as const, onboardingCompleted: false,
    });

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

    const newAdventure = await createAdventureForUser(USER_ID, {
      difficulty: "normal",
      estimatedDuration: "short",
    });

    expect(newAdventure.status).toBe("active");
    expect(createAdventure).toHaveBeenCalledTimes(1);
  });

  it("transition from active → abandoned succeeds (valid transition)", async () => {
    const abandonedRow = { ...MOCK_ADVENTURE_ROW, status: "abandoned" as const };
    vi.mocked(updateAdventureStatus).mockResolvedValueOnce(abandonedRow);
    vi.mocked(findAdventureById).mockResolvedValueOnce({
      adventure: abandonedRow,
      character: MOCK_CHARACTER_ROW,
      className: "Aventurier",
      raceName: "Humain",
      currentMilestoneName: null,
    });

    const result = await updateAdventureForUser(USER_ID, "adv-1", "abandoned");
    expect(result.status).toBe("abandoned");
    expect(updateAdventureStatus).toHaveBeenCalledWith("adv-1", USER_ID, "abandoned");
  });

  it("INVALID_TRANSITION: abandoned → anything → 400 (AC #1)", async () => {
    vi.mocked(updateAdventureStatus).mockRejectedValueOnce(
      new AppError(400, "INVALID_TRANSITION", 'Cannot transition from "abandoned" to "completed"'),
    );

    await expect(
      updateAdventureForUser(USER_ID, "adv-1", "completed"),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400, code: "INVALID_TRANSITION" }));
  });
});
