import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const manualSaveMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const sendActionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const confirmExitMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const closeExitModalMock = vi.hoisted(() => vi.fn());
const openExitModalMock = vi.hoisted(() => vi.fn());
const blockerProceedMock = vi.hoisted(() => vi.fn());
const blockerResetMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const exitGameSessionMock = vi.hoisted(() => vi.fn());
const testState = vi.hoisted(() => ({
  blockerStatus: "idle" as "idle" | "blocked",
  isExitModalOpen: false,
  isAdventureComplete: false,
  isGameOver: false,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    (_path: string) =>
    (opts: unknown): unknown => ({
      ...(opts as object),
      useParams: () => ({ id: "adv-1" }),
    }),
  useRouterState: ({ select }: { select: (s: { location: { state: unknown } }) => unknown }) =>
    select({ location: { state: {} } }),
  useNavigate: () => navigateMock,
  useBlocker: () => ({
    status: testState.blockerStatus,
    proceed: blockerProceedMock,
    reset: blockerResetMock,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/components/game/SessionHeader", () => ({
  SessionHeader: ({ onPauseMenuOpen }: { onPauseMenuOpen: () => void }) => (
    <button type="button" onClick={onPauseMenuOpen}>
      open pause
    </button>
  ),
}));

vi.mock("@/components/game/CharacterPanel", () => ({
  CharacterPanel: () => <div>character-panel</div>,
}));

vi.mock("@/components/game/NarrationPanel", () => ({
  NarrationPanel: () => <div>narration-panel</div>,
}));

vi.mock("@/components/game/FreeInput", () => ({
  FreeInput: ({ onSubmit }: { onSubmit: (value: string) => void }) => (
    <button type="button" onClick={() => onSubmit("hello")}>
      submit
    </button>
  ),
}));

vi.mock("@/components/game/HistoryDrawer", () => ({
  HistoryDrawer: () => <div data-testid="history-drawer" />,
}));

vi.mock("@/components/game/MilestoneOverlay", () => ({
  MilestoneOverlay: () => null,
}));

vi.mock("@/components/game/IntroSession", () => ({
  IntroSession: () => null,
}));

vi.mock("@/components/game/ExitConfirmModal", () => ({
  ExitConfirmModal: ({
    isOpen,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div data-testid="exit-modal">
        <button type="button" onClick={onConfirm}>
          confirm-exit
        </button>
        <button type="button" onClick={onCancel}>
          cancel-exit
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/game/PauseMenu", () => ({
  PauseMenu: ({
    isOpen,
    onClose,
    onSave,
    onHistory,
    onQuit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    onHistory: () => void;
    onQuit: () => void;
  }) => (
    <div>
      <span data-testid="pause-state">{isOpen ? "open" : "closed"}</span>
      {isOpen && (
        <>
          <button type="button" onClick={() => void onSave()}>
            save
          </button>
          <button type="button" onClick={onHistory}>
            history
          </button>
          <button type="button" onClick={onQuit}>
            quit
          </button>
          <button type="button" onClick={onClose}>
            close
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock("@/hooks/useGameSession", async () => {
  const React = await import("react");
  return {
    useGameSession: () => {
      const [isPauseMenuOpen, setIsPauseMenuOpen] = React.useState(false);
      return {
        gameState: {
          adventure: {
            title: "Test Adventure",
            character: { id: "c1", name: "Aldric", className: "Aventurier" },
          },
        },
        currentScene: "Scene",
        streamingBuffer: "",
        playerEcho: null,
        choices: [],
        isLoading: false,
        isStreaming: false,
        gameError: null,
        sendAction: sendActionMock,
        currentHp: 18,
        maxHp: 20,
        lastSavedAt: null,
        showAutosaveIndicator: false,
        isPauseMenuOpen,
        isAdventureComplete: testState.isAdventureComplete,
        isGameOver: testState.isGameOver,
        openPauseMenu: () => setIsPauseMenuOpen(true),
        closePauseMenu: () => setIsPauseMenuOpen(false),
        manualSave: manualSaveMock,
        // Story 6.6
        showMilestoneOverlay: false,
        milestoneOverlayName: null,
        isHistoryDrawerOpen: false,
        isFirstLaunch: false,
        openHistoryDrawer: vi.fn(),
        closeHistoryDrawer: vi.fn(),
        dismissIntro: vi.fn(),
        // Story 6.7
        isInGameSession: true,
        isExitModalOpen: testState.isExitModalOpen,
        openExitModal: openExitModalMock,
        closeExitModal: closeExitModalMock,
        isConfirmingExit: false,
        confirmExit: confirmExitMock,
        // Story 6.8 — Resilience
        isRateLimited: false,
        rateLimitCountdown: 0,
        isDisconnected: false,
        connectionFailed: false,
        manualReconnect: vi.fn(),
        hasLLMError: false,
        retryLastAction: vi.fn(),
        isLocked: false,
        // Story 7.2
        exitGameSession: exitGameSessionMock,
      };
    },
  };
});

import { GameSessionPage } from "../$id";

describe("GameSessionPage pause menu wiring", () => {
  beforeEach(() => {
    manualSaveMock.mockClear();
    sendActionMock.mockClear();
    confirmExitMock.mockClear();
    closeExitModalMock.mockClear();
    openExitModalMock.mockClear();
    blockerProceedMock.mockClear();
    blockerResetMock.mockClear();
    navigateMock.mockClear();
    exitGameSessionMock.mockClear();
    testState.blockerStatus = "idle";
    testState.isExitModalOpen = false;
    testState.isAdventureComplete = false;
    testState.isGameOver = false;
  });

  afterEach(() => {
    cleanup();
  });

  it("toggles pause menu with Escape key", () => {
    render(<GameSessionPage />);
    expect(screen.getByTestId("pause-state")).toHaveTextContent("closed");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("pause-state")).toHaveTextContent("open");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("pause-state")).toHaveTextContent("closed");
  });

  it("wires save action from PauseMenu to manualSave()", async () => {
    render(<GameSessionPage />);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(manualSaveMock).toHaveBeenCalledTimes(1);
    });
  });

  it("does not toggle pause menu with Escape when exit confirmation modal is open", () => {
    testState.isExitModalOpen = true;
    render(<GameSessionPage />);
    expect(screen.getByTestId("pause-state")).toHaveTextContent("closed");
    expect(screen.getByTestId("exit-modal")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("pause-state")).toHaveTextContent("closed");
  });

  it("calls confirmExit with blocker.proceed callback when navigation is blocked", async () => {
    testState.blockerStatus = "blocked";
    confirmExitMock.mockImplementation(async (onNavigate?: () => void) => {
      onNavigate?.();
    });

    render(<GameSessionPage />);
    fireEvent.click(screen.getByRole("button", { name: "confirm-exit" }));

    await waitFor(() => {
      expect(confirmExitMock).toHaveBeenCalledTimes(1);
      expect(blockerProceedMock).toHaveBeenCalledTimes(1);
    });
  });

  it("resets blocker and closes modal on exit cancel when navigation is blocked", () => {
    testState.blockerStatus = "blocked";
    render(<GameSessionPage />);

    fireEvent.click(screen.getByRole("button", { name: "cancel-exit" }));
    expect(blockerResetMock).toHaveBeenCalledTimes(1);
    expect(closeExitModalMock).toHaveBeenCalledTimes(1);
  });
});

describe("GameSessionPage — Story 7.2 navigation to E11", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    exitGameSessionMock.mockClear();
    testState.isAdventureComplete = false;
    testState.isGameOver = false;
  });

  afterEach(cleanup);

  it("calls exitGameSession then navigate to /summary when isAdventureComplete=true (AC #2)", async () => {
    testState.isAdventureComplete = true;
    render(<GameSessionPage />);

    await waitFor(() => {
      expect(exitGameSessionMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "/adventure/$id/summary",
          params: { id: "adv-1" },
          state: { fromGameSession: true },
        }),
      );
    });
  });

  it("calls exitGameSession then navigate to /summary when isGameOver=true (AC #2)", async () => {
    testState.isGameOver = true;
    render(<GameSessionPage />);

    await waitFor(() => {
      expect(exitGameSessionMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "/adventure/$id/summary",
          params: { id: "adv-1" },
          state: { fromGameSession: true },
        }),
      );
    });
  });
});
