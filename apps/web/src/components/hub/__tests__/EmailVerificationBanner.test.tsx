import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// Mock authClient
const mockSendVerificationEmail = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  },
}));

import { EmailVerificationBanner } from "../EmailVerificationBanner";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mockToastSuccess.mockClear();
  mockToastError.mockClear();
  localStorage.clear();
});

describe("EmailVerificationBanner (AC-1, AC-4, AC-7)", () => {
  beforeEach(() => {
    mockSendVerificationEmail.mockClear();
  });

  it("renders banner with correct text (AC-1)", () => {
    render(<EmailVerificationBanner email="test@example.com" />);
    expect(screen.getByText(/Vérifiez votre email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Renvoyer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("dismiss hides the banner (AC-4)", () => {
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByText(/Vérifiez votre email/i)).not.toBeInTheDocument();
  });

  it("shows a success toast on successful resend (AC-7)", async () => {
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: null });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Email envoyé !", { duration: 3000 });
    });
    // No inline success text (toast-only UX)
    expect(screen.queryByText("Email envoyé !")).not.toBeInTheDocument();
  });

  it("shows an error toast on resend error (AC-7)", async () => {
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: { message: "fail" } });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Échec de l'envoi. Réessayez.", { duration: 3000 });
    });
  });

  it("passes email and callbackURL to sendVerificationEmail (AC-7)", async () => {
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: null });
    render(<EmailVerificationBanner email="user@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));
    await waitFor(() => {
      expect(mockSendVerificationEmail).toHaveBeenCalledWith({
        email: "user@example.com",
        callbackURL: "/hub",
      });
    });
  });

  it("waits 2s before switching to countdown label (AC-4)", async () => {
    vi.useFakeTimers();
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: null });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));

    // Flush microtasks (promise resolution)
    await act(async () => {
      await Promise.resolve();
    });

    // For 2s, label stays as "Renvoyer" (toast-only UX)
    expect(screen.getByRole("button", { name: "Renvoyer" })).toBeDisabled();

    // Advance 2s — countdown label should appear
    await act(async () => {
      vi.advanceTimersByTime(2001);
    });

    expect(screen.getByText(/Renvoyer \(\d+s\)/)).toBeInTheDocument();
  });

  it("disables resend button during cooldown (AC-4)", async () => {
    vi.useFakeTimers();
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: null });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));

    // Flush microtasks
    await act(async () => {
      await Promise.resolve();
    });

    // Advance into the countdown phase
    await act(async () => {
      vi.advanceTimersByTime(2001);
    });

    const btn = screen.getByRole("button", { name: /Renvoyer/ });
    expect(btn).toBeDisabled();
  });
});
