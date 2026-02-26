import { describe, expect, it } from "vitest";

import {
  buildFindAdventureByIdQuery,
  buildFindAdventuresByUserQuery,
} from "./adventures.repository";

describe("adventures.repository query builders", () => {
  it("buildFindAdventuresByUserQuery includes LEFT JOIN milestone(active) + order by lastPlayedAt desc", () => {
    const { sql, params } = buildFindAdventuresByUserQuery("user-1").toSQL();

    expect(sql).toContain('from "adventures"');
    expect(sql).toContain('left join "milestones"');
    expect(sql.toLowerCase()).toContain('order by "adventures"."last_played_at" desc');
    expect(params).toContain("user-1");
    expect(params).toContain("active");
  });

  it("buildFindAdventuresByUserQuery applies status filter when provided", () => {
    const { sql, params } = buildFindAdventuresByUserQuery("user-1", "completed").toSQL();

    expect(sql).toContain('from "adventures"');
    expect(params).toContain("user-1");
    expect(params).toContain("completed");
  });

  it("buildFindAdventureByIdQuery scopes by id+userId and uses limit 1", () => {
    const { sql, params } = buildFindAdventureByIdQuery("adv-1", "user-1").toSQL();

    expect(sql).toContain('from "adventures"');
    expect(sql.toLowerCase()).toContain("limit");
    expect(params).toContain("adv-1");
    expect(params).toContain("user-1");
    expect(params).toContain("active");
  });
});

