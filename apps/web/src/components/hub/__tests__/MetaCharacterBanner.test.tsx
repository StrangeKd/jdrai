import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { UserDTO } from "@jdrai/shared";

import { MetaCharacterBanner, MetaCharacterBannerSkeleton } from "../MetaCharacterBanner";

afterEach(cleanup);

const mockUser: UserDTO = {
  id: "u1",
  email: "test@example.com",
  username: "Ragnar",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

describe("MetaCharacterBanner (AC-2)", () => {
  it("shows skeleton when loading (AC-7)", () => {
    const { container } = render(<MetaCharacterBanner user={undefined} isLoading={true} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("Apprenti aventurier")).not.toBeInTheDocument();
  });

  it("shows username when loaded (AC-2)", () => {
    render(<MetaCharacterBanner user={mockUser} isLoading={false} />);
    expect(screen.getByText("Ragnar")).toBeInTheDocument();
  });

  it("shows email fallback when username is null (AC-2)", () => {
    render(
      <MetaCharacterBanner
        user={{ ...mockUser, username: null }}
        isLoading={false}
      />,
    );
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows static title 'Apprenti aventurier' (AC-2)", () => {
    render(<MetaCharacterBanner user={mockUser} isLoading={false} />);
    expect(screen.getByText("Apprenti aventurier")).toBeInTheDocument();
  });

  it("shows 'Niv. 1' XP placeholder (AC-2)", () => {
    render(<MetaCharacterBanner user={mockUser} isLoading={false} />);
    expect(screen.getByText("Niv. 1")).toBeInTheDocument();
  });

  it("shows avatar placeholder emoji (AC-2)", () => {
    render(<MetaCharacterBanner user={mockUser} isLoading={false} />);
    expect(screen.getByLabelText("Avatar")).toBeInTheDocument();
  });
});

describe("MetaCharacterBannerSkeleton", () => {
  it("renders pulse animation elements", () => {
    const { container } = render(<MetaCharacterBannerSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
