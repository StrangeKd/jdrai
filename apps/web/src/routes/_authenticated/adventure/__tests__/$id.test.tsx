import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const manualSaveMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const sendActionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    (_path: string) =>
    (opts: unknown): unknown => ({
      ...(opts as object),
      useParams: () => ({ id: "adv-1" }),
    }),
  useRouterState: ({ select }: { select: (s: { location: { state: unknown } }) => unknown }) =>
    select({ location: { state: {} } }),
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
        isAdventureComplete: false,
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
      };
    },
  };
});

import { GameSessionPage } from "../$id";

describe("GameSessionPage pause menu wiring", () => {
  beforeEach(() => {
    manualSaveMock.mockClear();
    sendActionMock.mockClear();
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
});
