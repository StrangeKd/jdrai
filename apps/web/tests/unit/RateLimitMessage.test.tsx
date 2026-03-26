/**
 * RateLimitMessage tests — Story 6.8 Task 8
 *
 * Covers:
 *  - Not rendered when visible=false
 *  - Renders countdown in "m:ss" format when visible=true
 *  - Renders correctly for countdown < 60s and >= 60s
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RateLimitMessage } from "@/components/game/RateLimitMessage";

afterEach(cleanup);

describe("RateLimitMessage", () => {
  it("renders nothing when visible=false", () => {
    const { container } = render(<RateLimitMessage visible={false} countdown={30} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders thematic message with countdown when visible=true", () => {
    render(<RateLimitMessage visible={true} countdown={23} />);
    expect(screen.getByText(/Le MJ reprend son souffle/)).toBeInTheDocument();
    expect(screen.getByText(/0:23/)).toBeInTheDocument();
  });

  it("formats countdown >= 60s as m:ss", () => {
    render(<RateLimitMessage visible={true} countdown={65} />);
    expect(screen.getByText(/1:05/)).toBeInTheDocument();
  });

  it("formats countdown 0s as 0:00", () => {
    render(<RateLimitMessage visible={true} countdown={0} />);
    expect(screen.getByText(/0:00/)).toBeInTheDocument();
  });
});
