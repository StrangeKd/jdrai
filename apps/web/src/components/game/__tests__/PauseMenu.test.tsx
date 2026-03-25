/**
 * PauseMenu tests — Story 6.5 Task 8
 * AC: #4 — renders when open; closes on backdrop click; save button calls onSave; Paramètres MJ is disabled
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PauseMenu } from "../PauseMenu";

afterEach(cleanup);

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
  onHistory: vi.fn(),
  onQuit: vi.fn(),
  lastSavedAt: null,
  isSaving: false,
};

describe("PauseMenu", () => {
  it("renders nothing when isOpen=false", () => {
    const { container } = render(<PauseMenu {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the pause menu overlay when isOpen=true", () => {
    render(<PauseMenu {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/PAUSE/)).toBeDefined();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<PauseMenu {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does NOT call onClose when the card itself is clicked", () => {
    const onClose = vi.fn();
    render(<PauseMenu {...defaultProps} onClose={onClose} />);
    // Click the heading inside the card — should not propagate to backdrop
    fireEvent.click(screen.getByText(/PAUSE/));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("save button calls onSave", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PauseMenu {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByText(/Sauvegarder/));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("save button shows loading state when isSaving=true", () => {
    render(<PauseMenu {...defaultProps} isSaving={true} />);
    expect(screen.getByText(/Sauvegarde\.\.\./)).toBeDefined();
  });

  it("save button is disabled when isSaving=true", () => {
    render(<PauseMenu {...defaultProps} isSaving={true} />);
    const saveBtn = screen.getByText(/Sauvegarde\.\.\./).closest("button");
    expect(saveBtn?.disabled).toBe(true);
  });

  it("Paramètres MJ button is disabled (P1 stub)", () => {
    render(<PauseMenu {...defaultProps} />);
    const paramBtn = screen.getByText(/Paramètres MJ/).closest("button");
    expect(paramBtn?.disabled).toBe(true);
    expect(paramBtn?.getAttribute("aria-disabled")).toBe("true");
  });

  it("Reprendre button calls onClose", () => {
    const onClose = vi.fn();
    render(<PauseMenu {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Reprendre"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows 'jamais' when lastSavedAt is null", () => {
    render(<PauseMenu {...defaultProps} lastSavedAt={null} />);
    expect(screen.getByText(/jamais/)).toBeDefined();
  });

  it("shows relative time when lastSavedAt is set", () => {
    // 5 minutes ago
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    render(<PauseMenu {...defaultProps} lastSavedAt={fiveMinAgo} />);
    expect(screen.getByText(/il y a 5 min/)).toBeDefined();
  });
});
