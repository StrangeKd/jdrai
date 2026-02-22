import { describe, expect, it } from "vitest";

import { getErrorMessage } from "@/lib/error-messages";

describe("getErrorMessage", () => {
  it("returns French message for UNAUTHORIZED", () => {
    expect(getErrorMessage("UNAUTHORIZED")).toBe("Veuillez vous connecter.");
  });

  it("returns French message for RATE_LIMITED", () => {
    expect(getErrorMessage("RATE_LIMITED")).toBe("Trop de requêtes, veuillez patienter…");
  });

  it("returns French message for VALIDATION_ERROR", () => {
    expect(getErrorMessage("VALIDATION_ERROR")).toBe("Données invalides.");
  });

  it("returns French message for NOT_FOUND", () => {
    expect(getErrorMessage("NOT_FOUND")).toBe("Ressource introuvable.");
  });

  it("returns French message for INTERNAL_ERROR", () => {
    expect(getErrorMessage("INTERNAL_ERROR")).toBe("Une erreur inattendue est survenue.");
  });

  it("returns French message for MAX_ACTIVE_ADVENTURES", () => {
    expect(getErrorMessage("MAX_ACTIVE_ADVENTURES")).toBe(
      "Vous avez atteint la limite de 5 aventures actives.",
    );
  });

  it("returns French message for USERNAME_TAKEN", () => {
    expect(getErrorMessage("USERNAME_TAKEN")).toBe("Ce pseudo est déjà pris.");
  });
});
