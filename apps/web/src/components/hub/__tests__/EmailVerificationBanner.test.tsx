import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("shows 'Email envoyé !' on successful resend (AC-7)", async () => {
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: null });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));
    await waitFor(() => {
      expect(screen.getByText("Email envoyé !")).toBeInTheDocument();
    });
  });

  it("shows 'Échec, réessayez.' on error (AC-7)", async () => {
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: { message: "fail" } });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));
    await waitFor(() => {
      expect(screen.getByText("Échec, réessayez.")).toBeInTheDocument();
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

  it("shows countdown after successful resend and resets to idle after 3s (AC-4)", async () => {
    vi.useFakeTimers();
    mockSendVerificationEmail.mockResolvedValue({ data: null, error: null });
    render(<EmailVerificationBanner email="test@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));

    // Flush microtasks (promise resolution)
    await act(async () => {
      await Promise.resolve();
    });

    // Should show "Email envoyé !" first
    expect(screen.getByText("Email envoyé !")).toBeInTheDocument();

    // Advance 3s — status "sent" timeout fires, reverts to countdown
    await act(async () => {
      vi.advanceTimersByTime(3001);
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

    // Advance past the "sent" message
    await act(async () => {
      vi.advanceTimersByTime(3001);
    });

    const btn = screen.getByRole("button", { name: /Renvoyer/ });
    expect(btn).toBeDisabled();
  });
});
