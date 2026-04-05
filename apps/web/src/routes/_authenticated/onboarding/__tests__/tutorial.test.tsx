/**
 * TutorialPage tests — AC: #1 (Story 8.2 Task 11.1)
 *
 * Tests the tutorial route loading, creation, and "Recommencer" dialog behavior.
 * TutorialSession (game session layer) is mocked to isolate tutorial orchestration logic.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
  useBlocker: () => ({ status: "idle" }),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { state: {} } }),
}));

// Mock TanStack Query — controlled per test
const mockUseQuery = vi.fn();
const mockUseQueryClient = vi.fn(() => ({
  invalidateQueries: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { username: "Ryan", email: "ryan@test.com" } }),
}));

// Mock useGameSession — prevents socket connection in tests
vi.mock("@/hooks/useGameSession", () => ({
  useGameSession: () => ({
    gameState: null,
    currentScene: "",
    streamingBuffer: "",
    playerEcho: null,
    choices: [],
    presetSelector: undefined,
    isLoading: false,
    isStreaming: false,
    gameError: null,
    sendAction: vi.fn(),
    currentHp: 10,
    maxHp: 10,
    lastSavedAt: null,
    showAutosaveIndicator: false,
    isPauseMenuOpen: false,
    isAdventureComplete: false,
    openPauseMenu: vi.fn(),
    closePauseMenu: vi.fn(),
    manualSave: vi.fn(),
    showMilestoneOverlay: false,
    milestoneOverlayName: null,
    isHistoryDrawerOpen: false,
    isFirstLaunch: false,
    openHistoryDrawer: vi.fn(),
    closeHistoryDrawer: vi.fn(),
    dismissIntro: vi.fn(),
    isGameOver: false,
    isInGameSession: true,
    isExitModalOpen: false,
    openExitModal: vi.fn(),
    closeExitModal: vi.fn(),
    isConfirmingExit: false,
    confirmExit: vi.fn(),
    isRateLimited: false,
    rateLimitCountdown: 0,
    isDisconnected: false,
    connectionFailed: false,
    manualReconnect: vi.fn(),
    hasLLMError: false,
    retryLastAction: vi.fn(),
    isLocked: false,
    exitGameSession: vi.fn(),
  }),
}));

// Mock useTutorial
vi.mock("@/hooks/useTutorial", () => ({
  useTutorial: () => ({
    isTooltipSeen: () => false,
    dismissTooltip: vi.fn(),
    races: [],
    classes: [],
    isReferenceLoading: false,
  }),
}));

// Mock api service
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPatch = vi.fn();
vi.mock("@/services/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
  },
}));

// Mock all game components that require real DOM/socket setup
vi.mock("@/components/game/SessionHeader", () => ({
  SessionHeader: () => <div data-testid="session-header" />,
}));
vi.mock("@/components/game/CharacterPanel", () => ({
  CharacterPanel: () => null,
}));
vi.mock("@/components/game/NarrationPanel", () => ({
  NarrationPanel: () => <div data-testid="narration-panel" />,
}));
vi.mock("@/components/game/FreeInput", () => ({
  FreeInput: ({ onFocus }: { onFocus?: () => void }) => (
    <input data-testid="free-input" onFocus={onFocus} readOnly />
  ),
}));
vi.mock("@/components/game/PauseMenu", () => ({ PauseMenu: () => null }));
vi.mock("@/components/game/HistoryDrawer", () => ({ HistoryDrawer: () => null }));
vi.mock("@/components/game/MilestoneOverlay", () => ({ MilestoneOverlay: () => null }));
vi.mock("@/components/game/IntroSession", () => ({ IntroSession: () => null }));
vi.mock("@/components/game/ExitConfirmModal", () => ({ ExitConfirmModal: () => null }));

import { TutorialPage } from "../tutorial";

afterEach(cleanup);

describe("TutorialPage", () => {
  const executedQueryKeys = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
    executedQueryKeys.clear();

    // Execute each queryFn once per queryKey to simulate React Query mount behavior.
    mockUseQuery.mockImplementation((opts: {
      queryKey: unknown[];
      queryFn?: () => Promise<unknown> | unknown;
      enabled?: boolean;
    }) => {
      // meta-character query stays inert in these route orchestration tests
      if (Array.isArray(opts.queryKey) && opts.queryKey[0] === "meta-character") {
        return { data: null, isLoading: false };
      }

      const key = JSON.stringify(opts.queryKey ?? []);
      const isEnabled = opts.enabled ?? true;

      if (isEnabled && typeof opts.queryFn === "function" && !executedQueryKeys.has(key)) {
        executedQueryKeys.add(key);
        void Promise.resolve().then(() => opts.queryFn?.());
      }

      return { data: undefined, isLoading: false };
    });

    mockApiPost.mockResolvedValue({ data: { id: "adventure-123", status: "active" } });
    mockApiPatch.mockResolvedValue({ data: {} });
    mockApiGet.mockResolvedValue({ data: [] });
  });

  it("mount sans tutoriel actif -> crée une aventure tutoriel", async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<TutorialPage />);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/adventures", {
        isTutorial: true,
        difficulty: "easy",
        estimatedDuration: "short",
      }),
    );
  });

  it("mount avec tutoriel actif -> affiche la modale 'Recommencer'", async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ id: "existing-tutorial-id", isTutorial: true, status: "active" }],
    });

    render(<TutorialPage />);

    await waitFor(() =>
      expect(screen.getByText("Une aventure est déjà en cours.")).toBeInTheDocument(),
    );
    expect(screen.getByText("Recommencer")).toBeInTheDocument();
    expect(screen.getByText("Continuer là où j'en étais")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("clic 'Recommencer' -> PATCH abandoned puis POST nouvelle aventure", async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ id: "existing-id", isTutorial: true, status: "active" }],
    });

    render(<TutorialPage />);

    await waitFor(() =>
      expect(screen.getByText("Une aventure est déjà en cours.")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Recommencer"));

    await waitFor(() =>
      expect(mockApiPatch).toHaveBeenCalledWith("/api/v1/adventures/existing-id", {
        status: "abandoned",
      }),
    );

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/adventures", {
        isTutorial: true,
        difficulty: "easy",
        estimatedDuration: "short",
      }),
    );
  });
});
