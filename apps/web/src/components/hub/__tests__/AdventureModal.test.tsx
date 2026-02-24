import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock shadcn Dialog — avoid Radix UI portal/animation issues in jsdom
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

// Mock UIStore — controllable state
let mockAdventureModalOpen = false;
const mockSetAdventureModalOpen = vi.fn();
vi.mock("@/stores/ui.store", () => ({
  useUIStore: (selector: (s: {
    adventureModalOpen: boolean;
    setAdventureModalOpen: typeof mockSetAdventureModalOpen;
  }) => unknown) =>
    selector({
      adventureModalOpen: mockAdventureModalOpen,
      setAdventureModalOpen: mockSetAdventureModalOpen,
    }),
}));

import { AdventureModal } from "../AdventureModal";

afterEach(cleanup);

describe("AdventureModal (AC-4)", () => {
  beforeEach(() => {
    mockAdventureModalOpen = false;
    mockSetAdventureModalOpen.mockClear();
  });

  it("renders nothing when adventureModalOpen is false (AC-4)", () => {
    mockAdventureModalOpen = false;
    render(<AdventureModal />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog when adventureModalOpen is true (AC-4)", () => {
    mockAdventureModalOpen = true;
    render(<AdventureModal />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("renders the Aventure title when open (AC-4)", () => {
    mockAdventureModalOpen = true;
    render(<AdventureModal />);
    expect(screen.getByRole("heading", { name: /aventure/i })).toBeInTheDocument();
  });

  it("renders Story 4.3 placeholder content when open (AC-4)", () => {
    mockAdventureModalOpen = true;
    render(<AdventureModal />);
    expect(screen.getByText(/story 4\.3/i)).toBeInTheDocument();
  });
});
