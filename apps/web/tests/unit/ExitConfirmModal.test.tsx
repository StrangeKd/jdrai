/**
 * ExitConfirmModal tests — Story 6.7 Task 4
 *
 * Covers:
 *  - Renders when isOpen=true; does not render when isOpen=false
 *  - Calls onConfirm on "Quitter" click
 *  - Calls onCancel on "Rester" click
 *  - Does not dismiss on backdrop click (no onClick handler)
 *  - Shows loading state ("Sauvegarde en cours...") when isConfirming=true
 *  - Displays last save info when lastSavedAt is provided
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExitConfirmModal } from "@/components/game/ExitConfirmModal";

afterEach(cleanup);

const defaultProps = {
  isOpen: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  lastSavedAt: null,
  isConfirming: false,
};

describe("ExitConfirmModal", () => {
  it("renders when isOpen=true", () => {
    render(<ExitConfirmModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quitter l'aventure ?")).toBeInTheDocument();
    expect(
      screen.getByText(/Votre progression est sauvegardée/),
    ).toBeInTheDocument();
  });

  it("does not render when isOpen=false", () => {
    render(<ExitConfirmModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it('calls onConfirm when "Quitter" is clicked', () => {
    const onConfirm = vi.fn();
    render(<ExitConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: /Quitter/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when "Rester" is clicked', () => {
    const onCancel = vi.fn();
    render(<ExitConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /Rester/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not dismiss on backdrop click (no onClick handler on overlay)", () => {
    const onCancel = vi.fn();
    render(<ExitConfirmModal {...defaultProps} onCancel={onCancel} />);

    // Click on the dialog element directly (backdrop area)
    fireEvent.click(screen.getByRole("dialog"));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows "Sauvegarde en cours..." and disables buttons when isConfirming=true', () => {
    render(<ExitConfirmModal {...defaultProps} isConfirming={true} />);

    expect(screen.getByText("Sauvegarde en cours...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sauvegarde en cours/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Rester/i })).toBeDisabled();
  });

  it("displays last save info when lastSavedAt is provided", () => {
    const lastSavedAt = new Date(Date.now() - 30000); // 30s ago → "à l'instant"
    render(<ExitConfirmModal {...defaultProps} lastSavedAt={lastSavedAt} />);

    expect(screen.getByText(/Dernière sauvegarde/)).toBeInTheDocument();
  });

  it("does not display last save info when lastSavedAt is null", () => {
    render(<ExitConfirmModal {...defaultProps} lastSavedAt={null} />);

    expect(screen.queryByText(/Dernière sauvegarde/)).not.toBeInTheDocument();
  });
});
