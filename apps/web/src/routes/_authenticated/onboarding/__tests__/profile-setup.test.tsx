import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
}));

// Mock useUpdateProfile hook
const mockMutateAsync = vi.fn();
vi.mock("@/hooks/useUpdateProfile", () => ({
  useUpdateProfile: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Imports after mocks (required by vitest hoisting)
import { ApiError } from "@/services/api";

import { ProfileSetupPage } from "../profile-setup";

afterEach(cleanup);

describe("ProfileSetupPage — Step 1 (E6-01)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutateAsync.mockClear();
  });

  it("renders StepIndicator at step 1 (AC-2)", () => {
    render(<ProfileSetupPage />);
    expect(screen.getByLabelText(/étape 1 sur 2/i)).toBeInTheDocument();
  });

  it("renders the narrative question (AC-2)", () => {
    render(<ProfileSetupPage />);
    expect(
      screen.getByRole("heading", { name: /comment vous appelle-t-on/i }),
    ).toBeInTheDocument();
  });

  it("renders the text input with autoFocus (AC-2)", () => {
    render(<ProfileSetupPage />);
    expect(screen.getByPlaceholderText("Votre pseudo")).toBeInTheDocument();
  });

  it("renders contextual help text (AC-2)", () => {
    render(<ProfileSetupPage />);
    expect(screen.getByText(/c'est votre identité sur jdrai/i)).toBeInTheDocument();
  });

  it("CTA is disabled when input is empty (AC-3)", () => {
    render(<ProfileSetupPage />);
    expect(screen.getByRole("button", { name: /continuer/i })).toBeDisabled();
  });

  it("shows inline error for username < 3 chars (AC-3)", async () => {
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert").textContent).toContain("3");
    expect(screen.getByRole("button", { name: /continuer/i })).toBeDisabled();
  });

  it("shows inline error for username with invalid chars (AC-3)", async () => {
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "hello world" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("CTA enables when valid username is entered (AC-3)", async () => {
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "Aldric" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuer/i })).not.toBeDisabled();
    });
  });

  it("shows conflict error with suggestion on 409 USERNAME_TAKEN (AC-3)", async () => {
    mockMutateAsync.mockRejectedValue(
      new ApiError("USERNAME_TAKEN", "Username is already taken"),
    );
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "Aldric" } });
    const btn = await screen.findByRole("button", { name: /continuer/i });
    fireEvent.click(btn);
    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      const conflictAlert = alerts.find((el) =>
        el.textContent?.includes("déjà pris"),
      );
      expect(conflictAlert).toBeDefined();
    });
  });

  it("clears server error when user starts editing again (AC-3)", async () => {
    mockMutateAsync.mockRejectedValue(
      new ApiError("USERNAME_TAKEN", "Username is already taken"),
    );
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "Aldric" } });
    const btn = await screen.findByRole("button", { name: /continuer/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getAllByRole("alert").some((el) => el.textContent?.includes("déjà pris"))).toBe(true);
    });
    // User edits input → error clears
    fireEvent.change(input, { target: { value: "Aldric2" } });
    await waitFor(() => {
      const alerts = screen.queryAllByRole("alert");
      expect(alerts.every((el) => !el.textContent?.includes("déjà pris"))).toBe(true);
    });
  });

  it("transitions to step 2 on successful submit (AC-1, AC-5)", async () => {
    mockMutateAsync.mockResolvedValue({ id: "1", username: "Aldric" });
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "Aldric" } });
    const btn = await screen.findByRole("button", { name: /continuer/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByLabelText(/étape 2 sur 2/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: /aldric.*prêt/i }),
    ).toBeInTheDocument();
  });
});

describe("ProfileSetupPage — Step 2 (E6-02)", () => {
  beforeEach(async () => {
    mockNavigate.mockClear();
    mockMutateAsync.mockResolvedValue({ id: "1", username: "Aldric" });
    render(<ProfileSetupPage />);
    const input = screen.getByPlaceholderText("Votre pseudo");
    fireEvent.change(input, { target: { value: "Aldric" } });
    const btn = await screen.findByRole("button", { name: /continuer/i });
    fireEvent.click(btn);
    await waitFor(() => screen.getByLabelText(/étape 2 sur 2/i));
  });

  afterEach(cleanup);

  it("renders StepIndicator at step 2 (AC-5)", () => {
    expect(screen.getByLabelText(/étape 2 sur 2/i)).toBeInTheDocument();
  });

  it("renders personalized title with username (AC-5)", () => {
    expect(screen.getByRole("heading", { name: /aldric.*prêt/i })).toBeInTheDocument();
  });

  it("renders NarrativeBox with tutorial description (AC-5)", () => {
    expect(screen.getByText(/tutoriel/i)).toBeInTheDocument();
  });

  it("renders 'C'est parti !' CTA (AC-5)", () => {
    expect(screen.getByRole("button", { name: /c'est parti/i })).toBeInTheDocument();
  });

  it("navigates to /onboarding/tutorial on 'C'est parti !' click (AC-5)", () => {
    fireEvent.click(screen.getByRole("button", { name: /c'est parti/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/onboarding/tutorial" });
  });

  it("renders 'Passer et aller au Hub' skip link (AC-5, AC-8)", () => {
    expect(screen.getByText(/passer et aller au hub/i)).toBeInTheDocument();
  });

  it("navigates to /hub on skip click (AC-8)", () => {
    fireEvent.click(screen.getByText(/passer et aller au hub/i));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/hub" });
  });

  it("no back button present (AC-1 — linear tunnel)", () => {
    expect(screen.queryByRole("button", { name: /retour/i })).not.toBeInTheDocument();
  });
});

describe("ProfileSetupPage — Layout (AC-1, AC-5)", () => {
  it("starts at step 1 by default (AC-6)", () => {
    render(<ProfileSetupPage />);
    expect(screen.getByPlaceholderText("Votre pseudo")).toBeInTheDocument();
    expect(screen.queryByText(/passer et aller au hub/i)).not.toBeInTheDocument();
  });

  it("full-screen dark background on step 1", () => {
    const { container } = render(<ProfileSetupPage />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("min-h-screen");
    expect(root.className).toContain("bg-stone-950");
  });
});
