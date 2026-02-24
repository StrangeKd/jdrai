import { beforeEach, describe, expect, it } from "vitest";

import { useUIStore } from "../ui.store";

// Reset store state before each test to avoid cross-test pollution
beforeEach(() => {
  localStorage.removeItem("jdrai-ui");
  useUIStore.setState({
    adventureModalOpen: false,
    sidebarOpen: true,
    theme: "system",
  });
});

describe("UIStore", () => {
  describe("adventureModalOpen (AC-4, AC-8)", () => {
    it("initial state is false", () => {
      expect(useUIStore.getState().adventureModalOpen).toBe(false);
    });

    it("setAdventureModalOpen(true) opens the modal", () => {
      useUIStore.getState().setAdventureModalOpen(true);
      expect(useUIStore.getState().adventureModalOpen).toBe(true);
    });

    it("setAdventureModalOpen(false) closes the modal", () => {
      useUIStore.setState({ adventureModalOpen: true });
      useUIStore.getState().setAdventureModalOpen(false);
      expect(useUIStore.getState().adventureModalOpen).toBe(false);
    });

    it("toggles correctly between open/closed", () => {
      useUIStore.getState().setAdventureModalOpen(true);
      useUIStore.getState().setAdventureModalOpen(false);
      expect(useUIStore.getState().adventureModalOpen).toBe(false);
    });
  });

  describe("sidebarOpen", () => {
    it("initial state is true", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it("toggleSidebar flips the value", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe("theme", () => {
    it("initial state is system", () => {
      expect(useUIStore.getState().theme).toBe("system");
    });

    it("setTheme updates theme", () => {
      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");
    });
  });
});
