import { describe, expect, it } from "vitest";

import { fields, z } from "@/lib/validation";

describe("validation service", () => {
  it("fields.password enforces default min length (8)", () => {
    const schema = z.object({ password: fields.password() });
    const result = schema.safeParse({ password: "1234567" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.password?.[0]).toBe("Min. 8 caractères");
  });

  it("global error map returns French 'required' message for undefined", () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.name?.[0]).toBe("Ce champ est requis");
  });
});

