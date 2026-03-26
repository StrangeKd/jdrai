/**
 * FreeInput tests — AC: #7, #8 (Story 6.4) + Story 6.8 resilience props
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FreeInput } from "../FreeInput";

afterEach(cleanup);

// Default idle props — covers the common case; override per test for specific states
const idleProps = {
  disabled: false,
  isStreaming: false,
  isLoading: false,
  isRateLimited: false,
  rateLimitCountdown: 0,
  isDisconnected: false,
  onSubmit: vi.fn(),
  onHistoryClick: vi.fn(),
} as const;

describe("FreeInput", () => {
  describe("submit behavior", () => {
    it("calls onSubmit with input text when send button is clicked", () => {
      const onSubmit = vi.fn();
      render(<FreeInput {...idleProps} onSubmit={onSubmit} />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "Je frappe le gobelin" } });
      fireEvent.click(screen.getByTitle("Envoyer"));
      expect(onSubmit).toHaveBeenCalledWith("Je frappe le gobelin");
    });

    it("calls onSubmit when Enter key is pressed", () => {
      const onSubmit = vi.fn();
      render(<FreeInput {...idleProps} onSubmit={onSubmit} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "Je cours vers la sortie" },
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledWith("Je cours vers la sortie");
    });

    it("clears input after successful submit", () => {
      render(<FreeInput {...idleProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Action" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(input.value).toBe("");
    });

    it("does not submit when input is empty", () => {
      const onSubmit = vi.fn();
      render(<FreeInput {...idleProps} onSubmit={onSubmit} />);
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("trims whitespace before submitting", () => {
      const onSubmit = vi.fn();
      render(<FreeInput {...idleProps} onSubmit={onSubmit} />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "  action  " } });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledWith("action");
    });
  });

  describe("disabled state (AC: #8)", () => {
    it("disables input and buttons when disabled=true", () => {
      render(<FreeInput {...idleProps} disabled={true} />);
      expect(screen.getByRole("textbox")).toBeDisabled();
      expect(screen.getByTitle("Envoyer")).toBeDisabled();
      expect(screen.getByTitle("Historique")).toBeDisabled();
    });

    it("does not submit when disabled=true and Enter is pressed", () => {
      const onSubmit = vi.fn();
      render(<FreeInput {...idleProps} disabled={true} onSubmit={onSubmit} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("placeholder adapts to state (AC: #8 + Story 6.8)", () => {
    it("shows default placeholder when idle", () => {
      render(<FreeInput {...idleProps} />);
      expect(screen.getByPlaceholderText("Écrire votre action...")).toBeInTheDocument();
    });

    it("shows loading placeholder when isLoading=true", () => {
      render(<FreeInput {...idleProps} disabled={true} isLoading={true} />);
      expect(screen.getByPlaceholderText("Patientez...")).toBeInTheDocument();
    });

    it("shows streaming placeholder when isStreaming=true", () => {
      render(<FreeInput {...idleProps} disabled={true} isStreaming={true} />);
      expect(screen.getByPlaceholderText("Le MJ raconte...")).toBeInTheDocument();
    });

    it("shows reconnecting placeholder when isDisconnected=true (Story 6.8)", () => {
      render(<FreeInput {...idleProps} disabled={true} isDisconnected={true} />);
      expect(screen.getByPlaceholderText("Reconnexion... ░░░")).toBeInTheDocument();
    });

    it("shows rate-limit placeholder with countdown when isRateLimited=true (Story 6.8)", () => {
      render(
        <FreeInput {...idleProps} disabled={true} isRateLimited={true} rateLimitCountdown={23} />,
      );
      expect(screen.getByPlaceholderText(/Patientez.*0:23/)).toBeInTheDocument();
    });
  });

  describe("send button icon (Story 6.8 AC: #1)", () => {
    it("shows ➤ icon when not rate-limited", () => {
      render(<FreeInput {...idleProps} />);
      expect(screen.getByTitle("Envoyer").textContent).toBe("➤");
    });

    it("shows 🔒 icon when rate-limited", () => {
      render(<FreeInput {...idleProps} disabled={true} isRateLimited={true} rateLimitCountdown={10} />);
      expect(screen.getByTitle("Envoyer").textContent).toBe("🔒");
    });
  });

  describe("history button", () => {
    it("calls onHistoryClick when history button is clicked", () => {
      const onHistoryClick = vi.fn();
      render(<FreeInput {...idleProps} onHistoryClick={onHistoryClick} />);
      fireEvent.click(screen.getByTitle("Historique"));
      expect(onHistoryClick).toHaveBeenCalledTimes(1);
    });
  });
});
