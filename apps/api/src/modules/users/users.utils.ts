import type { UpdateUserInput } from "./users.schema";

export function isUsernameTakenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const cause = (e["cause"] ?? null) as Record<string, unknown> | null;

  const code = (e["code"] ?? cause?.["code"] ?? null) as unknown;
  if (code !== "23505") return false;

  const constraint = (cause?.["constraint"] ?? e["constraint"] ?? null) as unknown;
  if (constraint === "user_username_unique") return true;

  const detail = String((e["detail"] ?? cause?.["detail"] ?? "") as unknown);
  return detail.includes("username");
}

export function normalizeUpdateInput(input: UpdateUserInput): UpdateUserInput {
  if (input.username && !input.name) {
    return { ...input, name: input.username };
  }
  return input;
}
