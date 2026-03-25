/**
 * FreeInput tests — AC: #7, #8
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FreeInput } from "../FreeInput";

afterEach(cleanup);

describe("FreeInput", () => {
  describe("submit behavior", () => {
    it("calls onSubmit with input text when send button is clicked", () => {
      const onSubmit = vi.fn();
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={onSubmit}
          onHistoryClick={vi.fn()}
        />,
      );
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "Je frappe le gobelin" } });
      fireEvent.click(screen.getByTitle("Envoyer"));
      expect(onSubmit).toHaveBeenCalledWith("Je frappe le gobelin");
    });

    it("calls onSubmit when Enter key is pressed", () => {
      const onSubmit = vi.fn();
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={onSubmit}
          onHistoryClick={vi.fn()}
        />,
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "Je cours vers la sortie" },
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledWith("Je cours vers la sortie");
    });

    it("clears input after successful submit", () => {
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={vi.fn()}
          onHistoryClick={vi.fn()}
        />,
      );
      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Action" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(input.value).toBe("");
    });

    it("does not submit when input is empty", () => {
      const onSubmit = vi.fn();
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={onSubmit}
          onHistoryClick={vi.fn()}
        />,
      );
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("trims whitespace before submitting", () => {
      const onSubmit = vi.fn();
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={onSubmit}
          onHistoryClick={vi.fn()}
        />,
      );
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "  action  " } });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledWith("action");
    });
  });

  describe("disabled state (AC: #8)", () => {
    it("disables input and buttons when disabled=true", () => {
      render(
        <FreeInput
          disabled={true}
          isStreaming={false}
          isLoading={false}
          onSubmit={vi.fn()}
          onHistoryClick={vi.fn()}
        />,
      );
      expect(screen.getByRole("textbox")).toBeDisabled();
      expect(screen.getByTitle("Envoyer")).toBeDisabled();
      expect(screen.getByTitle("Historique")).toBeDisabled();
    });

    it("does not submit when disabled=true and Enter is pressed", () => {
      const onSubmit = vi.fn();
      render(
        <FreeInput
          disabled={true}
          isStreaming={false}
          isLoading={false}
          onSubmit={onSubmit}
          onHistoryClick={vi.fn()}
        />,
      );
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("placeholder adapts to state (AC: #8)", () => {
    it("shows default placeholder when idle", () => {
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={vi.fn()}
          onHistoryClick={vi.fn()}
        />,
      );
      expect(screen.getByPlaceholderText("Écrire votre action...")).toBeInTheDocument();
    });

    it("shows loading placeholder when isLoading=true", () => {
      render(
        <FreeInput
          disabled={true}
          isStreaming={false}
          isLoading={true}
          onSubmit={vi.fn()}
          onHistoryClick={vi.fn()}
        />,
      );
      expect(screen.getByPlaceholderText("Patientez...")).toBeInTheDocument();
    });

    it("shows streaming placeholder when isStreaming=true", () => {
      render(
        <FreeInput
          disabled={true}
          isStreaming={true}
          isLoading={false}
          onSubmit={vi.fn()}
          onHistoryClick={vi.fn()}
        />,
      );
      expect(screen.getByPlaceholderText("Le MJ raconte...")).toBeInTheDocument();
    });
  });

  describe("history button", () => {
    it("calls onHistoryClick when history button is clicked", () => {
      const onHistoryClick = vi.fn();
      render(
        <FreeInput
          disabled={false}
          isStreaming={false}
          isLoading={false}
          onSubmit={vi.fn()}
          onHistoryClick={onHistoryClick}
        />,
      );
      fireEvent.click(screen.getByTitle("Historique"));
      expect(onHistoryClick).toHaveBeenCalledTimes(1);
    });
  });
});
